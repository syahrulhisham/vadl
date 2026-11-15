import { useMemo, useState } from 'react';
import { Button, LinkButton, MeasurementDisplay, NumberControl } from '@/design-system';
import { AssessmentPanel } from '@/features/assessment';
import { CharacteristicChart, ChartFigure } from '@/features/graphs';
import {
  ActivitiesList,
  LabShell,
  OutcomesList,
  REAL_TIME_PLAYBACK,
  RecordPanel,
  RunControls,
  SelectField,
  TheoryBlock,
  useLabRecords,
} from '@/features/lab-shell';
import { useSimulation } from '@/hooks';
import { t } from '@/i18n';
import {
  beltPower,
  beltSpeed,
  formatSignificant,
  liftingPulley,
  mmToM,
  mToMm,
  radPerSecToRpm,
  rpmToRadPerSec,
  TRANSMISSION_LIMITS,
  TRANSMISSION_PRESETS,
  transmissionModel,
  type DriveKind,
  type DriveStage,
  type Issue,
  type TransmissionParams,
  type TransmissionPresetName,
} from '@/sim-core';
import { M06_ACTIVITIES, M06_LABELS as L, M06_OUTCOMES, M06_THEORY } from './content.en';
import { M06_QUESTIONS } from './questions';
import { M06_RESULT_COLUMNS, numericParameters, wheelsOf } from './results';
import { BeltDiagram, LiftDiagram, TrainDiagram } from './TransmissionDiagrams';

export const M06_ID = 'm06-transmission';
type View = 'train' | 'belt' | 'lift';
const PRESETS: readonly TransmissionPresetName[] = [
  'simple',
  'idler',
  'compound',
  'beltTrain',
  'chain',
];
const KINDS: readonly DriveKind[] = ['gear', 'belt-open', 'belt-crossed', 'chain'];
const lim = TRANSMISSION_LIMITS;
const fmt = (v: number) => formatSignificant(v, 4);

function defaultStage(kind: DriveKind): DriveStage {
  return kind === 'belt-open' || kind === 'belt-crossed'
    ? { kind, driver: 0.1, driven: 0.2, idler: 0, efficiency: 1 }
    : { kind, driver: 20, driven: 40, idler: 0, efficiency: 1 };
}

