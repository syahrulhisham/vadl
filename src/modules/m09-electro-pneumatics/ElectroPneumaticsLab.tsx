import { useState } from 'react';
import { Button, colors, LinkButton, MeasurementDisplay, NumberControl } from '@/design-system';
import { AssessmentPanel, mulberry32, newSeed, pick } from '@/features/assessment';
import { CylinderView, HoldButton, LadderDiagram, Lamp } from '@/features/fluid-power';
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
  ELECTRO_PNEUMATIC_PRESETS,
  electroPneumaticsModel,
  LADDER_FAULTS,
  mToMm,
  paToBar,
  type Contact,
  type ElectroPneumaticPresetName,
  type ElectroPneumaticsParams,
  type Issue,
  type LadderFault,
  type Valve1Kind,
  type Valve2Kind,
} from '@/sim-core';
import { M09_ACTIVITIES, M09_LABELS as L, M09_OUTCOMES, M09_THEORY } from './content.en';
import { DesignTasks } from './DesignTasks';
import { LadderEditor } from './LadderEditor';
import { M09_QUESTIONS } from './questions';
import { M09_RESULT_COLUMNS, numericParameters } from './results';

export const M09_ID = 'm09-electro-pneumatics';
const PRESETS = Object.keys(ELECTRO_PNEUMATIC_PRESETS) as ElectroPneumaticPresetName[];
const WINDOW = 8;
const POSITIONS: readonly SeriesSpec[] = [
  { key: 'x1Mm', label: '1A1', unit: 'mm', color: colors.navy[700] },
  { key: 'x2Mm', label: '2A1', unit: 'mm', color: colors.lightblue[400] },
];
const COILS = ['K1', 'K2', 'K3', 'T1', '1M1', '1M2', '2M1'] as const;
const SENSORS = ['1B1', '1B2', '2B1', '2B2'] as const;

