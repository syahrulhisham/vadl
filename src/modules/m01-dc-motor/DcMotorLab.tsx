import { useMemo, useState } from 'react';
import { Button, colors, LinkButton, MeasurementDisplay, NumberControl } from '@/design-system';
import { AssessmentPanel } from '@/features/assessment';
import {
  CharacteristicChart,
  ChartFigure,
  TimeTraceChart,
  toTimeRows,
  type SeriesSpec,
} from '@/features/graphs';
import {
  ActivitiesList,
  LabShell,
  OutcomesList,
  REAL_TIME_PLAYBACK,
  RecordPanel,
  RunControls,
  selectClass,
  TheoryBlock,
  useLabRecords,
} from '@/features/lab-shell';
import { useSimulation } from '@/hooks';
import { t } from '@/i18n';
import {
  CONVERTER_KINDS,
  DC_LIMITS,
  DC_PRESETS,
  dcLoadTorqueAtSpeed,
  dcMotorModel,
  dcSteadySpeedAtTorque,
  degToRad,
  radPerSecToRpm,
  radToDeg,
  rpmToRadPerSec,
  type ConverterKind,
  type DcMotorParams,
  type DcPresetName,
  type Issue,
  type LoadExponent,
  type MotorType,
  type SupplyMode,
} from '@/sim-core';
import { M01_ACTIVITIES, M01_LABELS as L, M01_OUTCOMES, M01_THEORY, M01_VIEWS } from './content.en';
import { DcMotorDiagram } from './DcMotorDiagram';
import { DriveScope } from './DriveScope';
import { OperatingPrinciple } from './OperatingPrinciple';
import { M01_QUESTIONS } from './questions';
import { M01_RESULT_COLUMNS, numericParameters } from './results';