/** M06 Mechanical Transmission laboratory: all seven regions (FR-02). */
export default function TransmissionLab() {
  const sim = useSimulation(transmissionModel, { timeScale: 1, recorderCapacity: 2000 });
  const lab = useLabRecords(M06_ID);
  const [view, setView] = useState<View>('train');
  const [playback, setPlayback] = useState(1);
  const [issues, setIssues] = useState<Issue[]>([]);
  const p = sim.params;
  const out = sim.outputs;
  const locked = sim.status !== 'idle';

  function apply(next: TransmissionParams, key?: string) {
    setIssues(
      sim
        .setParams(next)
        .filter((i) => i.severity === 'error' || key === undefined || i.parameter === key),
    );
  }
  function set<K extends keyof TransmissionParams>(key: K, value: TransmissionParams[K]) {
    apply({ ...p, [key]: value }, key);
  }
  function setStage(i: number, patch: Partial<DriveStage>) {
    const stages = p.stages.map((s, k) => (k === i ? { ...s, ...patch } : s));
    apply({ ...p, stages }, `stage${i + 1}`);
  }
  function setStageCount(n: number) {
    const stages = Array.from({ length: n }, (_, k) => p.stages[k] ?? defaultStage('gear'));
    apply({ ...p, stages });
  }
  function changePlayback(v: number) {
    setPlayback(v);
    sim.setTimeScale(v);
  }

  const wheels = wheelsOf(p);
  const speedPoints = p.stages.length
    ? Array.from({ length: p.stages.length + 1 }, (_, k) => ({ x: k, y: out[`speedRpm${k}`] ?? 0 }))
    : [];
  const powerCurve = useMemo(() => {
    const nMax = Math.max(100, 2 * radPerSecToRpm(p.inputSpeed));
    return Array.from({ length: 21 }, (_, i) => {
      const n = (nMax * i) / 20;
      return {
        x: n,
        y: beltPower(p.beltTight, p.beltSlack, beltSpeed(rpmToRadPerSec(n), p.beltDriverRadius)),
      };
    });
  }, [p.inputSpeed, p.beltTight, p.beltSlack, p.beltDriverRadius]);
  const effortCurve = useMemo(
    () =>
      Array.from({ length: 8 }, (_, i) => ({
        x: i + 1,
        y: liftingPulley(i + 1, p.liftLoad, p.liftHeight, p.liftEfficiency).effort,
      })),
    [p.liftLoad, p.liftHeight, p.liftEfficiency],
  );

  const sizeText = (kind: DriveKind, size: number) =>
    kind === 'belt-open' || kind === 'belt-crossed' ? `${fmt(mToMm(size))} mm` : `${size}T`;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <LinkButton to={`/reports/${M06_ID}`} variant="secondary">
          {L.openReport}
        </LinkButton>
        <span className="text-sm text-navy-600">{L.dataNote}</span>
      </div>
      <LabShell
        placeholderMilestone={7}
        regions={{
          theory: (
            <div className="space-y-4 text-sm">
              <p>{M06_THEORY.intro}</p>
              <OutcomesList outcomes={M06_OUTCOMES} />
              <TheoryBlock title={M06_THEORY.conventionTitle}>
                <p className="mt-1">{M06_THEORY.convention}</p>
              </TheoryBlock>
              <TheoryBlock title={M06_THEORY.equationsTitle} items={M06_THEORY.equations} mono />
              <TheoryBlock title={M06_THEORY.typesTitle} items={M06_THEORY.types} collapsible />
              <TheoryBlock
                title={M06_THEORY.extensionTitle}
                items={M06_THEORY.extension}
                collapsible
              />
              <TheoryBlock
                title={t('lab.assumptionsTitle')}
                items={transmissionModel.assumptions}
                collapsible
              />
            </div>
          ),

          workspace: (
            <div className="space-y-3">
              <fieldset>
                <legend className="text-sm font-medium text-navy-800">{L.view}</legend>
                <div className="mt-1 flex flex-wrap gap-2">
                  {(['train', 'belt', 'lift'] as const).map((v) => (
                    <Button
                      key={v}
                      variant={view === v ? 'primary' : 'secondary'}
                      aria-pressed={view === v}
                      onClick={() => setView(v)}
                    >
                      {L.views[v]}
                    </Button>
                  ))}
                </div>
              </fieldset>
              {view === 'train' ? (
                <figure>
                  <figcaption className="text-sm font-medium text-navy-800">{L.diagram}</figcaption>
                  <TrainDiagram params={p} outputs={out} />
                </figure>
              ) : view === 'belt' ? (
                <figure>
                  <figcaption className="text-sm font-medium text-navy-800">
                    {L.beltDiagram}
                  </figcaption>
                  <BeltDiagram params={p} />
                </figure>
              ) : (
                <figure>
                  <figcaption className="text-sm font-medium text-navy-800">
                    {L.liftDiagram}
                  </figcaption>
                  <LiftDiagram params={p} outputs={out} />
                </figure>
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
              {view === 'train' ? (
                <>
                  <fieldset disabled={locked}>
                    <legend className="text-sm font-medium text-navy-800">{L.presets}</legend>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {PRESETS.map((name) => (
                        <Button
                          key={name}
                          variant="secondary"
                          onClick={() => apply(TRANSMISSION_PRESETS[name])}
                        >
                          {L.presetNames[name]}
                        </Button>
                      ))}
                    </div>
                  </fieldset>
                  <NumberControl
                    label={L.inputSpeed}
                    value={Number(radPerSecToRpm(p.inputSpeed).toFixed(3))}
                    min={0}
                    max={3600}
                    step={10}
                    unit="rpm"
                    onChange={(v) => set('inputSpeed', rpmToRadPerSec(v))}
                  />
                  <fieldset>
                    <legend className="text-sm font-medium text-navy-800">{L.direction}</legend>
                    <div className="mt-1 flex flex-wrap gap-2">
                      {([1, -1] as const).map((d) => (
                        <Button
                          key={d}
                          variant={p.inputDirection === d ? 'primary' : 'secondary'}
                          aria-pressed={p.inputDirection === d}
                          onClick={() => set('inputDirection', d)}
                        >
                          {d === 1 ? L.cw : L.ccw}
                        </Button>
                      ))}
                    </div>
                  </fieldset>
                  <SelectField<string>
                    label={L.stages}
                    value={String(p.stages.length)}
                    disabled={locked}
                    options={['1', '2', '3'].map((n) => ({ value: n, label: n }))}
                    onChange={(v) => setStageCount(Number(v))}
                  />
                  {p.stages.map((s, i) => {
                    const belt = s.kind === 'belt-open' || s.kind === 'belt-crossed';
                    return (
                      <fieldset key={i} className="space-y-3 rounded-md border border-navy-100 p-3">
                        <legend className="px-1 text-sm font-semibold text-navy-800">
                          {L.stage} {i + 1}
                        </legend>
                        <SelectField<DriveKind>
                          label={`${L.kind} (${L.stage.toLowerCase()} ${i + 1})`}
                          value={s.kind}
                          disabled={locked}
                          options={KINDS.map((k) => ({ value: k, label: L.kinds[k] }))}
                          onChange={(k) => {
                            const stages = p.stages.map((x, j) => (j === i ? defaultStage(k) : x));
                            apply({ ...p, stages }, `stage${i + 1}`);
                          }}
                        />
                        <NumberControl
                          label={`${belt ? L.driverDiameter : L.driverTeeth} (${L.stage.toLowerCase()} ${i + 1})`}
                          value={belt ? mToMm(s.driver) : s.driver}
                          min={belt ? 10 : lim.teeth.min}
                          max={belt ? 1000 : lim.teeth.max}
                          step={belt ? 5 : 1}
                          unit={belt ? 'mm' : 'T'}
                          onChange={(v) => setStage(i, { driver: belt ? mmToM(v) : v })}
                        />
                        <NumberControl
                          label={`${belt ? L.drivenDiameter : L.drivenTeeth} (${L.stage.toLowerCase()} ${i + 1})`}
                          value={belt ? mToMm(s.driven) : s.driven}
                          min={belt ? 10 : lim.teeth.min}
                          max={belt ? 1000 : lim.teeth.max}
                          step={belt ? 5 : 1}
                          unit={belt ? 'mm' : 'T'}
                          onChange={(v) => setStage(i, { driven: belt ? mmToM(v) : v })}
                        />
                        {s.kind === 'gear' ? (
                          <NumberControl
                            label={`${L.idler} (${L.stage.toLowerCase()} ${i + 1})`}
                            value={s.idler}
                            min={0}
                            max={lim.teeth.max}
                            step={1}
                            unit="T"
                            onChange={(v) => setStage(i, { idler: v })}
                          />
                        ) : null}
                      </fieldset>
                    );
                  })}
                  <details className="rounded-md border border-navy-100 p-3">
                    <summary className="min-h-touch cursor-pointer py-2 text-sm font-semibold text-navy-800">
                      {L.extensionTitle}
                    </summary>
                    <div className="mt-2 space-y-4">
                      <NumberControl
                        label={L.inputTorque}
                        value={p.inputTorque}
                        min={lim.inputTorque.min}
                        max={lim.inputTorque.max}
                        step={1}
                        unit="N·m"
                        onChange={(v) => set('inputTorque', v)}
                      />
                      {p.stages.map((s, i) => (
                        <NumberControl
                          key={i}
                          label={`${L.efficiency} (${L.stage.toLowerCase()} ${i + 1})`}
                          value={s.efficiency}
                          min={lim.efficiency.min}
                          max={lim.efficiency.max}
                          step={0.01}
                          unit="—"
                          onChange={(v) => setStage(i, { efficiency: v })}
                        />
                      ))}
                    </div>
                  </details>
                </>
              ) : view === 'belt' ? (
                <>
                  <NumberControl
                    label={L.beltTight}
                    value={p.beltTight}
                    min={0}
                    max={20000}
                    step={10}
                    unit="N"
                    onChange={(v) => set('beltTight', v)}
                  />
                  <NumberControl
                    label={L.beltSlack}
                    value={p.beltSlack}
                    min={0}
                    max={20000}
                    step={10}
                    unit="N"
                    onChange={(v) => set('beltSlack', v)}
                  />
                  <NumberControl
                    label={L.beltDriverRadius}
                    value={mToMm(p.beltDriverRadius)}
                    min={5}
                    max={500}
                    step={5}
                    unit="mm"
                    onChange={(v) => set('beltDriverRadius', mmToM(v))}
                  />
                  <NumberControl
                    label={L.beltDrivenRadius}
                    value={mToMm(p.beltDrivenRadius)}
                    min={5}
                    max={500}
                    step={5}
                    unit="mm"
                    onChange={(v) => set('beltDrivenRadius', mmToM(v))}
                  />
                  <NumberControl
                    label={L.inputSpeed}
                    value={Number(radPerSecToRpm(p.inputSpeed).toFixed(3))}
                    min={0}
                    max={3600}
                    step={10}
                    unit="rpm"
                    onChange={(v) => set('inputSpeed', rpmToRadPerSec(v))}
                  />
                  <p className="text-sm text-navy-600">{L.beltNote}</p>
                </>
              ) : (
                <>
                  <NumberControl
                    label={L.liftSupports}
                    value={p.liftSupports}
                    min={1}
                    max={8}
                    step={1}
                    unit="—"
                    onChange={(v) => set('liftSupports', v)}
                  />
                  <NumberControl
                    label={L.liftLoad}
                    value={p.liftLoad}
                    min={1}
                    max={10000}
                    step={10}
                    unit="N"
                    onChange={(v) => set('liftLoad', v)}
                  />
                  <NumberControl
                    label={L.liftHeight}
                    value={p.liftHeight}
                    min={0.01}
                    max={100}
                    step={0.1}
                    unit="m"
                    onChange={(v) => set('liftHeight', v)}
                  />
                  <NumberControl
                    label={L.liftEfficiency}
                    value={p.liftEfficiency}
                    min={lim.liftEfficiency.min}
                    max={lim.liftEfficiency.max}
                    step={0.05}
                    unit="—"
                    onChange={(v) => set('liftEfficiency', v)}
                  />
                </>
              )}
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
              {view === 'train' ? (
                <>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                    <MeasurementDisplay
                      label={L.measurements.overallRatio}
                      symbol="G"
                      value={out.overallRatio}
                      unit=""
                    />
                    <MeasurementDisplay
                      label={L.measurements.outputSpeed}
                      symbol="N out"
                      value={Math.abs(out.outputSpeedRpm)}
                      unit="rpm"
                    />
                    <MeasurementDisplay
                      label={L.measurements.outputTorque}
                      symbol="T out"
                      value={out.outputTorque}
                      unit="N·m"
                    />
                    <MeasurementDisplay
                      label={L.measurements.outputPower}
                      symbol="P out"
                      value={out.outputPower}
                      unit="W"
                    />
                  </div>
                  <div className="overflow-x-auto">
                    <table className="text-sm" data-testid="wheel-table">
                      <caption className="mb-1 text-left font-semibold text-navy-800">
                        {L.trainTable}
                      </caption>
                      <thead>
                        <tr className="text-left text-navy-800">
                          {[L.wheel, L.size, L.speed, L.dir, L.torque].map((h) => (
                            <th key={h} scope="col" className="pr-4">
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {wheels.map((w) => {
                          const kind = p.stages[w.stage]?.kind ?? 'gear';
                          const rpm =
                            w.shaft >= 0
                              ? (out[`speedRpm${w.shaft}`] ?? 0)
                              : (out[`idlerSpeedRpm${w.stage + 1}`] ?? 0);
                          return (
                            <tr key={w.letter}>
                              <th scope="row" className="pr-4 text-left">
                                {w.letter}
                                {w.role === 'idler' ? L.idlerTag : ''}
                              </th>
                              <td className="pr-4">{sizeText(kind, w.size)}</td>
                              <td className="pr-4 tabular-nums">{fmt(Math.abs(rpm))}</td>
                              <td className="pr-4">{rpm > 0 ? L.cw : rpm < 0 ? L.ccw : '—'}</td>
                              <td className="tabular-nums">
                                {w.shaft >= 0 ? fmt(out[`torque${w.shaft}`] ?? 0) : '—'}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : view === 'belt' ? (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MeasurementDisplay
                    label={L.measurements.beltTorqueDriver}
                    symbol="T_A"
                    value={out.beltTorqueDriver}
                    unit="N·m"
                  />
                  <MeasurementDisplay
                    label={L.measurements.beltTorqueDriven}
                    symbol="T_B"
                    value={out.beltTorqueDriven}
                    unit="N·m"
                  />
                  <MeasurementDisplay
                    label={L.measurements.beltSpeed}
                    symbol="v"
                    value={out.beltSpeed}
                    unit="m/s"
                  />
                  <MeasurementDisplay
                    label={L.measurements.beltPower}
                    symbol="P"
                    value={out.beltPower}
                    unit="W"
                  />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                  <MeasurementDisplay
                    label={L.measurements.liftEffort}
                    symbol="E"
                    value={out.liftEffort}
                    unit="N"
                  />
                  <MeasurementDisplay
                    label={L.measurements.liftMA}
                    symbol="MA"
                    value={out.liftMA}
                    unit=""
                  />
                  <MeasurementDisplay
                    label={L.measurements.liftVR}
                    symbol="VR"
                    value={out.liftVR}
                    unit=""
                  />
                  <MeasurementDisplay
                    label={L.measurements.liftEfficiency}
                    symbol="η"
                    value={100 * out.liftEfficiency}
                    unit="%"
                  />
                  <MeasurementDisplay
                    label={L.measurements.liftEffortDistance}
                    symbol="dE"
                    value={out.liftEffortDistance}
                    unit="m"
                  />
                </div>
              )}
              <RecordPanel
                rows={lab.rows}
                columns={M06_RESULT_COLUMNS}
                onRecord={() =>
                  lab.record({
                    time: sim.time,
                    parameters: numericParameters(p),
                    measurements: { ...out },
                  })
                }
                onClear={lab.clear}
              />
            </div>
          ),

          graphs: (
            <div className="space-y-6">
              {view === 'train' ? (
                <ChartFigure
                  title={L.speedsTitle}
                  description={L.speedsDesc}
                  columns={[
                    { key: 'x', label: 'shaft' },
                    { key: 'y', label: 'N (rpm, + CW)' },
                  ]}
                  rows={speedPoints}
                  testId="shaft-speed-chart"
                >
                  <CharacteristicChart
                    curve={speedPoints}
                    point={null}
                    xLabel="Shaft (0 = input)"
                    yLabel="Speed (rpm, + clockwise)"
                  />
                </ChartFigure>
              ) : view === 'belt' ? (
                <ChartFigure
                  title={L.powerTitle}
                  description={L.powerDesc}
                  columns={[
                    { key: 'x', label: 'N (rpm)' },
                    { key: 'y', label: 'P (W)' },
                  ]}
                  rows={powerCurve}
                  testId="belt-power-chart"
                >
                  <CharacteristicChart
                    curve={powerCurve}
                    point={{ x: radPerSecToRpm(p.inputSpeed), y: out.beltPower }}
                    xLabel="Driver speed (rpm)"
                    yLabel="Power (W)"
                  />
                </ChartFigure>
              ) : (
                <ChartFigure
                  title={L.effortTitle}
                  description={L.effortDesc}
                  columns={[
                    { key: 'x', label: 'n' },
                    { key: 'y', label: 'effort (N)' },
                  ]}
                  rows={effortCurve}
                  testId="effort-chart"
                >
                  <CharacteristicChart
                    curve={effortCurve}
                    point={{ x: p.liftSupports, y: out.liftEffort }}
                    xLabel="Supporting segments n"
                    yLabel="Effort (N)"
                  />
                </ChartFigure>
              )}
            </div>
          ),

          instructions: (
            <ActivitiesList
              activities={M06_ACTIVITIES}
              done={lab.done}
              onToggle={lab.toggleActivity}
            />
          ),

          assessment: <AssessmentPanel moduleId={M06_ID} questions={M06_QUESTIONS} />,
        }}
      />
    </>
  );
}
