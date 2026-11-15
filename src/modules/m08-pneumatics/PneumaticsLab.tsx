import { useState } from 'react';
import { colors, LinkButton, MeasurementDisplay, NumberControl } from '@/design-system';
import { AssessmentPanel } from '@/features/assessment';
import { CylinderView, HoldButton, SignalChain } from '@/features/fluid-power';
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
  barToPa,
  hasMemoryValve,
  isSingleActing,
  mmToM,
  mToMm,
  paToBar,
  PNEUMATIC_CIRCUITS,
  PNEUMATIC_LIMITS,
  PNEUMATIC_PRESETS,
  pneumaticSignals,
  pneumaticsModel,
  type Issue,
  type PneumaticCircuitId,
  type PneumaticsParams,
  type ThrottleMode,
} from '@/sim-core';
import { M08_ACTIVITIES, M08_LABELS as L, M08_OUTCOMES, M08_THEORY } from './content.en';
import { M08_QUESTIONS } from './questions';
import { M08_RESULT_COLUMNS, numericParameters } from './results';

export const M08_ID = 'm08-pneumatics';
const WINDOW = 6;
const POSITION: readonly SeriesSpec[] = [
  { key: 'positionMm', label: 'x', unit: 'mm', color: colors.navy[700] },
];
const PRESSURES: readonly SeriesSpec[] = [
  { key: 'capPressureBar', label: '1Z1', unit: 'bar', color: colors.navy[700] },
  { key: 'rodPressureBar', label: '1Z2', unit: 'bar', color: colors.lightblue[400] },
];

