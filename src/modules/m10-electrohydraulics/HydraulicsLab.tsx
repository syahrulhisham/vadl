import { useState } from 'react';
import { colors, LinkButton, MeasurementDisplay, NumberControl } from '@/design-system';
import { AssessmentPanel } from '@/features/assessment';
import { CylinderView, HoldButton, LadderDiagram, Lamp, SignalChain } from '@/features/fluid-power';
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
  cubicMetresPerSecToLitresPerMin,
  formatSignificant,
  HYDRAULIC_CIRCUITS,
  HYDRAULIC_PRESETS,
  hydraulicLadder,
  hydraulicsModel,
  isElectrical,
  isVertical,
  litresPerMinToCubicMetresPerSec,
  mmToM,
  mpaToPa,
  mToMm,
  paToMpa,
  type Contact,
  type HydraulicCircuitId,
  type HydraulicsParams,
  type Issue,
} from '@/sim-core';
import { M10_ACTIVITIES, M10_LABELS as L, M10_OUTCOMES, M10_THEORY } from './content.en';
import { M10_QUESTIONS } from './questions';
import { M10_RESULT_COLUMNS, numericParameters } from './results';

export const M10_ID = 'm10-electrohydraulics';
const WINDOW = 6;
const fmt = (v: number) => formatSignificant(v, 3);
const POSITION: readonly SeriesSpec[] = [
  { key: 'positionMm', label: 'x', unit: 'mm', color: colors.navy[700] },
];
const PRESSURES: readonly SeriesSpec[] = [
  { key: 'pumpPressure', label: 'P', unit: 'MPa', color: colors.navy[900], scale: 1e-6 },
  { key: 'capPressure', label: 'A', unit: 'MPa', color: colors.navy[500], scale: 1e-6 },
  { key: 'rodPressure', label: 'B', unit: 'MPa', color: colors.lightblue[400], scale: 1e-6 },
];

