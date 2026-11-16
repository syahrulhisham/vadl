import { useMemo, useState } from 'react';
import { Button, colors, LinkButton, MeasurementDisplay, NumberControl } from '@/design-system';
import { AssessmentPanel } from '@/features/assessment';
import {
  CharacteristicChart,
  ChartFigure,
  TimeTraceChart,
  timeUnitFor,
  toTimeRows,
  type SeriesSpec,
} from '@/features/graphs';
import {
  ActivitiesList,
  LabShell,
  OutcomesList,
  PartsExplorer,
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
  formatSignificant,
  hybridRotorTeeth,
  hybridStepsPerRev,
  MICROSTEP_OPTIONS,
  radPerSecToRpm,
  radToDeg,
  STEPPER_LIMITS,
  STEPPER_PRESETS,
  stepperMotorModel,
  stepperSequenceTable,
  stepperSpeed,
  type CoilDrive,
  type Issue,
  type StepMode,
  type StepperFamily,
  type StepperParams,
  type StepperPresetName,
} from '@/sim-core';
import { M04_ACTIVITIES, M04_LABELS as L, M04_OUTCOMES, M04_THEORY } from './content.en';
import { PHASE_LETTERS, phaseCurrentsOf } from './phases';
import { M04_QUESTIONS } from './questions';
import { M04_RESULT_COLUMNS, numericParameters } from './results';
import { StepperDiagram } from './StepperDiagram';
import { TimingDiagram } from './TimingDiagram';

export const M04_ID = 'm04-stepper';
const PRESETS: readonly { name: StepperPresetName; label: string }[] = [
  { name: 'vr64', label: L.presetVr64 },
  { name: 'vr128', label: L.presetVr128 },
  { name: 'pm', label: L.presetPm },
  { name: 'hybrid', label: L.presetHybrid },
];
const MODES: readonly StepMode[] = ['wave', 'normal', 'half', 'micro'];
const POSITION_SERIES: readonly SeriesSpec[] = [
  { key: 'commandAngleDeg', label: L.commanded, unit: '°', color: colors.lightblue[400] },
  { key: 'rotorAngleDeg', label: L.rotor, unit: '°', color: colors.navy[700] },
];
const fmt = (v: number) => formatSignificant(v, 4);

/** Signals for the timing diagram: phase currents, or the four coils of a unipolar two-phase motor. */
function timingSignals(p: StepperParams, phases: number): { key: string; label: string }[] {
  if (p.family !== 'vr' && p.coilDrive === 'unipolar') {
    return [
      { key: 'coilA', label: 'A' },
      { key: 'coilB', label: 'B' },
      { key: 'coilAbar', label: 'Ā' },
      { key: 'coilBbar', label: 'B̄' },
    ];
  }
  return Array.from({ length: phases }, (_, j) => ({
    key: `i${j}`,
    label: PHASE_LETTERS[j] ?? '',
  }));
}

function cellText(i: number, vr: boolean): string {
  if (vr) return i ? 'on' : '';
  if (i === 0) return '0';
  if (Math.abs(i) === 1) return i > 0 ? '+' : '−';
  return fmt(i);
}