/** M09 Electro-pneumatics laboratory (Lab 3): all seven regions (FR-02). */
export default function ElectroPneumaticsLab() {
  const sim = useSimulation(electroPneumaticsModel, {
    timeScale: 1,
    recordInterval: 0.01,
    recorderCapacity: 4000,
  });
  const lab = useLabRecords(M09_ID);
  const [playback, setPlayback] = useState(1);
  const [issues, setIssues] = useState<Issue[]>([]);
  const [hidden, setHidden] = useState(false);
  const [diagnosis, setDiagnosis] = useState<LadderFault>('none');
  const [verdict, setVerdict] = useState<boolean | null>(null);
  const p = sim.params;
  const out = sim.outputs;
  const locked = sim.status !== 'idle';

  function apply(next: ElectroPneumaticsParams, key?: keyof ElectroPneumaticsParams) {
    setIssues(
      sim
        .setParams(next)
        .filter((i) => i.severity === 'error' || key === undefined || i.parameter === key),
    );
  }
  function set<K extends keyof ElectroPneumaticsParams>(key: K, value: ElectroPneumaticsParams[K]) {
    apply({ ...p, [key]: value }, key);
  }
  function changePlayback(v: number) {
    setPlayback(v);
    sim.setTimeScale(v);
  }
  function insertHiddenFault() {
    const rng = mulberry32(newSeed());
    const fault = pick(
      rng,
      LADDER_FAULTS.filter((f) => f !== 'none'),
    );
    setHidden(true);
    setVerdict(null);
    set('fault', fault);
  }
  function clearFault() {
    setHidden(false);
    setVerdict(null);
    set('fault', 'none');
  }

  const signalOn = (c: Contact) => {
    switch (c.source) {
      case 'S1':
        return p.s1;
      case 'S2':
        return p.s2;
      case 'S3':
        return p.s3;
      case 'T1':
        return (out.timerElapsed ?? 0) >= p.timerDelay;
      case 'K1':
      case 'K2':
      case 'K3':
        return out[`coil_${c.source}`] === 1;
      default:
        return out[`sensor_${c.source}`] === 1;
    }
  };
  const rungsOn = p.ladder.map((_, i) => out[`rung${i}`] === 1);
  const xMin = Math.max(0, sim.time - WINDOW);
  const xMax = Math.max(WINDOW, sim.time);
  const rows = toTimeRows(
    sim.trace.filter((s) => s.t >= xMin),
    POSITIONS,
    1,
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <LinkButton to={`/reports/${M09_ID}`} variant="secondary">
          {L.openReport}
        </LinkButton>
        <span className="text-sm text-navy-600">{L.dataNote}</span>
      </div>
      <LabShell
        placeholderMilestone={8}
        regions={{
          theory: (
            <div className="space-y-4 text-sm">
              <p>{M09_THEORY.intro}</p>
              <OutcomesList outcomes={M09_OUTCOMES} />
              <TheoryBlock title={M09_THEORY.elementsTitle} items={M09_THEORY.elements} />
              <TheoryBlock title={M09_THEORY.ladderTitle} items={M09_THEORY.ladder} collapsible />
              <TheoryBlock
                title={M09_THEORY.electricalTitle}
                items={M09_THEORY.electrical}
                collapsible
              />
              <TheoryBlock
                title={t('lab.assumptionsTitle')}
                items={electroPneumaticsModel.assumptions}
                collapsible
              />
            </div>
          ),

          workspace: (
            <div className="space-y-3">
              <CylinderView
                label="1A1"
                fraction={out.x1Mm / mToMm(p.stroke)}
                singleActing={false}
                capPressurised={out.valve1Extend === 1}
                rodPressurised={out.valve1Extend === 0}
                sensors={['1B1', out.sensor_1B1 === 1, '1B2', out.sensor_1B2 === 1]}
                testId="cylinder-1A1"
              />
              <CylinderView
                label="2A1"
                fraction={out.x2Mm / mToMm(p.stroke)}
                singleActing
                capPressurised={out.valve2Extend === 1}
                rodPressurised={false}
                sensors={['2B1', out.sensor_2B1 === 1, '2B2', out.sensor_2B2 === 1]}
                testId="cylinder-2A1"
              />
              <fieldset>
                <legend className="text-sm font-medium text-navy-800">{L.operate}</legend>
                <div className="mt-1 flex flex-wrap gap-2">
                  <HoldButton label="S1" pressed={p.s1} onChange={(v) => set('s1', v)} />
                  <HoldButton label="S2" pressed={p.s2} onChange={(v) => set('s2', v)} />
                  <HoldButton label="S3" pressed={p.s3} onChange={(v) => set('s3', v)} />
                </div>
              </fieldset>
              <div
                role="group"
                aria-label={L.coils}
                className="flex flex-wrap gap-2"
                data-testid="coil-lamps"
              >
                {COILS.map((c) => (
                  <Lamp key={c} label={c} on={out[`coil_${c}`] === 1} testId={`lamp-${c}`} />
                ))}
              </div>
              <div role="group" aria-label={L.sensors} className="flex flex-wrap gap-2">
                {SENSORS.map((s) => (
                  <Lamp key={s} label={s} on={out[`sensor_${s}`] === 1} />
                ))}
              </div>
              <figure>
                <figcaption className="text-sm font-medium text-navy-800">
                  {L.ladderTitle}
                </figcaption>
                <LadderDiagram ladder={p.ladder} rungsOn={rungsOn} signalOn={signalOn} />
              </figure>
              {out.stable === 0 ? (
                <p
                  role="alert"
                  className="rounded bg-status-warningBg px-3 py-2 text-sm text-status-warning"
                >
                  {L.chatter}
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
                      onClick={() => apply({ ...ELECTRO_PNEUMATIC_PRESETS[name], fault: p.fault })}
                    >
                      {L.presetNames[name]}
                    </Button>
                  ))}
                </div>
              </fieldset>
              <SelectField<Valve1Kind>
                label={L.valve1}
                value={p.valve1}
                disabled={locked}
                options={(['single', 'double'] as const).map((v) => ({
                  value: v,
                  label: L.valve1s[v],
                }))}
                onChange={(v) => set('valve1', v)}
              />
              <SelectField<Valve2Kind>
                label={L.valve2}
                value={p.valve2}
                disabled={locked}
                options={(['nc', 'no'] as const).map((v) => ({ value: v, label: L.valve2s[v] }))}
                onChange={(v) => set('valve2', v)}
              />
              <NumberControl
                label={L.timerDelay}
                value={p.timerDelay}
                min={0.1}
                max={30}
                step={0.1}
                unit="s"
                disabled={locked}
                onChange={(v) => set('timerDelay', v)}
              />
              <NumberControl
                label={L.supply}
                value={Number(paToBar(p.supply).toFixed(3))}
                min={1}
                max={6}
                step={0.1}
                unit="bar"
                onChange={(v) => set('supply', barToPa(v))}
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
              <details className="rounded-md border border-navy-100 p-3">
                <summary className="min-h-touch cursor-pointer py-2 text-sm font-semibold text-navy-800">
                  {L.editorTitle}
                </summary>
                <div className="mt-2">
                  <LadderEditor
                    ladder={p.ladder}
                    disabled={locked}
                    onChange={(ladder) => set('ladder', ladder)}
                  />
                </div>
              </details>
              <details className="rounded-md border border-navy-100 p-3">
                <summary className="min-h-touch cursor-pointer py-2 text-sm font-semibold text-navy-800">
                  {L.designTitle}
                </summary>
                <div className="mt-2">
                  <DesignTasks ladder={p.ladder} />
                </div>
              </details>
              <details className="rounded-md border border-navy-100 p-3" open={hidden}>
                <summary className="min-h-touch cursor-pointer py-2 text-sm font-semibold text-navy-800">
                  {L.faultTitle}
                </summary>
                <div className="mt-2 space-y-3">
                  {hidden ? (
                    <p className="text-sm text-navy-800" data-testid="hidden-fault-note">
                      {L.hiddenActive}
                    </p>
                  ) : (
                    <SelectField<LadderFault>
                      label={L.faultVisible}
                      value={p.fault}
                      options={LADDER_FAULTS.map((f) => ({ value: f, label: L.faults[f] }))}
                      onChange={(v) => set('fault', v)}
                    />
                  )}
                  <div className="flex flex-wrap gap-2">
                    <Button variant="secondary" onClick={insertHiddenFault}>
                      {L.hiddenFault}
                    </Button>
                    <Button variant="ghost" onClick={clearFault} disabled={p.fault === 'none'}>
                      {L.clearFault}
                    </Button>
                  </div>
                  {hidden ? (
                    <div className="space-y-2">
                      <SelectField<LadderFault>
                        label={L.diagnosis}
                        value={diagnosis}
                        options={LADDER_FAULTS.filter((f) => f !== 'none').map((f) => ({
                          value: f,
                          label: L.faults[f],
                        }))}
                        onChange={setDiagnosis}
                      />
                      <Button onClick={() => setVerdict(diagnosis === p.fault)}>
                        {L.checkDiagnosis}
                      </Button>
                      {verdict !== null ? (
                        <p role="status" className="text-sm font-medium text-navy-900">
                          {verdict ? L.diagnosisRight : L.diagnosisWrong}
                        </p>
                      ) : null}
                    </div>
                  ) : null}
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
                  label={L.measurements.x1}
                  symbol="x1"
                  value={out.x1Mm}
                  unit="mm"
                />
                <MeasurementDisplay
                  label={L.measurements.x2}
                  symbol="x2"
                  value={out.x2Mm}
                  unit="mm"
                />
                <MeasurementDisplay
                  label={L.measurements.supplyCurrent}
                  symbol="I"
                  value={out.supplyCurrent}
                  unit="A"
                />
                <MeasurementDisplay
                  label={L.measurements.s1Current}
                  symbol="I S1"
                  value={out.s1Current}
                  unit="A"
                />
                <MeasurementDisplay
                  label={L.measurements.timer}
                  symbol="tT1"
                  value={out.timerElapsed ?? 0}
                  unit="s"
                />
              </div>
              {out.s1Current > 2 ? (
                <p
                  role="alert"
                  className="rounded bg-status-warningBg px-3 py-2 text-sm text-status-warning"
                >
                  {L.overload}
                </p>
              ) : null}
              <RecordPanel
                rows={lab.rows}
                columns={M09_RESULT_COLUMNS}
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
            <ChartFigure
              title={L.positionTitle}
              description={L.positionDesc}
              columns={[
                { key: 't', label: 't (s)' },
                { key: 'x1Mm', label: '1A1 (mm)' },
                { key: 'x2Mm', label: '2A1 (mm)' },
              ]}
              rows={rows}
              testId="positions-chart"
            >
              <TimeTraceChart
                rows={rows}
                series={POSITIONS}
                timeUnit="s"
                yLabel="x (mm)"
                xMin={xMin}
                xMax={xMax}
                height={240}
              />
            </ChartFigure>
          ),

          instructions: (
            <ActivitiesList
              activities={M09_ACTIVITIES}
              done={lab.done}
              onToggle={lab.toggleActivity}
            />
          ),

          assessment: <AssessmentPanel moduleId={M09_ID} questions={M09_QUESTIONS} />,
        }}
      />
    </>
  );
}
