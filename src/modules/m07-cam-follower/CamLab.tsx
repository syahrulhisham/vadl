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
  CAM_PRESETS,
  camDisplacementTable,
  camFollowerModel,
  camMotion,
  camProfileOf,
  degToRad,
  formatSignificant,
  mmToM,
  mToMm,
  radPerSecToRpm,
  radToDeg,
  rpmToRadPerSec,
  type CamParams,
  type CamPresetName,
  type FollowerKind,
  type Issue,
  type MotionLaw,
} from '@/sim-core';
import { CamDiagram } from './CamDiagram';
import { M07_ACTIVITIES, M07_LABELS as L, M07_OUTCOMES, M07_THEORY } from './content.en';
import { M07_QUESTIONS } from './questions';
import { M07_RESULT_COLUMNS, numericParameters } from './results';

export const M07_ID = 'm07-cam-follower';
const PRESETS: readonly CamPresetName[] = ['course', 'dwells', 'flatShm'];
const LAWS: readonly MotionLaw[] = ['uniform', 'shm', 'uniform-acceleration', 'cycloidal'];
const STEPS = ['30', '45', '22.5'] as const;
const fmt = (v: number) => formatSignificant(v, 4);

/** M07 Cam and Follower laboratory: all seven regions (FR-02). */
export default function CamLab() {
  const sim = useSimulation(camFollowerModel, { timeScale: 1, recorderCapacity: 2000 });
  const lab = useLabRecords(M07_ID);
  const [playback, setPlayback] = useState(1);
  const [step, setStep] = useState<(typeof STEPS)[number]>('30');
  const [issues, setIssues] = useState<Issue[]>([]);
  const p = sim.params;
  const out = sim.outputs;
  const locked = sim.status !== 'idle';

  function apply(next: CamParams, key?: keyof CamParams) {
    setIssues(
      sim
        .setParams(next)
        .filter((i) => i.severity === 'error' || key === undefined || i.parameter === key),
    );
  }
  function set<K extends keyof CamParams>(key: K, value: CamParams[K]) {
    apply({ ...p, [key]: value }, key);
  }
  function changePlayback(v: number) {
    setPlayback(v);
    sim.setTimeScale(v);
  }

  const profile = useMemo(() => camProfileOf(p, 360), [p]);
  const table = useMemo(() => camDisplacementTable(p, Number(step)), [p, step]);
  const curves = useMemo(() => {
    const pts = Array.from({ length: 181 }, (_, i) => {
      const deg = 2 * i;
      const m = camMotion(p, degToRad(deg));
      return {
        deg,
        s: mToMm(m.s),
        v: mToMm(m.ds * p.camSpeed),
        a: m.d2s * p.camSpeed * p.camSpeed,
      };
    });
    return {
      s: pts.map((q) => ({ x: q.deg, y: q.s })),
      v: pts.map((q) => ({ x: q.deg, y: q.v })),
      a: pts.map((q) => ({ x: q.deg, y: q.a })),
    };
  }, [p]);
  const lowerDwell = 360 - radToDeg(p.riseAngle + p.dwellAngle + p.returnAngle);

  const angleControl = (
    key: 'riseAngle' | 'dwellAngle' | 'returnAngle',
    label: string,
    min: number,
  ) => (
    <NumberControl
      label={label}
      value={Number(radToDeg(p[key]).toFixed(3))}
      min={min}
      max={350}
      step={5}
      unit="°"
      disabled={locked}
      onChange={(v) => set(key, degToRad(v))}
    />
  );

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <LinkButton to={`/reports/${M07_ID}`} variant="secondary">
          {L.openReport}
        </LinkButton>
        <span className="text-sm text-navy-600">{L.dataNote}</span>
      </div>
      <LabShell
        placeholderMilestone={7}
        regions={{
          theory: (
            <div className="space-y-4 text-sm">
              <p>{M07_THEORY.intro}</p>
              <OutcomesList outcomes={M07_OUTCOMES} />
              <TheoryBlock title={M07_THEORY.displacementTitle} items={M07_THEORY.displacement} />
              <TheoryBlock title={M07_THEORY.typesTitle} items={M07_THEORY.types} collapsible />
              <TheoryBlock
                title={M07_THEORY.extensionTitle}
                items={M07_THEORY.extension}
                collapsible
              />
              <TheoryBlock
                title={t('lab.assumptionsTitle')}
                items={camFollowerModel.assumptions}
                collapsible
              />
            </div>
          ),

          workspace: (
            <div className="space-y-3">
              <figure>
                <figcaption className="text-sm font-medium text-navy-800">{L.diagram}</figcaption>
                <CamDiagram params={p} outputs={out} profile={profile} />
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
                  {PRESETS.map((name) => (
                    <Button key={name} variant="secondary" onClick={() => apply(CAM_PRESETS[name])}>
                      {L.presetNames[name]}
                    </Button>
                  ))}
                </div>
              </fieldset>
              <SelectField<MotionLaw>
                label={L.law}
                value={p.law}
                disabled={locked}
                options={LAWS.map((l) => ({ value: l, label: L.laws[l] }))}
                onChange={(v) => set('law', v)}
              />
              <SelectField<FollowerKind>
                label={L.follower}
                value={p.follower}
                disabled={locked}
                options={(['knife', 'roller', 'flat'] as const).map((f) => ({
                  value: f,
                  label: L.followers[f],
                }))}
                onChange={(v) => set('follower', v)}
              />
              <NumberControl
                label={L.lift}
                value={Number(mToMm(p.lift).toFixed(3))}
                min={1}
                max={100}
                step={1}
                unit="mm"
                disabled={locked}
                onChange={(v) => set('lift', mmToM(v))}
              />
              {angleControl('riseAngle', L.riseAngle, 10)}
              {angleControl('dwellAngle', L.dwellAngle, 0)}
              {angleControl('returnAngle', L.returnAngle, 10)}
              <p className="text-sm text-navy-700">
                {L.lowerDwell}:{' '}
                <span className="font-semibold tabular-nums">{fmt(Math.max(0, lowerDwell))}°</span>
              </p>
              <NumberControl
                label={L.baseRadius}
                value={Number(mToMm(p.baseRadius).toFixed(3))}
                min={10}
                max={200}
                step={1}
                unit="mm"
                disabled={locked}
                onChange={(v) => set('baseRadius', mmToM(v))}
              />
              {p.follower === 'roller' ? (
                <NumberControl
                  label={L.rollerRadius}
                  value={Number(mToMm(p.rollerRadius).toFixed(3))}
                  min={2}
                  max={50}
                  step={1}
                  unit="mm"
                  disabled={locked}
                  onChange={(v) => set('rollerRadius', mmToM(v))}
                />
              ) : null}
              <NumberControl
                label={L.camSpeed}
                value={Number(radPerSecToRpm(p.camSpeed).toFixed(3))}
                min={0}
                max={950}
                step={1}
                unit="rpm"
                onChange={(v) => set('camSpeed', rpmToRadPerSec(v))}
              />
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
                  label={L.measurements.camAngle}
                  symbol="θ"
                  value={out.camAngleDeg}
                  unit="°"
                />
                <MeasurementDisplay
                  label={L.measurements.displacement}
                  symbol="s"
                  value={out.displacementMm}
                  unit="mm"
                />
                <MeasurementDisplay
                  label={L.measurements.velocity}
                  symbol="v"
                  value={mToMm(out.velocity)}
                  unit="mm/s"
                />
                <MeasurementDisplay
                  label={L.measurements.acceleration}
                  symbol="a"
                  value={out.acceleration}
                  unit="m/s²"
                />
                {p.follower !== 'flat' ? (
                  <MeasurementDisplay
                    label={L.measurements.pressureAngle}
                    symbol="φ"
                    value={out.pressureAngleDeg}
                    unit="°"
                  />
                ) : null}
                <MeasurementDisplay
                  label={L.measurements.camSpeed}
                  symbol="N"
                  value={out.camSpeedRpm}
                  unit="rpm"
                />
              </div>
              <p className="text-sm text-navy-800" data-testid="cam-segment">
                {L.measurements.segment}:{' '}
                <span className="font-semibold">{L.segments[out.segment] ?? ''}</span>
              </p>
              <div className="space-y-2">
                <SelectField<(typeof STEPS)[number]>
                  label={L.tableStep}
                  value={step}
                  options={STEPS.map((s) => ({ value: s, label: `${s}°` }))}
                  onChange={setStep}
                />
                <div className="max-h-72 overflow-auto">
                  <table className="text-sm" data-testid="displacement-table">
                    <caption className="mb-1 text-left">
                      <span className="font-semibold text-navy-800">{L.tableTitle}. </span>
                      <span className="text-navy-600">{L.tableCaption}</span>
                    </caption>
                    <thead>
                      <tr className="text-left text-navy-800">
                        <th scope="col" className="pr-6">
                          {L.angle}
                        </th>
                        <th scope="col">{L.displacementMm}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {table.map((r) => (
                        <tr key={r.angleDeg}>
                          <th scope="row" className="pr-6 text-left font-medium">
                            {r.angleDeg}
                          </th>
                          <td className="tabular-nums">{fmt(mToMm(r.displacement))}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
              <RecordPanel
                rows={lab.rows}
                columns={M07_RESULT_COLUMNS}
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
                title={L.diagramTitle}
                description={L.diagramDesc}
                columns={[
                  { key: 'x', label: 'θ (°)' },
                  { key: 'y', label: 's (mm)' },
                ]}
                rows={curves.s}
                testId="displacement-chart"
              >
                <CharacteristicChart
                  curve={curves.s}
                  point={{ x: out.camAngleDeg, y: out.displacementMm }}
                  xLabel="Cam angle (°)"
                  yLabel="Displacement (mm)"
                />
              </ChartFigure>
              <ChartFigure
                title={L.velocityTitle}
                description={L.velocityDesc}
                columns={[
                  { key: 'x', label: 'θ (°)' },
                  { key: 'y', label: 'v (mm/s)' },
                ]}
                rows={curves.v}
                testId="velocity-chart"
              >
                <CharacteristicChart
                  curve={curves.v}
                  point={{ x: out.camAngleDeg, y: mToMm(out.velocity) }}
                  xLabel="Cam angle (°)"
                  yLabel="Velocity (mm/s)"
                  height={220}
                />
              </ChartFigure>
              <ChartFigure
                title={L.accelerationTitle}
                description={L.accelerationDesc}
                columns={[
                  { key: 'x', label: 'θ (°)' },
                  { key: 'y', label: 'a (m/s²)' },
                ]}
                rows={curves.a}
                testId="acceleration-chart"
              >
                <CharacteristicChart
                  curve={curves.a}
                  point={{ x: out.camAngleDeg, y: out.acceleration }}
                  xLabel="Cam angle (°)"
                  yLabel="Acceleration (m/s²)"
                  height={220}
                />
              </ChartFigure>
            </div>
          ),

          instructions: (
            <ActivitiesList
              activities={M07_ACTIVITIES}
              done={lab.done}
              onToggle={lab.toggleActivity}
            />
          ),

          assessment: <AssessmentPanel moduleId={M07_ID} questions={M07_QUESTIONS} />,
        }}
      />
    </>
  );
}
