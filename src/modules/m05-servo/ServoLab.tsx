import { useMemo, useState } from 'react';
import { Button, colors, LinkButton, MeasurementDisplay, NumberControl } from '@/design-system';
import { AssessmentPanel } from '@/features/assessment';
import { ChartFigure, TimeTraceChart, toTimeRows, type SeriesSpec } from '@/features/graphs';
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
  degToRad,
  radPerSecToRpm,
  radToDeg,
  responseMetrics,
  rpmToRadPerSec,
  SERVO_LIMITS,
  SERVO_PRESETS,
  servoMotorModel,
  type Issue,
  type ServoFeedback,
  type ServoMode,
  type ServoParams,
  type ServoPresetName,
  type ServoReference,
} from '@/sim-core';
import { M05_ACTIVITIES, M05_LABELS as L, M05_OUTCOMES, M05_THEORY } from './content.en';
import { M05_QUESTIONS } from './questions';
import { M05_RESULT_COLUMNS, numericParameters } from './results';
import { ServoDial, ServoDiagram } from './ServoDiagram';

export const M05_ID = 'm05-servo';
const WINDOW_SECONDS = 2;
const PRESETS: readonly ServoPresetName[] = [
  'position',
  'positionLoad',
  'positionPi',
  'tracking',
  'speed',
];
const lim = SERVO_LIMITS;