export const M01_ID = 'm01-dc-motor';
type WorkspaceView = 'circuit' | 'principle' | 'scope';
const VIEWS: readonly WorkspaceView[] = ['circuit', 'principle', 'scope'];
const WINDOW_SECONDS = 5;
const PRESETS: readonly { name: DcPresetName; label: string }[] = [
  { name: 'separatelyExcited', label: L.presetSeparatelyExcited },
  { name: 'shunt', label: L.presetShunt },
  { name: 'series', label: L.presetSeries },
  { name: 'converterFed', label: L.presetConverterFed },
];
const SPEED_SERIES: readonly SeriesSpec[] = [
  { key: 'speedRpm', label: L.measurements.speedRpm, unit: 'rpm', color: colors.navy[700] },
];
const CURRENT_SERIES: readonly SeriesSpec[] = [
  {
    key: 'armatureCurrent',
    label: L.measurements.armatureCurrent,
    unit: 'A',
    color: colors.navy[500],
  },
];
/** M01 DC Motor Drives laboratory: all seven regions (FR-02). */
export default function DcMotorLab() {
  const sim = useSimulation(dcMotorModel, {
    timeScale: 1,
    recordInterval: 0.005,
    recorderCapacity: 6000,
  });
  const [playback, setPlayback] = useState(1);
  const [issues, setIssues] = useState<Issue[]>([]);
  const lab = useLabRecords(M01_ID);
  const [view, setView] = useState<WorkspaceView>('circuit');

  const p = sim.params;
  const out = sim.outputs;
  const locked = sim.status !== 'idle';
  const isSeries = p.motorType === 'series';
  const isConverter = p.supply === 'converter';

  function set<K extends keyof DcMotorParams>(key: K, value: DcMotorParams[K]) {
    setIssues(
      sim
        .setParams({ ...p, [key]: value })
        .filter((i) => i.severity === 'error' || key === i.parameter),
    );
  }

  function preset(name: DcPresetName) {
    setIssues(sim.setParams(DC_PRESETS[name]));
  }

  function changePlayback(v: number) {
    setPlayback(v);
    sim.setTimeScale(v);
  }

  function record() {
    lab.record({ time: sim.time, parameters: numericParameters(p), measurements: { ...out } });
  }

  // ---- graphs: data only from the model -------------------------------------
  const tNow = sim.time;
  const xMin = Math.max(0, tNow - WINDOW_SECONDS);
  const xMax = Math.max(WINDOW_SECONDS, tNow);
  const windowTrace = sim.trace.filter((s) => s.t >= xMin);
  const speedRows = toTimeRows(windowTrace, SPEED_SERIES, 1);
  const currentRows = toTimeRows(windowTrace, CURRENT_SERIES, 1);

  const characteristic = useMemo(() => {
    const tMax = Math.max(2 * p.loadC * p.loadRatedTorque, 10);
    const motor = Array.from({ length: 61 }, (_, i) => {
      const torque = isSeries ? (tMax * (i + 1)) / 61 : (tMax * i) / 60;
      return { x: torque, y: radPerSecToRpm(dcSteadySpeedAtTorque(p, torque)) };
    }).filter((pt) => Number.isFinite(pt.y));
    const nRef = Math.max(
      p.loadRatedSpeedRpm,
      ...motor
        .map((pt) => pt.y)
        .filter((y) => y > 0)
        .slice(0, 1),
    );
    const yMax = Math.ceil((1.3 * Math.max(nRef, p.loadRatedSpeedRpm)) / 100) * 100;
    const load = Array.from({ length: 41 }, (_, i) => {
      const n = (yMax * i) / 40;
      return { x: dcLoadTorqueAtSpeed(p, rpmToRadPerSec(n)), y: n };
    }).filter((pt) => pt.x <= tMax * 1.5);
    return {
      motor: motor.filter((pt) => pt.y >= 0 && pt.y <= yMax),
      load,
      yMax,
    };
  }, [p, isSeries]);

  const lim = DC_LIMITS;
  const degLimit = { min: radToDeg(lim.alpha.min), max: radToDeg(lim.alpha.max) };

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <LinkButton to={`/reports/${M01_ID}`} variant="secondary">
          {L.openReport}
        </LinkButton>
        <span className="text-sm text-navy-600">{L.dataNote}</span>
      </div>
      <LabShell
        placeholderMilestone={4}
        regions={{
          theory: (
            <div className="space-y-4 text-sm">
              <p>{M01_THEORY.intro}</p>
              <OutcomesList outcomes={M01_OUTCOMES} />
              <TheoryBlock title={M01_THEORY.equationsTitle} items={M01_THEORY.equations} mono />
              <TheoryBlock
                title={M01_THEORY.convertersTitle}
                items={M01_THEORY.converters}
                mono
                collapsible
              />
              <TheoryBlock title={M01_THEORY.typesTitle} items={M01_THEORY.types} collapsible />
              <TheoryBlock title={M01_THEORY.quadrantsTitle} collapsible>
                <p className="mt-1">{M01_THEORY.quadrants}</p>
              </TheoryBlock>
              <TheoryBlock
                title={t('lab.assumptionsTitle')}
                items={dcMotorModel.assumptions}
                collapsible
              />
            </div>
          ),

          workspace: (
            <div className="space-y-3">
              <fieldset>
                <legend className="text-sm font-medium text-navy-800">{M01_VIEWS.legend}</legend>
                <div className="mt-1 flex flex-wrap gap-2">
                  {VIEWS.map((v) => (
                    <Button
                      key={v}
                      variant={view === v ? 'primary' : 'secondary'}
                      aria-pressed={view === v}
                      onClick={() => setView(v)}
                    >
                      {M01_VIEWS[v]}
                    </Button>
                  ))}
                </div>
              </fieldset>
              {view === 'circuit' ? (
                <DcMotorDiagram params={p} outputs={out} running={sim.status === 'running'} />
              ) : view === 'principle' ? (
                <OperatingPrinciple outputs={out} />
              ) : (
                <DriveScope params={p} outputs={out} />
              )}
              <RunControls
                status={sim.status}
                lagging={sim.lagging}
                onStart={sim.start}
                onPause={sim.pause}
                onStop={sim.stop}
                onReset={sim.reset}
                playback={playback}
                playbackOptions={REAL_TIME_PLAYBACK.map((o) => ({
                  value: o.value,
                  label: t(o.label),
                }))}
                onPlayback={changePlayback}
              />
            </div>
          ),

          controls: (
            <div className="space-y-4">
              <fieldset disabled={locked}>
                <legend className="text-sm font-medium text-navy-800">{L.presets}</legend>
                <div className="mt-1 flex flex-wrap gap-2">
                  {PRESETS.map((pr) => (
                    <Button key={pr.name} variant="secondary" onClick={() => preset(pr.name)}>
                      {pr.label}
                    </Button>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-sm font-medium text-navy-800">
                  {L.motorType}
                  <select
                    className={selectClass}
                    value={p.motorType}
                    disabled={locked}
                    onChange={(e) => set('motorType', e.target.value as MotorType)}
                  >
                    {(Object.keys(L.motorTypes) as MotorType[]).map((m) => (
                      <option key={m} value={m}>
                        {L.motorTypes[m]}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block text-sm font-medium text-navy-800">
                  {L.supply}
                  <select
                    className={selectClass}
                    value={p.supply}
                    disabled={locked}
                    onChange={(e) => set('supply', e.target.value as SupplyMode)}
                  >
                    <option value="dc">{L.supplyDc}</option>
                    <option value="converter">{L.supplyConverter}</option>
                  </select>
                </label>
              </div>

              {isConverter ? (
                <>
                  <NumberControl
                    label={L.supplyRms}
                    value={p.supplyRms}
                    min={lim.supplyRms.min}
                    max={lim.supplyRms.max}
                    step={10}
                    unit="V"
                    onChange={(v) => set('supplyRms', v)}
                  />
                  <label className="block text-sm font-medium text-navy-800">
                    {L.armatureConverter}
                    <select
                      className={selectClass}
                      value={p.armatureConverter}
                      disabled={locked}
                      onChange={(e) => set('armatureConverter', e.target.value as ConverterKind)}
                    >
                      {CONVERTER_KINDS.map((k) => (
                        <option key={k} value={k}>
                          {L.converters[k]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <NumberControl
                    label={L.alphaArmature}
                    value={Math.round(radToDeg(p.alphaArmature) * 100) / 100}
                    min={degLimit.min}
                    max={degLimit.max}
                    step={1}
                    unit="°"
                    onChange={(v) => set('alphaArmature', degToRad(v))}
                  />
                  {p.motorType === 'separately-excited' ? (
                    <>
                      <label className="block text-sm font-medium text-navy-800">
                        {L.fieldConverter}
                        <select
                          className={selectClass}
                          value={p.fieldConverter}
                          disabled={locked}
                          onChange={(e) => set('fieldConverter', e.target.value as ConverterKind)}
                        >
                          {CONVERTER_KINDS.map((k) => (
                            <option key={k} value={k}>
                              {L.converters[k]}
                            </option>
                          ))}
                        </select>
                      </label>
                      <NumberControl
                        label={L.alphaField}
                        value={Math.round(radToDeg(p.alphaField) * 100) / 100}
                        min={degLimit.min}
                        max={degLimit.max}
                        step={1}
                        unit="°"
                        onChange={(v) => set('alphaField', degToRad(v))}
                      />
                    </>
                  ) : null}
                </>
              ) : (
                <>
                  <NumberControl
                    label={L.armatureVoltage}
                    value={p.armatureVoltage}
                    min={lim.armatureVoltage.min}
                    max={lim.armatureVoltage.max}
                    step={1}
                    unit="V"
                    onChange={(v) => set('armatureVoltage', v)}
                  />
                  {p.motorType === 'separately-excited' ? (
                    <NumberControl
                      label={L.fieldVoltage}
                      value={p.fieldVoltage}
                      min={lim.fieldVoltage.min}
                      max={lim.fieldVoltage.max}
                      step={1}
                      unit="V"
                      onChange={(v) => set('fieldVoltage', v)}
                    />
                  ) : null}
                </>
              )}
              <NumberControl
                label={L.rst}
                value={p.rst}
                min={lim.rst.min}
                max={lim.rst.max}
                step={0.5}
                unit="Ω"
                onChange={(v) => set('rst', v)}
              />

              <details className="rounded-md border border-navy-100 p-3" open={!locked}>
                <summary className="min-h-touch cursor-pointer py-2 text-sm font-semibold text-navy-800">
                  {L.loadTitle}
                </summary>
                <div className="mt-2 space-y-4">
                  <label className="block text-sm font-medium text-navy-800">
                    {L.loadExponent}
                    <select
                      className={selectClass}
                      value={String(p.loadExponent)}
                      onChange={(e) => set('loadExponent', Number(e.target.value) as LoadExponent)}
                    >
                      {(['0', '1', '2', '-1'] as const).map((k) => (
                        <option key={k} value={k}>
                          {L.loadTypes[k]}
                        </option>
                      ))}
                    </select>
                  </label>
                  <NumberControl
                    label={L.loadRatedTorque}
                    value={p.loadRatedTorque}
                    min={lim.loadRatedTorque.min}
                    max={lim.loadRatedTorque.max}
                    step={1}
                    unit="N·m"
                    onChange={(v) => set('loadRatedTorque', v)}
                  />
                  <NumberControl
                    label={L.loadRatedSpeedRpm}
                    value={p.loadRatedSpeedRpm}
                    min={lim.loadRatedSpeedRpm.min}
                    max={lim.loadRatedSpeedRpm.max}
                    step={50}
                    unit="rpm"
                    onChange={(v) => set('loadRatedSpeedRpm', v)}
                  />
                  <NumberControl
                    label={L.loadC}
                    value={p.loadC}
                    min={lim.loadC.min}
                    max={lim.loadC.max}
                    step={0.05}
                    unit="—"
                    onChange={(v) => set('loadC', v)}
                  />
                  <NumberControl
                    label={L.friction}
                    value={p.friction}
                    min={lim.friction.min}
                    max={lim.friction.max}
                    step={0.001}
                    unit="N·m·s/rad"
                    onChange={(v) => set('friction', v)}
                  />
                  <NumberControl
                    label={L.inertia}
                    value={p.inertia}
                    min={lim.inertia.min}
                    max={lim.inertia.max}
                    step={0.01}
                    unit="kg·m²"
                    disabled={locked}
                    onChange={(v) => set('inertia', v)}
                  />
                </div>
              </details>

              <details className="rounded-md border border-navy-100 p-3">
                <summary className="min-h-touch cursor-pointer py-2 text-sm font-semibold text-navy-800">
                  {L.machineTitle}
                </summary>
                <div className="mt-2 space-y-4">
                  <NumberControl
                    label={L.ra}
                    value={p.ra}
                    min={lim.ra.min}
                    max={lim.ra.max}
                    step={0.01}
                    unit="Ω"
                    disabled={locked}
                    onChange={(v) => set('ra', v)}
                  />
                  <NumberControl
                    label={L.la}
                    value={p.la}
                    min={lim.la.min}
                    max={lim.la.max}
                    step={0.001}
                    unit="H"
                    disabled={locked}
                    onChange={(v) => set('la', v)}
                  />
                  {isSeries ? (
                    <>
                      <NumberControl
                        label={L.kaf}
                        value={p.kaf}
                        min={lim.kaf.min}
                        max={lim.kaf.max}
                        step={0.001}
                        unit="H"
                        disabled={locked}
                        onChange={(v) => set('kaf', v)}
                      />
                      <NumberControl
                        label={L.rs}
                        value={p.rs}
                        min={lim.rs.min}
                        max={lim.rs.max}
                        step={0.01}
                        unit="Ω"
                        disabled={locked}
                        onChange={(v) => set('rs', v)}
                      />
                      <NumberControl
                        label={L.ls}
                        value={p.ls}
                        min={lim.ls.min}
                        max={lim.ls.max}
                        step={0.001}
                        unit="H"
                        disabled={locked}
                        onChange={(v) => set('ls', v)}
                      />
                    </>
                  ) : (
                    <>
                      <NumberControl
                        label={L.kv}
                        value={p.kv}
                        min={lim.kv.min}
                        max={lim.kv.max}
                        step={0.01}
                        unit="V/(A·rad/s)"
                        disabled={locked}
                        onChange={(v) => set('kv', v)}
                      />
                      <NumberControl
                        label={L.rf}
                        value={p.rf}
                        min={lim.rf.min}
                        max={lim.rf.max}
                        step={1}
                        unit="Ω"
                        disabled={locked}
                        onChange={(v) => set('rf', v)}
                      />
                    </>
                  )}
                </div>
              </details>

              {issues.length > 0 ? (
                <div
                  role="alert"
                  className="space-y-1 rounded bg-status-dangerBg px-3 py-2 text-sm text-status-danger"
                >
                  {issues.map((i) => (
                    <p key={i.message}>{i.message}</p>
                  ))}
                </div>
              ) : null}
              <p className="text-sm text-navy-600">{L.liveHint}</p>
            </div>
          ),

          measurements: (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                <MeasurementDisplay
                  label={L.measurements.time}
                  symbol="t"
                  value={sim.time}
                  unit="s"
                />
                <MeasurementDisplay
                  label={L.measurements.speedRpm}
                  symbol="n"
                  value={out.speedRpm}
                  unit="rpm"
                />
                <MeasurementDisplay
                  label={L.measurements.speed}
                  symbol="ω"
                  value={out.speed}
                  unit="rad/s"
                />
                <MeasurementDisplay
                  label={L.measurements.armatureCurrent}
                  symbol="Ia"
                  value={out.armatureCurrent}
                  unit="A"
                />
                <MeasurementDisplay
                  label={L.measurements.armatureVoltage}
                  symbol="Va"
                  value={out.armatureVoltage}
                  unit="V"
                />
                <MeasurementDisplay
                  label={L.measurements.backEmf}
                  symbol="Eg"
                  value={out.backEmf}
                  unit="V"
                />
                <MeasurementDisplay
                  label={L.measurements.fieldCurrent}
                  symbol="If"
                  value={out.fieldCurrent}
                  unit="A"
                />
                <MeasurementDisplay
                  label={L.measurements.torque}
                  symbol="Td"
                  value={out.torque}
                  unit="N·m"
                />
                <MeasurementDisplay
                  label={L.measurements.loadTorque}
                  symbol="TL"
                  value={out.loadTorque}
                  unit="N·m"
                />
                <MeasurementDisplay
                  label={L.measurements.inputPower}
                  symbol="Pin"
                  value={out.inputPower}
                  unit="W"
                />
                <MeasurementDisplay
                  label={L.measurements.outputPower}
                  symbol="Pout"
                  value={out.outputPower}
                  unit="W"
                />
                <MeasurementDisplay
                  label={L.measurements.efficiency}
                  symbol="η"
                  value={100 * out.efficiency}
                  unit="%"
                />
              </div>
              {out.conductionBlocked ? (
                <p className="rounded bg-status-warningBg px-3 py-2 text-sm text-status-warning">
                  {L.conductionBlocked}
                </p>
              ) : null}
              <RecordPanel
                rows={lab.rows}
                columns={M01_RESULT_COLUMNS}
                onRecord={record}
                onClear={lab.clear}
              />
            </div>
          ),

          graphs: (
            <div className="space-y-6">
              <ChartFigure
                title={L.speedTrace}
                description={L.speedTraceDesc}
                columns={[
                  { key: 't', label: 't (s)' },
                  { key: 'speedRpm', label: 'n (rpm)' },
                ]}
                rows={speedRows}
                testId="speed-chart"
              >
                <TimeTraceChart
                  rows={speedRows}
                  series={SPEED_SERIES}
                  timeUnit="s"
                  yLabel="n (rpm)"
                  xMin={xMin}
                  xMax={xMax}
                  height={220}
                />
              </ChartFigure>
              <ChartFigure
                title={L.currentTrace}
                description={L.currentTraceDesc}
                columns={[
                  { key: 't', label: 't (s)' },
                  { key: 'armatureCurrent', label: 'Ia (A)' },
                ]}
                rows={currentRows}
                testId="current-chart"
              >
                <TimeTraceChart
                  rows={currentRows}
                  series={CURRENT_SERIES}
                  timeUnit="s"
                  yLabel="Ia (A)"
                  xMin={xMin}
                  xMax={xMax}
                  height={220}
                />
              </ChartFigure>
              <ChartFigure
                title={L.characteristic}
                description={L.characteristicDesc}
                columns={[
                  { key: 'x', label: 'T (N·m)' },
                  { key: 'y', label: 'n (rpm)' },
                ]}
                rows={characteristic.motor}
                testId="characteristic-chart"
              >
                <CharacteristicChart
                  curve={characteristic.motor}
                  curveName={L.motorCurve}
                  extraCurves={[
                    { name: L.loadCurve, color: colors.lightblue[400], data: characteristic.load },
                  ]}
                  point={{ x: out.torque, y: out.speedRpm }}
                  xLabel="Torque (N·m)"
                  yLabel="Speed (rpm)"
                  yDomain={[0, characteristic.yMax]}
                />
              </ChartFigure>
            </div>
          ),

          instructions: (
            <ActivitiesList
              activities={M01_ACTIVITIES}
              done={lab.done}
              onToggle={lab.toggleActivity}
            />
          ),

          assessment: <AssessmentPanel moduleId={M01_ID} questions={M01_QUESTIONS} />,
        }}
      />
    </>
  );
}
