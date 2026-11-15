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
  SelectField,
  TheoryBlock,
  useLabRecords,
} from '@/features/lab-shell';
import { useSimulation } from '@/hooks';
import { t } from '@/i18n';
import {
  AC_CONTROLS,
  AC_LIMITS,
  AC_POLES,
  AC_PRESETS,
  acLoadTorqueAtSpeed,
  acSupply,
  acTorqueAtSpeed,
  inductionMotorModel,
  radPerSecToRpm,
  rpmToRadPerSec,
  type AcControl,
  type AcPresetName,
  type InductionMotorParams,
  type Issue,
  type LoadExponent,
} from '@/sim-core';
import { AcFieldView } from './AcFieldView';
import { M02_ACTIVITIES, M02_LABELS as L, M02_OUTCOMES, M02_THEORY } from './content.en';
import { M02_QUESTIONS } from './questions';
import { M02_RESULT_COLUMNS, numericParameters } from './results';

export const M02_ID = 'm02-ac-motor';
const WINDOW_SECONDS = 3;
const PRESETS: readonly { name: AcPresetName; label: string }[] = [
  { name: 'performance', label: L.presetPerformance },
  { name: 'statorVoltage', label: L.presetStatorVoltage },
  { name: 'rotorResistance', label: L.presetRotorResistance },
  { name: 'vf', label: L.presetVf },
  { name: 'aboveBase', label: L.presetAboveBase },
];
const SPEED_SERIES: readonly SeriesSpec[] = [
  { key: 'speedRpm', label: L.measurements.speedRpm, unit: 'rpm', color: colors.navy[700] },
];
const CURRENT_SERIES: readonly SeriesSpec[] = [
  { key: 'statorCurrent', label: L.measurements.statorCurrent, unit: 'A', color: colors.navy[500] },
];