/** M05 Servo Motors laboratory: all seven regions (FR-02). */
export default function ServoLab() {
  const sim = useSimulation(servoMotorModel, {
    timeScale: 1,
    recordInterval: 0.001,
    recorderCapacity: 10_000,
  });
  const lab = useLabRecords(M05_ID);
  const [playback, setPlayback] = useState(1);
  const [issues, setIssues] = useState<Issue[]>([]);
  const p = sim.params;
  const out = sim.outputs;
  const locked = sim.status !== 'idle';
  const pos = p.mode === 'position';

  function apply(next: ServoParams, key?: keyof ServoParams) {
    setIssues(
      sim
        .setParams(next)
        .filter((i) => i.severity === 'error' || key === undefined || i.parameter === key),
    );
  }
  function set<K extends keyof ServoParams>(key: K, value: ServoParams[K]) {
    apply({ ...p, [key]: value }, key);
  }
  function setMode(mode: ServoMode) {
    apply(mode === 'position' ? SERVO_PRESETS.position : SERVO_PRESETS.speed);
  }
  function changePlayback(v: number) {
    setPlayback(v);
    sim.setTimeScale(v);
  }

  const trace = sim.trace;
  const responseSeries: readonly SeriesSpec[] = pos
    ? [
        { key: 'referenceDeg', label: L.referenceLine, unit: '°', color: colors.lightblue[400] },
        { key: 'positionDeg', label: L.actualLine, unit: '°', color: colors.navy[700] },
      ]
    : [
        { key: 'referenceRpm', label: L.referenceLine, unit: 'rpm', color: colors.lightblue[400] },
        { key: 'speedRpm', label: L.actualLine, unit: 'rpm', color: colors.navy[700] },
      ];
  const errorSeries: readonly SeriesSpec[] = [
    pos
      ? { key: 'errorDeg', label: L.measurements.error, unit: '°', color: colors.navy[600] }
      : { key: 'errorRpm', label: L.measurements.error, unit: 'rpm', color: colors.navy[600] },
  ];
  const ampSeries: readonly SeriesSpec[] = [
    {
      key: 'armatureVoltage',
      label: L.measurements.armatureVoltage,
      unit: 'V',
      color: colors.navy[700],
    },
  ];
  const xMin = Math.max(0, sim.time - WINDOW_SECONDS);
  const xMax = Math.max(WINDOW_SECONDS, sim.time);
  const windowTrace = trace.filter((s) => s.t >= xMin);
  const responseRows = toTimeRows(windowTrace, responseSeries, 1);
  const errorRows = toTimeRows(windowTrace, errorSeries, 1);
  const ampRows = toTimeRows(windowTrace, ampSeries, 1);

  const metrics = useMemo(() => {
    if (p.reference !== 'step' || trace.length < 3) return null;
    const key = pos ? 'position' : 'speed';
    const samples = trace.map((s) => ({ t: s.t, y: s.values[key] ?? 0 }));
    return responseMetrics(samples, 0, p.referenceValue);
  }, [trace, p.reference, p.referenceValue, pos]);
  const metricValues = {
    riseTime: metrics?.riseTime ?? Number.NaN,
    overshootPercent: metrics ? 100 * metrics.overshoot : Number.NaN,
    settlingTime: metrics?.settlingTime ?? Number.NaN,
    steadyStateError: metrics
      ? pos
        ? radToDeg(metrics.steadyStateError)
        : radPerSecToRpm(metrics.steadyStateError)
      : Number.NaN,
  };

  const refDisplay = pos ? radToDeg(p.referenceValue) : radPerSecToRpm(p.referenceValue);
  const rateDisplay = pos ? radToDeg(p.referenceRate) : radPerSecToRpm(p.referenceRate);
  const refMax = pos ? 720 : 3800;

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <LinkButton to={`/reports/${M05_ID}`} variant="secondary">
          {L.openReport}
        </LinkButton>
        <span className="text-sm text-navy-600">{L.dataNote}</span>
      </div>
      <LabShell
        placeholderMilestone={6}
        regions={{
          theory: (
            <div className="space-y-4 text-sm">
              <p>{M05_THEORY.intro}</p>
              <OutcomesList outcomes={M05_OUTCOMES} />
              <TheoryBlock title={M05_THEORY.blocksTitle} items={M05_THEORY.blocks} mono />
              <TheoryBlock title={M05_THEORY.motorsTitle} items={M05_THEORY.motors} collapsible />
              <TheoryBlock title={M05_THEORY.sensorsTitle} items={M05_THEORY.sensors} collapsible />
              <TheoryBlock
                title={M05_THEORY.extensionTitle}
                items={M05_THEORY.extension}
                collapsible
              />
              <TheoryBlock
                title={t('lab.assumptionsTitle')}
                items={servoMotorModel.assumptions}
                collapsible
              />
            </div>
          ),

          workspace: (
            <div className="space-y-3">
              <figure>
                <figcaption className="text-sm font-medium text-navy-800">{L.diagram}</figcaption>
                <ServoDiagram params={p} outputs={out} />
              </figure>
              <div className="flex flex-wrap items-center gap-4">
                <figure className="flex items-center gap-2">
                  <ServoDial outputs={out} position={pos} />
                  <figcaption className="max-w-[10rem] text-xs text-navy-600">{L.dial}</figcaption>
                </figure>
                <div
                  role="group"
                  aria-label={L.channels}
                  className="flex gap-2"
                  data-testid="encoder-channels"
                >
                  {(['encoderA', 'encoderB', 'encoderZ'] as const).map((k) => (
                    <span
                      key={k}
                      className={`min-w-[3rem] rounded border px-2 py-1 text-center text-sm font-semibold ${
                        out[k]
                          ? 'border-navy-700 bg-lightblue-300 text-navy-900'
                          : 'border-navy-200 bg-white text-navy-500'
                      }`}
                    >
                      {k.slice(-1)} {out[k] ? 'high' : 'low'}
                    </span>
                  ))}
                </div>
              </div>
              {out.saturated ? (
                <p className="rounded bg-status-warningBg px-3 py-2 text-sm text-status-warning">
                  {L.saturated}
                </p>
              ) : null}
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
                  {PRESETS.map((name) => (
                    <Button
                      key={name}
                      variant="secondary"
                      onClick={() => apply(SERVO_PRESETS[name])}
                    >
                      {L.presetNames[name]}
                    </Button>
                  ))}
                </div>
              </fieldset>
              <SelectField<ServoMode>
                label={L.mode}
                value={p.mode}
                disabled={locked}
                options={(['position', 'speed'] as const).map((m) => ({
                  value: m,
                  label: L.modes[m],
                }))}
                onChange={setMode}
              />
              <SelectField<ServoReference>
                label={L.reference}
                value={p.reference}
                disabled={locked}
                options={(['step', 'ramp', 'sine'] as const).map((r) => ({
                  value: r,
                  label: L.references[r],
                }))}
                onChange={(v) => set('reference', v)}
              />
              {p.reference === 'ramp' ? (
                <NumberControl
                  label={pos ? L.rampDeg : L.rampRpm}
                  value={Number(rateDisplay.toFixed(3))}
                  min={-refMax}
                  max={refMax}
                  step={pos ? 5 : 50}
                  unit={pos ? '°/s' : 'rpm/s'}
                  onChange={(v) => set('referenceRate', pos ? degToRad(v) : rpmToRadPerSec(v))}
                />
              ) : (
                <NumberControl
                  label={pos ? L.referenceDeg : L.referenceRpm}
                  value={Number(refDisplay.toFixed(3))}
                  min={-refMax}
                  max={refMax}
                  step={pos ? 5 : 50}
                  unit={pos ? '°' : 'rpm'}
                  onChange={(v) => set('referenceValue', pos ? degToRad(v) : rpmToRadPerSec(v))}
                />
              )}
              {p.reference === 'sine' ? (
                <NumberControl
                  label={L.sineFrequency}
                  value={p.referenceFrequency}
                  min={lim.referenceFrequency.min}
                  max={lim.referenceFrequency.max}
                  step={0.1}
                  unit="Hz"
                  onChange={(v) => set('referenceFrequency', v)}
                />
              ) : null}
              <NumberControl
                label={L.kp}
                value={p.kp}
                min={lim.kp.min}
                max={lim.kp.max}
                step={0.5}
                unit="V/V"
                onChange={(v) => set('kp', v)}
              />
              <NumberControl
                label={L.ki}
                value={p.ki}
                min={lim.ki.min}
                max={lim.ki.max}
                step={1}
                unit="1/s"
                onChange={(v) => set('ki', v)}
              />
              {pos ? (
                <NumberControl
                  label={L.kd}
                  value={p.kd}
                  min={lim.kd.min}
                  max={lim.kd.max}
                  step={0.005}
                  unit="s"
                  onChange={(v) => set('kd', v)}
                />
              ) : null}
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
                label={L.vMax}
                value={p.vMax}
                min={lim.vMax.min}
                max={lim.vMax.max}
                step={1}
                unit="V"
                onChange={(v) => set('vMax', v)}
              />
              {pos ? (
                <SelectField<ServoFeedback>
                  label={L.feedback}
                  value={p.feedback}
                  options={(['potentiometer', 'encoder'] as const).map((f) => ({
                    value: f,
                    label: L.feedbacks[f],
                  }))}
                  onChange={(v) => set('feedback', v)}
                />
              ) : null}
              <NumberControl
                label={L.encoderLines}
                value={p.encoderLines}
                min={lim.encoderLines.min}
                max={lim.encoderLines.max}
                step={1}
                unit="lines"
                onChange={(v) => set('encoderLines', v)}
              />

              <details className="rounded-md border border-navy-100 p-3">
                <summary className="min-h-touch cursor-pointer py-2 text-sm font-semibold text-navy-800">
                  {L.motorTitle}
                </summary>
                <div className="mt-2 space-y-4">
                  {(
                    [
                      ['ra', L.ra, 0.1, 'Ω'],
                      ['la', L.la, 0.0001, 'H'],
                      ['kphi', L.kphi, 0.01, 'N·m/A'],
                      ['inertia', L.inertia, 0.00001, 'kg·m²'],
                      ['friction', L.friction, 0.00001, 'N·m·s/rad'],
                      ['positionGain', L.positionGain, 0.1, 'V/rad'],
                      ['tachGain', L.tachGain, 0.01, 'V·s/rad'],
                    ] as const
                  ).map(([key, label, step, unit]) => (
                    <NumberControl
                      key={key}
                      label={label}
                      value={p[key]}
                      min={lim[key].min}
                      max={lim[key].max}
                      step={step}
                      unit={unit}
                      disabled={locked}
                      onChange={(v) => set(key, v)}
                    />
                  ))}
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
                {pos ? (
                  <>
                    <MeasurementDisplay
                      label={L.measurements.reference}
                      symbol="θref"
                      value={out.referenceDeg}
                      unit="°"
                    />
                    <MeasurementDisplay
                      label={L.measurements.position}
                      symbol="θ"
                      value={out.positionDeg}
                      unit="°"
                    />
                    <MeasurementDisplay
                      label={L.measurements.error}
                      symbol="e"
                      value={out.errorDeg}
                      unit="°"
                    />
                  </>
                ) : (
                  <>
                    <MeasurementDisplay
                      label={L.measurements.reference}
                      symbol="Nref"
                      value={out.referenceRpm}
                      unit="rpm"
                    />
                    <MeasurementDisplay
                      label={L.measurements.error}
                      symbol="e"
                      value={out.errorRpm}
                      unit="rpm"
                    />
                  </>
                )}
                <MeasurementDisplay
                  label={L.measurements.speed}
                  symbol="N"
                  value={out.speedRpm}
                  unit="rpm"
                />
                <MeasurementDisplay
                  label={L.measurements.vcs}
                  symbol="Vcs"
                  value={out.vcs}
                  unit="V"
                />
                <MeasurementDisplay
                  label={L.measurements.vfc}
                  symbol="Vfc"
                  value={out.vfc}
                  unit="V"
                />
                <MeasurementDisplay
                  label={L.measurements.driveSignal}
                  symbol="Ve"
                  value={out.driveSignal}
                  unit="V"
                />
                <MeasurementDisplay
                  label={L.measurements.armatureVoltage}
                  symbol="Va"
                  value={out.armatureVoltage}
                  unit="V"
                />
                <MeasurementDisplay
                  label={L.measurements.armatureCurrent}
                  symbol="Ia"
                  value={out.armatureCurrent}
                  unit="A"
                />
                <MeasurementDisplay
                  label={L.measurements.torque}
                  symbol="Td"
                  value={out.torque}
                  unit="N·m"
                />
                <MeasurementDisplay
                  label={L.measurements.encoderCount}
                  symbol="count"
                  value={out.encoderCount}
                  unit=""
                />
                <MeasurementDisplay
                  label={L.measurements.resolverSin}
                  symbol="Vsin"
                  value={out.resolverSin}
                  unit="V"
                />
                <MeasurementDisplay
                  label={L.measurements.resolverCos}
                  symbol="Vcos"
                  value={out.resolverCos}
                  unit="V"
                />
                <MeasurementDisplay
                  label={L.measurements.resolverQuadrant}
                  symbol="Q"
                  value={out.resolverQuadrant}
                  unit=""
                />
              </div>
              {metrics ? (
                <section aria-label={L.metricsTitle} className="space-y-2">
                  <h3 className="text-sm font-semibold text-navy-800">{L.metricsTitle}</h3>
                  <p className="text-xs text-navy-600">{L.metricsNote}</p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                    <MeasurementDisplay
                      label={L.measurements.riseTime}
                      symbol="tr"
                      value={metricValues.riseTime}
                      unit="s"
                    />
                    <MeasurementDisplay
                      label={L.measurements.overshoot}
                      symbol="Mp"
                      value={metricValues.overshootPercent}
                      unit="%"
                    />
                    <MeasurementDisplay
                      label={L.measurements.settlingTime}
                      symbol="ts"
                      value={metricValues.settlingTime}
                      unit="s"
                    />
                    <MeasurementDisplay
                      label={L.measurements.steadyStateError}
                      symbol="ess"
                      value={metricValues.steadyStateError}
                      unit={pos ? '°' : 'rpm'}
                    />
                  </div>
                </section>
              ) : null}
              <RecordPanel
                rows={lab.rows}
                columns={M05_RESULT_COLUMNS}
                onRecord={() =>
                  lab.record({
                    time: sim.time,
                    parameters: numericParameters(p),
                    measurements: { ...out, ...metricValues },
                  })
                }
                onClear={lab.clear}
              />
            </div>
          ),

          graphs: (
            <div className="space-y-6">
              <ChartFigure
                title={L.responseTitle}
                description={L.responseDesc}
                columns={[
                  { key: 't', label: 't (s)' },
                  ...responseSeries.map((s) => ({ key: s.key, label: `${s.label} (${s.unit})` })),
                ]}
                rows={responseRows}
                testId="response-chart"
              >
                <TimeTraceChart
                  rows={responseRows}
                  series={responseSeries}
                  timeUnit="s"
                  yLabel={pos ? 'θ (°)' : 'N (rpm)'}
                  xMin={xMin}
                  xMax={xMax}
                  height={240}
                />
              </ChartFigure>
              <ChartFigure
                title={L.errorTitle}
                description={L.errorDesc}
                columns={[
                  { key: 't', label: 't (s)' },
                  { key: errorSeries[0]?.key ?? 'error', label: `e (${pos ? '°' : 'rpm'})` },
                ]}
                rows={errorRows}
                testId="error-chart"
              >
                <TimeTraceChart
                  rows={errorRows}
                  series={errorSeries}
                  timeUnit="s"
                  yLabel={pos ? 'e (°)' : 'e (rpm)'}
                  xMin={xMin}
                  xMax={xMax}
                  height={200}
                />
              </ChartFigure>
              <ChartFigure
                title={L.amplifierTitle}
                description={L.amplifierDesc}
                columns={[
                  { key: 't', label: 't (s)' },
                  { key: 'armatureVoltage', label: 'Va (V)' },
                ]}
                rows={ampRows}
                testId="amplifier-chart"
              >
                <TimeTraceChart
                  rows={ampRows}
                  series={ampSeries}
                  timeUnit="s"
                  yLabel="Va (V)"
                  xMin={xMin}
                  xMax={xMax}
                  height={200}
                />
              </ChartFigure>
            </div>
          ),

          instructions: (
            <ActivitiesList
              activities={M05_ACTIVITIES}
              done={lab.done}
              onToggle={lab.toggleActivity}
            />
          ),

          assessment: <AssessmentPanel moduleId={M05_ID} questions={M05_QUESTIONS} />,
        }}
      />
    </>
  );
}