/** M08 Pneumatics laboratory (Lab 2): all seven regions (FR-02). */
export default function PneumaticsLab() {
  const sim = useSimulation(pneumaticsModel, {
    timeScale: 1,
    recordInterval: 0.005,
    recorderCapacity: 4000,
  });
  const lab = useLabRecords(M08_ID);
  const [playback, setPlayback] = useState(1);
  const [issues, setIssues] = useState<Issue[]>([]);
  const p = sim.params;
  const out = sim.outputs;
  const locked = sim.status !== 'idle';
  const lim = PNEUMATIC_LIMITS;
  const single = isSingleActing(p.circuit);
  const memory = hasMemoryValve(p.circuit);

  function apply(next: PneumaticsParams, key?: keyof PneumaticsParams) {
    setIssues(
      sim
        .setParams(next)
        .filter((i) => i.severity === 'error' || key === undefined || i.parameter === key),
    );
  }
  function set<K extends keyof PneumaticsParams>(key: K, value: PneumaticsParams[K]) {
    apply({ ...p, [key]: value }, key);
  }
  function changePlayback(v: number) {
    setPlayback(v);
    sim.setTimeScale(v);
  }

  const sig = pneumaticSignals(p.circuit, p, out.atRetracted === 1, out.atExtended === 1);
  const inputs = Object.entries(sig.lines)
    .filter(([k]) => k.startsWith('1S') || k.startsWith('1B'))
    .map(([label, on]) => ({ label, on }));
  const logic = Object.entries(sig.lines)
    .filter(([k]) => !k.startsWith('1S') && !k.startsWith('1B'))
    .map(([label, on]) => ({ label, on }));
  const valveName = memory ? L.valveMemory : single ? L.valve32 : L.valve52;
  const stages = [
    [
      {
        label: `1V ${valveName}`,
        on: out.drive === 1,
        detail: out.drive ? L.driveExtend : L.driveReturn,
      },
    ],
    ...(logic.length ? [logic] : []),
    inputs,
  ];

  const xMin = Math.max(0, sim.time - WINDOW);
  const xMax = Math.max(WINDOW, sim.time);
  const windowTrace = sim.trace.filter((s) => s.t >= xMin);
  const posRows = toTimeRows(windowTrace, POSITION, 1);
  const pRows = toTimeRows(windowTrace, PRESSURES, 1);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <LinkButton to={`/reports/${M08_ID}`} variant="secondary">
          {L.openReport}
        </LinkButton>
        <span className="text-sm text-navy-600">{L.dataNote}</span>
      </div>
      <LabShell
        placeholderMilestone={8}
        regions={{
          theory: (
            <div className="space-y-4 text-sm">
              <p>{M08_THEORY.intro}</p>
              <OutcomesList outcomes={M08_OUTCOMES} />
              <TheoryBlock title={M08_THEORY.equationsTitle} items={M08_THEORY.equations} mono />
              <TheoryBlock
                title={M08_THEORY.componentsTitle}
                items={M08_THEORY.components}
                collapsible
              />
              <TheoryBlock title={M08_THEORY.controlTitle} collapsible>
                <p className="mt-1">{M08_THEORY.control}</p>
              </TheoryBlock>
              <TheoryBlock title={M08_THEORY.modelTitle} collapsible>
                <p className="mt-1">{M08_THEORY.model}</p>
              </TheoryBlock>
              <TheoryBlock
                title={t('lab.assumptionsTitle')}
                items={pneumaticsModel.assumptions}
                collapsible
              />
            </div>
          ),

          workspace: (
            <div className="space-y-3">
              <figure>
                <figcaption className="text-sm font-medium text-navy-800">{L.diagram}</figcaption>
                <CylinderView
                  label={`${L.cylinder} (${single ? L.singleActing : L.doubleActing})`}
                  fraction={out.position / p.stroke}
                  singleActing={single}
                  capPressurised={out.capPressureBar > 0.05}
                  rodPressurised={out.rodPressureBar > 0.05}
                  sensors={['1B1', out.atRetracted === 1, '1B2', out.atExtended === 1]}
                  testId="pneumatic-cylinder"
                />
                <p className="mt-2 text-sm font-medium text-navy-800">{L.signalChainTitle}</p>
                <SignalChain stages={stages} testId="signal-chain" />
              </figure>
              <fieldset>
                <legend className="text-sm font-medium text-navy-800">{L.operate}</legend>
                <div className="mt-1 flex flex-wrap gap-2">
                  {p.circuit === 'indirect' ? (
                    <button
                      type="button"
                      aria-pressed={p.selector}
                      className={`min-h-touch rounded-md border px-4 font-semibold ${p.selector ? 'border-navy-800 bg-navy-700 text-white' : 'border-navy-200 bg-lightblue-50 text-navy-900'}`}
                      onClick={() => set('selector', !p.selector)}
                    >
                      {L.selector}: {p.selector ? L.on : L.off}
                    </button>
                  ) : (
                    <>
                      <HoldButton label={L.s1} pressed={p.s1} onChange={(v) => set('s1', v)} />
                      {p.circuit !== 'direct' ? (
                        <HoldButton label={L.s2} pressed={p.s2} onChange={(v) => set('s2', v)} />
                      ) : null}
                    </>
                  )}
                </div>
              </fieldset>
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
              <SelectField<PneumaticCircuitId>
                label={L.circuit}
                value={p.circuit}
                disabled={locked}
                options={PNEUMATIC_CIRCUITS.map((c) => ({ value: c, label: L.circuits[c] }))}
                onChange={(c) => apply(PNEUMATIC_PRESETS[c])}
              />
              <NumberControl
                label={L.supply}
                value={Number(paToBar(p.supply).toFixed(3))}
                min={0}
                max={6}
                step={0.1}
                unit="bar"
                onChange={(v) => set('supply', barToPa(v))}
              />
              <NumberControl
                label={L.loadForce}
                value={p.loadForce}
                min={lim.loadForce.min}
                max={lim.loadForce.max}
                step={5}
                unit="N"
                onChange={(v) => set('loadForce', v)}
              />
              {!single ? (
                <>
                  <SelectField<ThrottleMode>
                    label={L.throttleMode}
                    value={p.throttleMode}
                    options={(['meter-out', 'meter-in', 'none'] as const).map((m) => ({
                      value: m,
                      label: L.throttleModes[m],
                    }))}
                    onChange={(v) => set('throttleMode', v)}
                  />
                  {p.throttleMode !== 'none' ? (
                    <NumberControl
                      label={L.throttle}
                      value={Math.round(p.throttle * 100)}
                      min={1}
                      max={100}
                      step={1}
                      unit="%"
                      onChange={(v) => set('throttle', v / 100)}
                    />
                  ) : null}
                </>
              ) : null}
              <details className="rounded-md border border-navy-100 p-3">
                <summary className="min-h-touch cursor-pointer py-2 text-sm font-semibold text-navy-800">
                  {L.cylinderTitle}
                </summary>
                <div className="mt-2 space-y-4">
                  <NumberControl
                    label={L.bore}
                    value={mToMm(p.bore)}
                    min={8}
                    max={100}
                    step={1}
                    unit="mm"
                    disabled={locked}
                    onChange={(v) => set('bore', mmToM(v))}
                  />
                  <NumberControl
                    label={L.rod}
                    value={mToMm(p.rod)}
                    min={3}
                    max={40}
                    step={1}
                    unit="mm"
                    disabled={locked}
                    onChange={(v) => set('rod', mmToM(v))}
                  />
                  <NumberControl
                    label={L.stroke}
                    value={mToMm(p.stroke)}
                    min={10}
                    max={500}
                    step={10}
                    unit="mm"
                    disabled={locked}
                    onChange={(v) => set('stroke', mmToM(v))}
                  />
                  {single ? (
                    <NumberControl
                      label={L.springForce}
                      value={p.springForce}
                      min={0}
                      max={200}
                      step={0.1}
                      unit="N"
                      disabled={locked}
                      onChange={(v) => set('springForce', v)}
                    />
                  ) : null}
                  <NumberControl
                    label={L.friction}
                    value={p.friction}
                    min={lim.friction.min}
                    max={lim.friction.max}
                    step={0.01}
                    unit="—"
                    disabled={locked}
                    onChange={(v) => set('friction', v)}
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
                  label={L.measurements.position}
                  symbol="x"
                  value={out.positionMm}
                  unit="mm"
                />
                <MeasurementDisplay
                  label={L.measurements.velocity}
                  symbol="v"
                  value={out.velocity}
                  unit="m/s"
                />
                <MeasurementDisplay
                  label={L.measurements.capPressure}
                  symbol="p1"
                  value={out.capPressureBar}
                  unit="bar"
                />
                {!single ? (
                  <MeasurementDisplay
                    label={L.measurements.rodPressure}
                    symbol="p2"
                    value={out.rodPressureBar}
                    unit="bar"
                  />
                ) : null}
                <MeasurementDisplay
                  label={L.measurements.theoreticalForce}
                  symbol="F"
                  value={out.theoreticalForce}
                  unit="N"
                />
                <MeasurementDisplay
                  label={L.measurements.extendForce}
                  symbol="F ext"
                  value={out.extendForce}
                  unit="N"
                />
                <MeasurementDisplay
                  label={L.measurements.retractForce}
                  symbol="F ret"
                  value={out.retractForce}
                  unit="N"
                />
                <MeasurementDisplay
                  label={L.measurements.extendTime}
                  symbol="t ext"
                  value={out.extendTime}
                  unit="s"
                />
                <MeasurementDisplay
                  label={L.measurements.retractTime}
                  symbol="t ret"
                  value={out.retractTime}
                  unit="s"
                />
              </div>
              <RecordPanel
                rows={lab.rows}
                columns={M08_RESULT_COLUMNS}
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
                title={L.positionTitle}
                description={L.positionDesc}
                columns={[
                  { key: 't', label: 't (s)' },
                  { key: 'positionMm', label: 'x (mm)' },
                ]}
                rows={posRows}
                testId="position-chart"
              >
                <TimeTraceChart
                  rows={posRows}
                  series={POSITION}
                  timeUnit="s"
                  yLabel="x (mm)"
                  xMin={xMin}
                  xMax={xMax}
                  height={200}
                />
              </ChartFigure>
              <ChartFigure
                title={L.pressureTitle}
                description={L.pressureDesc}
                columns={[
                  { key: 't', label: 't (s)' },
                  { key: 'capPressureBar', label: '1Z1 (bar)' },
                  { key: 'rodPressureBar', label: '1Z2 (bar)' },
                ]}
                rows={pRows}
                testId="pressure-chart"
              >
                <TimeTraceChart
                  rows={pRows}
                  series={PRESSURES}
                  timeUnit="s"
                  yLabel="p (bar)"
                  xMin={xMin}
                  xMax={xMax}
                  height={200}
                />
              </ChartFigure>
            </div>
          ),

          instructions: (
            <ActivitiesList
              activities={M08_ACTIVITIES}
              done={lab.done}
              onToggle={lab.toggleActivity}
            />
          ),

          assessment: <AssessmentPanel moduleId={M08_ID} questions={M08_QUESTIONS} />,
        }}
      />
    </>
  );
}