/** M10 Hydraulics and electrohydraulics laboratory (Labs 4a, 4b): all seven regions (FR-02). */
export default function HydraulicsLab() {
  const sim = useSimulation(hydraulicsModel, {
    timeScale: 1,
    recordInterval: 0.005,
    recorderCapacity: 4000,
  });
  const lab = useLabRecords(M10_ID);
  const [playback, setPlayback] = useState(1);
  const [issues, setIssues] = useState<Issue[]>([]);
  const p = sim.params;
  const out = sim.outputs;
  const locked = sim.status !== 'idle';
  const vertical = isVertical(p.circuit);
  const electrical = isElectrical(p.circuit);
  const ladder = hydraulicLadder(p.circuit);

  function apply(next: HydraulicsParams, key?: keyof HydraulicsParams) {
    setIssues(
      sim
        .setParams(next)
        .filter((i) => i.severity === 'error' || key === undefined || i.parameter === key),
    );
  }
  function set<K extends keyof HydraulicsParams>(key: K, value: HydraulicsParams[K]) {
    apply({ ...p, [key]: value }, key);
  }
  function changePlayback(v: number) {
    setPlayback(v);
    sim.setTimeScale(v);
  }

  const mode = L.modes[out.mode] ?? '';
  const moving = out.velocity !== 0;
  const mpa = (pa: number) => `${fmt(paToMpa(pa))} MPa`;
  const lpm = (q: number) => `${fmt(cubicMetresPerSecToLitresPerMin(q))} L/min`;
  const stages = [
    [{ label: `1A1 (${vertical ? L.vertical : L.horizontal})`, on: moving, detail: mode }],
    [
      { label: 'A', on: out.capPressure > 0, detail: mpa(out.capPressure) },
      { label: 'B', on: out.rodPressure > 0, detail: mpa(out.rodPressure) },
      { label: L.chain.fcv, on: moving, detail: `${Math.round(p.throttle * 100)} %` },
    ],
    [
      {
        label: electrical ? L.chain.solenoidValve : L.chain.leverValve,
        on: out.mode !== 4,
        detail: mode,
      },
      ...(vertical ? [{ label: L.chain.check, on: out.mode === 1 }] : []),
    ],
    [
      {
        label: L.chain.pump,
        on: p.pumpOn,
        detail: `${lpm(p.pumpOn ? p.pumpFlow : 0)}, ${mpa(out.pumpPressure)}`,
      },
      { label: L.chain.relief, on: out.reliefFlow > 0, detail: lpm(out.reliefFlow) },
    ],
  ];
  const signalOn = (c: Contact) =>
    c.source === 'S1'
      ? p.s1
      : c.source === 'S2'
        ? p.s2
        : c.source === 'S3'
          ? p.s3
          : c.source.startsWith('K')
            ? out[`coil_${c.source}`] === 1
            : false;
  const rungsOn = ladder.map((_, i) => out[`rung${i}`] === 1);

  const xMin = Math.max(0, sim.time - WINDOW);
  const xMax = Math.max(WINDOW, sim.time);
  const tr = sim.trace.filter((s) => s.t >= xMin);
  const posRows = toTimeRows(tr, POSITION, 1);
  const pRows = toTimeRows(tr, PRESSURES, 1);

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <LinkButton to={`/reports/${M10_ID}`} variant="secondary">
          {L.openReport}
        </LinkButton>
        <span className="text-sm text-navy-600">{L.dataNote}</span>
      </div>
      <LabShell
        placeholderMilestone={8}
        regions={{
          theory: (
            <div className="space-y-4 text-sm">
              <p>{M10_THEORY.intro}</p>
              <OutcomesList outcomes={M10_OUTCOMES} />
              <TheoryBlock title={M10_THEORY.equationsTitle} items={M10_THEORY.equations} mono />
              <TheoryBlock
                title={M10_THEORY.componentsTitle}
                items={M10_THEORY.components}
                collapsible
              />
              <TheoryBlock
                title={M10_THEORY.electricalTitle}
                items={M10_THEORY.electrical}
                collapsible
              />
              <TheoryBlock title={M10_THEORY.modelTitle} collapsible>
                <p className="mt-1">{M10_THEORY.model}</p>
              </TheoryBlock>
              <TheoryBlock
                title={t('lab.assumptionsTitle')}
                items={hydraulicsModel.assumptions}
                collapsible
              />
            </div>
          ),

          workspace: (
            <div className="space-y-3">
              <figure>
                <figcaption className="text-sm font-medium text-navy-800">{L.diagram}</figcaption>
                <CylinderView
                  label={`1A1 16/10/200 (${vertical ? L.vertical : L.horizontal})`}
                  fraction={out.positionMm / mToMm(p.stroke)}
                  singleActing={false}
                  capPressurised={out.capPressure > 0}
                  rodPressurised={out.rodPressure > 0}
                  testId="hydraulic-cylinder"
                />
                <SignalChain stages={stages} testId="hydraulic-chain" />
              </figure>
              {out.cavitation === 1 ? (
                <p
                  role="alert"
                  className="rounded bg-status-warningBg px-3 py-2 text-sm text-status-warning"
                >
                  {L.cavitation}
                </p>
              ) : null}
              <fieldset>
                <legend className="text-sm font-medium text-navy-800">{L.operate}</legend>
                <div className="mt-1 flex flex-wrap gap-2">
                  <button
                    type="button"
                    aria-pressed={p.pumpOn}
                    className={`min-h-touch rounded-md border px-4 font-semibold ${p.pumpOn ? 'border-navy-800 bg-navy-700 text-white' : 'border-navy-200 bg-lightblue-50 text-navy-900'}`}
                    onClick={() => set('pumpOn', !p.pumpOn)}
                  >
                    {L.pump}: {p.pumpOn ? L.pumpOn : L.pumpOff}
                  </button>
                  {electrical ? (
                    <>
                      <HoldButton label="S1" pressed={p.s1} onChange={(v) => set('s1', v)} />
                      {p.circuit !== '4b-ex1' ? (
                        <>
                          <HoldButton label="S2" pressed={p.s2} onChange={(v) => set('s2', v)} />
                          <HoldButton label={L.s3} pressed={p.s3} onChange={(v) => set('s3', v)} />
                        </>
                      ) : null}
                    </>
                  ) : (
                    <button
                      type="button"
                      aria-pressed={p.lever}
                      className={`min-h-touch rounded-md border px-4 font-semibold ${p.lever ? 'border-navy-800 bg-navy-700 text-white' : 'border-navy-200 bg-lightblue-50 text-navy-900'}`}
                      onClick={() => set('lever', !p.lever)}
                    >
                      {L.lever}: {p.lever ? L.leverOn : L.leverOff}
                    </button>
                  )}
                </div>
              </fieldset>
              {electrical ? (
                <>
                  <div role="group" aria-label={L.coils} className="flex flex-wrap gap-2">
                    {(['K1', '1M1', '1M2'] as const).map((c) => (
                      <Lamp key={c} label={c} on={out[`coil_${c}`] === 1} testId={`lamp-${c}`} />
                    ))}
                  </div>
                  <LadderDiagram ladder={ladder} rungsOn={rungsOn} signalOn={signalOn} />
                </>
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
              <SelectField<HydraulicCircuitId>
                label={L.circuit}
                value={p.circuit}
                disabled={locked}
                options={HYDRAULIC_CIRCUITS.map((c) => ({ value: c, label: L.circuits[c] }))}
                onChange={(c) => apply(HYDRAULIC_PRESETS[c])}
              />
              <NumberControl
                label={L.pumpFlow}
                value={Number(cubicMetresPerSecToLitresPerMin(p.pumpFlow).toFixed(3))}
                min={0.5}
                max={10}
                step={0.1}
                unit="L/min"
                onChange={(v) => set('pumpFlow', litresPerMinToCubicMetresPerSec(v))}
              />
              <NumberControl
                label={L.relief}
                value={Number(paToMpa(p.reliefSetting).toFixed(3))}
                min={0.5}
                max={6}
                step={0.1}
                unit="MPa"
                onChange={(v) => set('reliefSetting', mpaToPa(v))}
              />
              <NumberControl
                label={L.throttle}
                value={Math.round(p.throttle * 100)}
                min={1}
                max={100}
                step={1}
                unit="%"
                onChange={(v) => set('throttle', v / 100)}
              />
              <NumberControl
                label={L.loadForce}
                value={p.loadForce}
                min={0}
                max={5000}
                step={10}
                unit="N"
                onChange={(v) => set('loadForce', v)}
              />
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
                    min={4}
                    max={90}
                    step={1}
                    unit="mm"
                    disabled={locked}
                    onChange={(v) => set('rod', mmToM(v))}
                  />
                  <NumberControl
                    label={L.stroke}
                    value={mToMm(p.stroke)}
                    min={20}
                    max={1000}
                    step={10}
                    unit="mm"
                    disabled={locked}
                    onChange={(v) => set('stroke', mmToM(v))}
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
                  label={L.measurements.pumpPressure}
                  symbol="pP"
                  value={paToMpa(out.pumpPressure)}
                  unit="MPa"
                />
                <MeasurementDisplay
                  label={L.measurements.capPressure}
                  symbol="pA"
                  value={paToMpa(out.capPressure)}
                  unit="MPa"
                />
                <MeasurementDisplay
                  label={L.measurements.rodPressure}
                  symbol="pB"
                  value={paToMpa(out.rodPressure)}
                  unit="MPa"
                />
                {vertical ? (
                  <MeasurementDisplay
                    label={L.measurements.loadPressure}
                    symbol="pL"
                    value={paToMpa(out.loadPressure)}
                    unit="MPa"
                  />
                ) : null}
                <MeasurementDisplay
                  label={L.measurements.cylinderFlow}
                  symbol="q"
                  value={cubicMetresPerSecToLitresPerMin(out.cylinderFlow)}
                  unit="L/min"
                />
                <MeasurementDisplay
                  label={L.measurements.reliefFlow}
                  symbol="qR"
                  value={cubicMetresPerSecToLitresPerMin(out.reliefFlow)}
                  unit="L/min"
                />
                <MeasurementDisplay
                  label={L.measurements.hydraulicPower}
                  symbol="P"
                  value={out.hydraulicPower}
                  unit="W"
                />
                <MeasurementDisplay
                  label={L.measurements.drivePower}
                  symbol="Pdrive"
                  value={out.drivePower}
                  unit="W"
                />
                <MeasurementDisplay
                  label={L.measurements.areaRatio}
                  symbol="φ"
                  value={out.areaRatio}
                  unit=""
                />
                {electrical ? (
                  <MeasurementDisplay
                    label={L.measurements.coilCurrent}
                    symbol="I"
                    value={out.coilCurrentTotal}
                    unit="A"
                  />
                ) : null}
              </div>
              <RecordPanel
                rows={lab.rows}
                columns={M10_RESULT_COLUMNS}
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
                  { key: 'pumpPressure', label: 'P (MPa)' },
                  { key: 'capPressure', label: 'A (MPa)' },
                  { key: 'rodPressure', label: 'B (MPa)' },
                ]}
                rows={pRows}
                testId="pressure-chart"
              >
                <TimeTraceChart
                  rows={pRows}
                  series={PRESSURES}
                  timeUnit="s"
                  yLabel="p (MPa)"
                  xMin={xMin}
                  xMax={xMax}
                  height={220}
                />
              </ChartFigure>
            </div>
          ),

          instructions: (
            <ActivitiesList
              activities={M10_ACTIVITIES}
              done={lab.done}
              onToggle={lab.toggleActivity}
            />
          ),

          assessment: <AssessmentPanel moduleId={M10_ID} questions={M10_QUESTIONS} />,
        }}
      />
    </>
  );
}