/** M04 Stepper Motors laboratory: all seven regions (FR-02). */
export default function StepperLab() {
  const sim = useSimulation(stepperMotorModel, { timeScale: 1, recorderCapacity: 6000 });
  const lab = useLabRecords(M04_ID);
  const [part, setPart] = useState<string | null>(null);
  const [playback, setPlayback] = useState(1);
  const [issues, setIssues] = useState<Issue[]>([]);
  const p = sim.params;
  const out = sim.outputs;
  const locked = sim.status !== 'idle';
  const lim = STEPPER_LIMITS;
  const vr = p.family === 'vr';
  const phases = out.phases;
  const currents = phaseCurrentsOf(out, phases);

  function apply(next: StepperParams, key?: keyof StepperParams) {
    setIssues(
      sim
        .setParams(next)
        .filter((i) => i.severity === 'error' || key === undefined || i.parameter === key),
    );
  }
  function set<K extends keyof StepperParams>(key: K, value: StepperParams[K]) {
    apply({ ...p, [key]: value }, key);
  }
  function setFamily(family: StepperFamily) {
    const preset = family === 'vr' ? 'vr64' : family;
    apply({ ...STEPPER_PRESETS[preset], direction: p.direction });
  }
  function changePlayback(v: number) {
    setPlayback(v);
    sim.setTimeScale(v);
  }

  const pulsePeriod = out.stepTime;
  const timingSpan = 8 * pulsePeriod;
  const unit = timeUnitFor(timingSpan);
  const tMin = Math.max(0, sim.time - timingSpan);
  const signals = timingSignals(p, phases);
  const timingTrace = sim.trace.filter((s) => s.t >= tMin);
  const posSpan = 40 * pulsePeriod;
  const posUnit = timeUnitFor(posSpan);
  const posMin = Math.max(0, sim.time - posSpan);
  const positionRows = toTimeRows(
    sim.trace.filter((s) => s.t >= posMin),
    POSITION_SERIES,
    posUnit.scale,
  );

  const sequence = useMemo(() => {
    const cycle =
      p.family === 'vr'
        ? p.mode === 'half'
          ? 2 * phases
          : phases
        : p.mode === 'half'
          ? 8
          : p.mode === 'micro'
            ? 8
            : 4;
    return stepperSequenceTable(p, cycle + 1);
  }, [p, phases]);
  const currentRow = sequence.findIndex((r) =>
    r.currents.every((i, j) => Math.abs(i - (currents[j] ?? 0)) < 1e-9),
  );

  const speedLine = useMemo(() => {
    const prMax = Math.max(10, 2 * p.pulseRate);
    return Array.from({ length: 21 }, (_, i) => {
      const pr = (prMax * i) / 20;
      return { x: pr, y: radPerSecToRpm(stepperSpeed(out.stepAngle, pr)) };
    });
  }, [p.pulseRate, out.stepAngle]);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <LinkButton to={`/reports/${M04_ID}`} variant="secondary">
          {L.openReport}
        </LinkButton>
        <span className="text-sm text-navy-600">{L.dataNote}</span>
      </div>
      <LabShell
        placeholderMilestone={6}
        regions={{
          theory: (
            <div className="space-y-4 text-sm">
              <p>{M04_THEORY.intro}</p>
              <OutcomesList outcomes={M04_OUTCOMES} />
              <TheoryBlock title={M04_THEORY.equationsTitle} items={M04_THEORY.equations} mono />
              <TheoryBlock title={M04_THEORY.drivesTitle} items={M04_THEORY.drives} collapsible />
              <TheoryBlock title={M04_THEORY.typesTitle} items={M04_THEORY.types} collapsible />
              <TheoryBlock title={M04_THEORY.torqueTitle} collapsible>
                <p className="mt-1">{M04_THEORY.torque}</p>
              </TheoryBlock>
              <TheoryBlock
                title={M04_THEORY.prosConsTitle}
                items={M04_THEORY.prosCons}
                collapsible
              />
              <TheoryBlock
                title={t('lab.assumptionsTitle')}
                items={stepperMotorModel.assumptions}
                collapsible
              />
            </div>
          ),

          workspace: (
            <div className="space-y-3">
              <figure>
                <figcaption className="text-sm font-medium text-navy-800">{L.diagram}</figcaption>
                <StepperDiagram params={p} outputs={out} highlight={part} />
                {!vr ? <p className="text-xs text-navy-600">{L.diagramTwoPhase}</p> : null}
              </figure>
              <PartsExplorer
                title={L.partsTitle}
                hint={L.partsHint}
                parts={L.parts}
                selected={part}
                onSelect={setPart}
              />
              <div
                aria-label={L.phasesLit}
                role="group"
                className="flex flex-wrap gap-2"
                data-testid="phase-lights"
              >
                {currents.map((i, j) => (
                  <span
                    key={j}
                    className={`min-w-[3.5rem] rounded border px-2 py-1 text-center text-sm font-semibold ${
                      i !== 0
                        ? 'border-navy-700 bg-lightblue-300 text-navy-900'
                        : 'border-navy-200 bg-white text-navy-500'
                    }`}
                  >
                    {PHASE_LETTERS[j]} {cellText(i, vr) || 'off'}
                  </span>
                ))}
              </div>
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
                      onClick={() => apply(STEPPER_PRESETS[pr.name])}
                    >
                      {pr.label}
                    </Button>
                  ))}
                </div>
              </fieldset>
              <SelectField<StepperFamily>
                label={L.family}
                value={p.family}
                disabled={locked}
                options={(['vr', 'pm', 'hybrid'] as const).map((f) => ({
                  value: f,
                  label: L.families[f],
                }))}
                onChange={setFamily}
              />
              {vr ? (
                <>
                  <NumberControl
                    label={L.statorTeeth}
                    value={p.statorTeeth}
                    min={lim.statorTeeth.min}
                    max={lim.statorTeeth.max}
                    step={1}
                    unit="—"
                    disabled={locked}
                    onChange={(v) => set('statorTeeth', v)}
                  />
                  <NumberControl
                    label={L.rotorTeeth}
                    value={p.rotorTeeth}
                    min={lim.rotorTeeth.min}
                    max={lim.rotorTeeth.max}
                    step={1}
                    unit="—"
                    disabled={locked}
                    onChange={(v) => set('rotorTeeth', v)}
                  />
                </>
              ) : (
                <>
                  <NumberControl
                    label={L.stepsPerRev}
                    value={p.stepsPerRev}
                    min={lim.stepsPerRev.min}
                    max={lim.stepsPerRev.max}
                    step={4}
                    unit="—"
                    disabled={locked}
                    onChange={(v) => set('stepsPerRev', v)}
                  />
                  {p.family === 'hybrid' ? (
                    <>
                      <NumberControl
                        label={L.hybridTeeth}
                        value={hybridRotorTeeth(p.stepsPerRev)}
                        min={hybridRotorTeeth(lim.stepsPerRev.min)}
                        max={hybridRotorTeeth(lim.stepsPerRev.max)}
                        step={1}
                        unit="—"
                        disabled={locked}
                        onChange={(v) => set('stepsPerRev', hybridStepsPerRev(v))}
                      />
                      <p className="text-sm text-navy-600" data-testid="hybrid-note">
                        {L.hybridNote}
                      </p>
                    </>
                  ) : null}
                </>
              )}
              <SelectField<StepMode>
                label={L.mode}
                value={p.mode}
                disabled={locked}
                options={MODES.filter((m) => !vr || m !== 'micro').map((m) => ({
                  value: m,
                  label: L.modes[m],
                }))}
                onChange={(v) => set('mode', v)}
              />
              {p.mode === 'micro' ? (
                <SelectField<string>
                  label={L.microsteps}
                  value={String(p.microsteps)}
                  disabled={locked}
                  options={MICROSTEP_OPTIONS.map((n) => ({ value: String(n), label: String(n) }))}
                  onChange={(v) => set('microsteps', Number(v))}
                />
              ) : null}
              {!vr ? (
                <SelectField<CoilDrive>
                  label={L.coilDrive}
                  value={p.coilDrive}
                  disabled={locked}
                  options={(['unipolar', 'bipolar'] as const).map((c) => ({
                    value: c,
                    label: L.coilDrives[c],
                  }))}
                  onChange={(v) => set('coilDrive', v)}
                />
              ) : null}
              <fieldset>
                <legend className="text-sm font-medium text-navy-800">{L.direction}</legend>
                <div className="mt-1 flex flex-wrap gap-2">
                  {(['cw', 'ccw'] as const).map((d) => (
                    <Button
                      key={d}
                      variant={p.direction === d ? 'primary' : 'secondary'}
                      aria-pressed={p.direction === d}
                      onClick={() => set('direction', d)}
                    >
                      {d === 'cw' ? L.cw : L.ccw}
                    </Button>
                  ))}
                </div>
              </fieldset>
              <NumberControl
                label={L.pulseRate}
                value={p.pulseRate}
                min={lim.pulseRate.min}
                max={lim.pulseRate.max}
                step={1}
                unit="pulses/s"
                onChange={(v) => set('pulseRate', v)}
              />
              <NumberControl
                label={L.pulseLimit}
                value={p.pulseLimit}
                min={lim.pulseLimit.min}
                max={lim.pulseLimit.max}
                step={1}
                unit="—"
                disabled={locked}
                onChange={(v) => set('pulseLimit', v)}
              />

              <details className="rounded-md border border-navy-100 p-3">
                <summary className="min-h-touch cursor-pointer py-2 text-sm font-semibold text-navy-800">
                  {L.dynamicsTitle}
                </summary>
                <div className="mt-2 space-y-4">
                  <label className="flex min-h-touch items-center gap-3 text-sm font-medium text-navy-800">
                    <input
                      type="checkbox"
                      checked={p.rotorDynamics}
                      disabled={locked}
                      onChange={(e) => set('rotorDynamics', e.target.checked)}
                      className="h-5 w-5 accent-navy-700"
                    />
                    {L.rotorDynamics}
                  </label>
                  <NumberControl
                    label={L.loadTorque}
                    value={p.loadTorque}
                    min={lim.loadTorque.min}
                    max={lim.loadTorque.max}
                    step={0.01}
                    unit="N·m"
                    onChange={(v) => set('loadTorque', v)}
                  />
                  <NumberControl
                    label={L.peakTorque}
                    value={p.peakTorque}
                    min={lim.peakTorque.min}
                    max={lim.peakTorque.max}
                    step={0.01}
                    unit="N·m"
                    disabled={locked}
                    onChange={(v) => set('peakTorque', v)}
                  />
                  <NumberControl
                    label={L.inertia}
                    value={p.inertia}
                    min={lim.inertia.min}
                    max={lim.inertia.max}
                    step={0.000001}
                    unit="kg·m²"
                    disabled={locked}
                    onChange={(v) => set('inertia', v)}
                  />
                  <NumberControl
                    label={L.damping}
                    value={p.damping}
                    min={lim.damping.min}
                    max={lim.damping.max}
                    step={0.0001}
                    unit="N·m·s/rad"
                    disabled={locked}
                    onChange={(v) => set('damping', v)}
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
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                <MeasurementDisplay
                  label={L.measurements.time}
                  symbol="t"
                  value={sim.time}
                  unit="s"
                />
                <MeasurementDisplay
                  label={L.measurements.fullStepAngle}
                  symbol="Sa"
                  value={radToDeg(out.fullStepAngle)}
                  unit="°"
                />
                <MeasurementDisplay
                  label={L.measurements.stepAngle}
                  symbol="θstep"
                  value={radToDeg(out.stepAngle)}
                  unit="°"
                />
                <MeasurementDisplay
                  label={L.measurements.phases}
                  symbol="m"
                  value={out.phases}
                  unit=""
                />
                <MeasurementDisplay
                  label={L.measurements.ppr}
                  symbol="PPR"
                  value={out.ppr}
                  unit=""
                />
                <MeasurementDisplay
                  label={L.measurements.pulseRate}
                  symbol="PR"
                  value={out.pulseRate}
                  unit="pulses/s"
                />
                <MeasurementDisplay
                  label={L.measurements.stepTime}
                  symbol="1/PR"
                  value={out.stepTime}
                  unit="s"
                />
                <MeasurementDisplay
                  label={L.measurements.commandSpeedRpm}
                  symbol="N"
                  value={out.commandSpeedRpm}
                  unit="rpm"
                />
                <MeasurementDisplay
                  label={L.measurements.pulses}
                  symbol="n"
                  value={out.pulses}
                  unit=""
                />
                <MeasurementDisplay
                  label={L.measurements.commandAngleDeg}
                  symbol="θcmd"
                  value={out.commandAngleDeg}
                  unit="°"
                />
                <MeasurementDisplay
                  label={L.measurements.rotorAngleDeg}
                  symbol="θ"
                  value={out.rotorAngleDeg}
                  unit="°"
                />
                {p.rotorDynamics ? (
                  <>
                    <MeasurementDisplay
                      label={L.measurements.rotorSpeedRpm}
                      symbol="ω"
                      value={out.rotorSpeedRpm}
                      unit="rpm"
                    />
                    <MeasurementDisplay
                      label={L.measurements.positionErrorDeg}
                      symbol="Δθ"
                      value={out.positionErrorDeg}
                      unit="°"
                    />
                    <MeasurementDisplay
                      label={L.measurements.lostSteps}
                      symbol="lost"
                      value={out.lostSteps}
                      unit="steps"
                    />
                  </>
                ) : null}
              </div>
              {out.lostSteps !== 0 ? (
                <p
                  role="alert"
                  className="rounded bg-status-warningBg px-3 py-2 text-sm text-status-warning"
                >
                  {L.lostStepsWarning}
                </p>
              ) : null}

              <div className="overflow-x-auto">
                <table className="text-sm" data-testid="sequence-table">
                  <caption className="mb-1 text-left">
                    <span className="font-semibold text-navy-800">{L.sequenceTitle}. </span>
                    <span className="text-navy-600">{L.sequenceCaption}</span>
                  </caption>
                  <thead>
                    <tr className="text-left text-navy-800">
                      <th scope="col" className="pr-4">
                        {L.step}
                      </th>
                      {currents.map((_, j) => (
                        <th key={j} scope="col" className="pr-4">
                          {PHASE_LETTERS[j]}
                        </th>
                      ))}
                      <th scope="col">{L.angle}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sequence.map((row, r) => (
                      <tr
                        key={r}
                        aria-current={r === currentRow ? 'step' : undefined}
                        className={r === currentRow ? 'bg-lightblue-100 font-semibold' : ''}
                      >
                        <th scope="row" className="pr-4 text-left font-medium">
                          {r + 1}
                        </th>
                        {row.currents.map((i, j) => (
                          <td key={j} className="pr-4">
                            {cellText(i, vr)}
                          </td>
                        ))}
                        <td>{fmt(radToDeg(row.angle))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <RecordPanel
                rows={lab.rows}
                columns={M04_RESULT_COLUMNS}
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
                title={L.timingTitle}
                description={L.timingDesc}
                columns={[
                  { key: 't', label: `t (${unit.unit})` },
                  ...signals.map((s) => ({ key: s.key, label: s.label })),
                ]}
                rows={toTimeRows(
                  timingTrace,
                  signals.map((s) => ({
                    key: s.key,
                    label: s.label,
                    unit: '',
                    color: colors.navy[700],
                  })),
                  unit.scale,
                )}
                testId="timing-chart"
              >
                <TimingDiagram
                  samples={timingTrace}
                  signals={signals}
                  tMin={tMin}
                  tMax={Math.max(tMin + timingSpan, sim.time)}
                  timeScale={unit.scale}
                  timeUnit={unit.unit}
                />
              </ChartFigure>
              <ChartFigure
                title={L.positionTitle}
                description={L.positionDesc}
                columns={[
                  { key: 't', label: `t (${posUnit.unit})` },
                  { key: 'commandAngleDeg', label: 'θcmd (°)' },
                  { key: 'rotorAngleDeg', label: 'θ (°)' },
                ]}
                rows={positionRows}
                testId="position-chart"
              >
                <TimeTraceChart
                  rows={positionRows}
                  series={POSITION_SERIES}
                  timeUnit={posUnit.unit}
                  yLabel="θ (°)"
                  xMin={posMin * posUnit.scale}
                  xMax={Math.max(posSpan, sim.time) * posUnit.scale}
                  height={240}
                />
              </ChartFigure>
              <ChartFigure
                title={L.speedLineTitle}
                description={L.speedLineDesc}
                columns={[
                  { key: 'x', label: 'PR (pulses/s)' },
                  { key: 'y', label: 'N (rpm)' },
                ]}
                rows={speedLine}
                testId="speed-line-chart"
              >
                <CharacteristicChart
                  curve={speedLine}
                  point={{
                    x: p.pulseRate,
                    y: Math.abs(radPerSecToRpm(stepperSpeed(out.stepAngle, p.pulseRate))),
                  }}
                  xLabel="Pulse rate (pulses/s)"
                  yLabel="Speed (rpm)"
                />
              </ChartFigure>
            </div>
          ),

          instructions: (
            <ActivitiesList
              activities={M04_ACTIVITIES}
              done={lab.done}
              onToggle={lab.toggleActivity}
            />
          ),

          assessment: <AssessmentPanel moduleId={M04_ID} questions={M04_QUESTIONS} />,
        }}
      />
    </>
  );
}