/** M02 AC Motor Drives laboratory: all seven regions (FR-02). */
export default function AcMotorLab() {
  const sim = useSimulation(inductionMotorModel, {
    timeScale: 1,
    recordInterval: 0.005,
    recorderCapacity: 6000,
  });
  const lab = useLabRecords(M02_ID);
  const [playback, setPlayback] = useState(1);
  const [issues, setIssues] = useState<Issue[]>([]);
  const p = sim.params;
  const out = sim.outputs;
  const locked = sim.status !== 'idle';
  const lim = AC_LIMITS;

  function set<K extends keyof InductionMotorParams>(key: K, value: InductionMotorParams[K]) {
    setIssues(
      sim
        .setParams({ ...p, [key]: value })
        .filter((i) => i.severity === 'error' || i.parameter === key),
    );
  }

  function changePlayback(v: number) {
    setPlayback(v);
    sim.setTimeScale(v);
  }

  const xMin = Math.max(0, sim.time - WINDOW_SECONDS);
  const xMax = Math.max(WINDOW_SECONDS, sim.time);
  const windowTrace = sim.trace.filter((s) => s.t >= xMin);
  const speedRows = toTimeRows(windowTrace, SPEED_SERIES, 1);
  const currentRows = toTimeRows(windowTrace, CURRENT_SERIES, 1);

  const characteristic = useMemo(() => {
    const nsRpm = radPerSecToRpm(acSupply(p).omegaSync);
    const motor = Array.from({ length: 121 }, (_, i) => {
      const n = (nsRpm * i) / 120;
      return { x: acTorqueAtSpeed(p, rpmToRadPerSec(n)), y: n };
    });
    const tMax = Math.max(...motor.map((m) => m.x), 1);
    const load = Array.from({ length: 41 }, (_, i) => {
      const n = (nsRpm * i) / 40;
      return { x: acLoadTorqueAtSpeed(p, rpmToRadPerSec(n)), y: n };
    }).filter((pt) => pt.x <= tMax * 1.3);
    return { motor, load, yMax: Math.ceil((1.05 * nsRpm) / 100) * 100 };
  }, [p]);

  const variableF = p.control === 'vf' || p.control === 'frequency';

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <LinkButton to={`/reports/${M02_ID}`} variant="secondary">
          {L.openReport}
        </LinkButton>
        <span className="text-sm text-navy-600">{L.dataNote}</span>
      </div>
      <LabShell
        placeholderMilestone={5}
        regions={{
          theory: (
            <div className="space-y-4 text-sm">
              <p>{M02_THEORY.intro}</p>
              <OutcomesList outcomes={M02_OUTCOMES} />
              <TheoryBlock title={M02_THEORY.equationsTitle} items={M02_THEORY.equations} mono />
              <TheoryBlock title={M02_THEORY.controlTitle} items={M02_THEORY.control} collapsible />
              <TheoryBlock title={M02_THEORY.regionsTitle} collapsible>
                <p className="mt-1">{M02_THEORY.regions}</p>
              </TheoryBlock>
              <TheoryBlock title={M02_THEORY.circuitTitle} collapsible>
                <p className="mt-1">{M02_THEORY.circuit}</p>
              </TheoryBlock>
              <TheoryBlock
                title={t('lab.assumptionsTitle')}
                items={inductionMotorModel.assumptions}
                collapsible
              />
            </div>
          ),

          workspace: (
            <div className="space-y-3">
              <figure>
                <figcaption className="text-sm font-medium text-navy-800">{L.fieldView}</figcaption>
                <AcFieldView outputs={out} poles={p.poles} />
              </figure>
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
                    <Button
                      key={pr.name}
                      variant="secondary"
                      onClick={() => setIssues(sim.setParams(AC_PRESETS[pr.name]))}
                    >
                      {pr.label}
                    </Button>
                  ))}
                </div>
              </fieldset>
              <SelectField<AcControl>
                label={L.control}
                value={p.control}
                disabled={locked}
                options={AC_CONTROLS.map((c) => ({ value: c, label: L.controls[c] }))}
                onChange={(v) => set('control', v)}
              />
              <SelectField<string>
                label={L.poles}
                value={String(p.poles)}
                disabled={locked}
                options={AC_POLES.map((n) => ({ value: String(n), label: String(n) }))}
                onChange={(v) => set('poles', Number(v))}
              />
              {p.control === 'stator-voltage' ? (
                <NumberControl
                  label={L.voltageFactor}
                  value={p.voltageFactor}
                  min={lim.voltageFactor.min}
                  max={lim.voltageFactor.max}
                  step={0.01}
                  unit="—"
                  onChange={(v) => set('voltageFactor', v)}
                />
              ) : null}
              {variableF ? (
                <NumberControl
                  label={L.frequency}
                  value={p.frequency}
                  min={lim.frequency.min}
                  max={lim.frequency.max}
                  step={1}
                  unit="Hz"
                  onChange={(v) => set('frequency', v)}
                />
              ) : null}
              {p.control === 'rotor-resistance' ? (
                <NumberControl
                  label={L.externalRotorResistance}
                  value={p.externalRotorResistance}
                  min={lim.externalRotorResistance.min}
                  max={lim.externalRotorResistance.max}
                  step={0.01}
                  unit="Ω"
                  onChange={(v) => set('externalRotorResistance', v)}
                />
              ) : null}

              <details className="rounded-md border border-navy-100 p-3" open={!locked}>
                <summary className="min-h-touch cursor-pointer py-2 text-sm font-semibold text-navy-800">
                  {L.loadTitle}
                </summary>
                <div className="mt-2 space-y-4">
                  <SelectField<string>
                    label={L.loadExponent}
                    value={String(p.loadExponent)}
                    options={(['0', '1', '2', '-1'] as const).map((k) => ({
                      value: k,
                      label: L.loadTypes[k],
                    }))}
                    onChange={(v) => set('loadExponent', Number(v) as LoadExponent)}
                  />
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
                    step={10}
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
                    step={0.0001}
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
                    label={L.ratedLineVoltage}
                    value={p.ratedLineVoltage}
                    min={lim.ratedLineVoltage.min}
                    max={lim.ratedLineVoltage.max}
                    step={5}
                    unit="V"
                    disabled={locked}
                    onChange={(v) => set('ratedLineVoltage', v)}
                  />
                  <NumberControl
                    label={L.ratedFrequency}
                    value={p.ratedFrequency}
                    min={lim.ratedFrequency.min}
                    max={lim.ratedFrequency.max}
                    step={1}
                    unit="Hz"
                    disabled={locked}
                    onChange={(v) => set('ratedFrequency', v)}
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
                    label={L.rr}
                    value={p.rr}
                    min={lim.rr.min}
                    max={lim.rr.max}
                    step={0.01}
                    unit="Ω"
                    disabled={locked}
                    onChange={(v) => set('rr', v)}
                  />
                  <NumberControl
                    label={L.xs}
                    value={p.xs}
                    min={lim.xs.min}
                    max={lim.xs.max}
                    step={0.01}
                    unit="Ω"
                    disabled={locked}
                    onChange={(v) => set('xs', v)}
                  />
                  <NumberControl
                    label={L.xr}
                    value={p.xr}
                    min={lim.xr.min}
                    max={lim.xr.max}
                    step={0.01}
                    unit="Ω"
                    disabled={locked}
                    onChange={(v) => set('xr', v)}
                  />
                  <NumberControl
                    label={L.xm}
                    value={p.xm}
                    min={lim.xm.min}
                    max={lim.xm.max}
                    step={0.1}
                    unit="Ω"
                    disabled={locked}
                    onChange={(v) => set('xm', v)}
                  />
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MeasurementDisplay
                  label={L.measurements.time}
                  symbol="t"
                  value={sim.time}
                  unit="s"
                />
                <MeasurementDisplay
                  label={L.measurements.speedRpm}
                  symbol="N"
                  value={out.speedRpm}
                  unit="rpm"
                />
                <MeasurementDisplay
                  label={L.measurements.syncSpeedRpm}
                  symbol="Ns"
                  value={out.syncSpeedRpm}
                  unit="rpm"
                />
                <MeasurementDisplay
                  label={L.measurements.slip}
                  symbol="S"
                  value={100 * out.slip}
                  unit="%"
                />
                <MeasurementDisplay
                  label={L.measurements.rotorFrequency}
                  symbol="fr"
                  value={out.rotorFrequency}
                  unit="Hz"
                />
                <MeasurementDisplay
                  label={L.measurements.phaseVoltage}
                  symbol="Vs"
                  value={out.phaseVoltage}
                  unit="V"
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
                  label={L.measurements.rotorCurrent}
                  symbol="Ir'"
                  value={out.rotorCurrent}
                  unit="A"
                />
                <MeasurementDisplay
                  label={L.measurements.statorCurrent}
                  symbol="Is"
                  value={out.statorCurrent}
                  unit="A"
                />
                <MeasurementDisplay
                  label={L.measurements.powerFactor}
                  symbol="PF"
                  value={out.powerFactor}
                  unit=""
                />
                <MeasurementDisplay
                  label={L.measurements.inputPower}
                  symbol="Pin"
                  value={out.inputPower}
                  unit="W"
                />
                <MeasurementDisplay
                  label={L.measurements.airGapPower}
                  symbol="Pg"
                  value={out.airGapPower}
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
                <MeasurementDisplay
                  label={L.measurements.maxTorque}
                  symbol="Tmax"
                  value={out.maxTorque}
                  unit="N·m"
                />
                <MeasurementDisplay
                  label={L.measurements.startingTorque}
                  symbol="Tst"
                  value={out.startingTorque}
                  unit="N·m"
                />
              </div>
              <RecordPanel
                rows={lab.rows}
                columns={M02_RESULT_COLUMNS}
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
              <ChartFigure
                title={L.speedTrace}
                description={L.speedTraceDesc}
                columns={[
                  { key: 't', label: 't (s)' },
                  { key: 'speedRpm', label: 'N (rpm)' },
                ]}
                rows={speedRows}
                testId="speed-chart"
              >
                <TimeTraceChart
                  rows={speedRows}
                  series={SPEED_SERIES}
                  timeUnit="s"
                  yLabel="N (rpm)"
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
                  { key: 'statorCurrent', label: 'Is (A)' },
                ]}
                rows={currentRows}
                testId="current-chart"
              >
                <TimeTraceChart
                  rows={currentRows}
                  series={CURRENT_SERIES}
                  timeUnit="s"
                  yLabel="Is (A)"
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
                  { key: 'y', label: 'N (rpm)' },
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
              activities={M02_ACTIVITIES}
              done={lab.done}
              onToggle={lab.toggleActivity}
            />
          ),

          assessment: <AssessmentPanel moduleId={M02_ID} questions={M02_QUESTIONS} />,
        }}
      />
    </>
  );
}
