import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Button, colors, MeasurementDisplay, NumberControl, PageHeader } from '@/design-system';
import {
  CharacteristicChart,
  ChartFigure,
  sampleCurve,
  timeUnitFor,
  TimeTraceChart,
  toTimeRows,
  type SeriesSpec,
} from '@/features/graphs';
import { LabShell } from '@/features/lab-shell';
import { ResultsTable, type ResultsColumn } from '@/features/recording';
import type { RecordedRow } from '@/features/reports';
import { useSimulation } from '@/hooks';
import { t } from '@/i18n';
import {
  formatSignificant,
  RL_LIMITS,
  rlCircuitModel,
  rlStepResponse,
  rlTimeConstant,
  type IntegratorName,
  type Issue,
  type RlParams,
} from '@/sim-core';
import { useDocumentTitle } from '../../useDocumentTitle';
import { RlCircuitDiagram } from './RlCircuitDiagram';

/** The run lasts five time constants: the current is then within 0.7 % of its final value. */
const RUN_TIME_CONSTANTS = 5;
const SPEED_CHOICES = [10, 5, 2] as const;
const DEFAULT_SPEED = 5;

function runSettings(p: RlParams, playbackSeconds: number) {
  const tau = rlTimeConstant(p.inductance, p.resistance);
  const endTime = RUN_TIME_CONSTANTS * tau;
  return { endTime, timeScale: endTime / playbackSeconds };
}

const SIMULATED: readonly SeriesSpec[] = [
  { key: 'current', label: 'Simulated', unit: 'A', color: colors.navy[700] },
];

export default function RlCircuitPage() {
  useDocumentTitle(t('rl.title'));
  const [playback, setPlayback] = useState<number>(DEFAULT_SPEED);
  const sim = useSimulation(rlCircuitModel, runSettings(rlCircuitModel.defaults, DEFAULT_SPEED));
  const [rows, setRows] = useState<RecordedRow[]>([]);
  const [issues, setIssues] = useState<Issue[]>([]);

  const p = sim.params;
  const out = sim.outputs;
  const tau = out.timeConstant;
  const endTime = sim.endTime ?? RUN_TIME_CONSTANTS * tau;
  const tu = timeUnitFor(endTime);
  const locked = sim.status !== 'idle';

  function changeParam(key: keyof RlParams, value: number) {
    const next: RlParams = { ...p, [key]: value };
    const found = sim.setParams(next);
    setIssues(found);
    if (!found.some((i) => i.severity === 'error')) {
      const s = runSettings(next, playback);
      sim.setEndTime(s.endTime);
      sim.setTimeScale(s.timeScale);
    }
  }

  function changePlayback(seconds: number) {
    setPlayback(seconds);
    sim.setTimeScale(runSettings(p, seconds).timeScale);
  }

  function record() {
    setRows((r) => [...r, { time: sim.time, parameters: { ...p }, measurements: { ...out } }]);
  }

  const traceRows = toTimeRows(sim.trace, SIMULATED, tu.scale);
  const analytic = useMemo(
    () =>
      sampleCurve(
        (time) => rlStepResponse(p.voltage, p.resistance, p.inductance, time),
        0,
        endTime,
        121,
      ).map(({ x, y }) => ({ t: x * tu.scale, analytic: y })),
    [p.voltage, p.resistance, p.inductance, endTime, tu.scale],
  );
  const universal = useMemo(
    () => sampleCurve((x) => 100 * (1 - Math.exp(-x)), 0, RUN_TIME_CONSTANTS, 101),
    [],
  );
  const point = { x: sim.time / tau, y: 100 * out.fractionOfFinal };

  const columns: readonly ResultsColumn[] = [
    { source: 'time', key: 't', label: t('rl.time'), unit: tu.unit, scale: tu.scale },
    { source: 'parameters', key: 'voltage', label: 'V', unit: 'V' },
    { source: 'parameters', key: 'resistance', label: 'R', unit: 'Ω' },
    { source: 'parameters', key: 'inductance', label: 'L', unit: 'H' },
    { source: 'measurements', key: 'current', label: 'i', unit: 'A' },
    { source: 'measurements', key: 'resistorVoltage', label: 'v_R', unit: 'V' },
    { source: 'measurements', key: 'inductorVoltage', label: 'v_L', unit: 'V' },
    { source: 'measurements', key: 'fractionOfFinal', label: 'i/I∞', unit: '%', scale: 100 },
  ];

  const statusKey = `rl.status.${sim.status}`;

  return (
    <>
      <nav aria-label="Breadcrumb" className="mb-2 text-sm">
        <Link
          to="/resources"
          className="inline-flex min-h-touch items-center text-navy-600 underline-offset-2 hover:underline"
        >
          {t('rl.back')}
        </Link>
      </nav>
      <PageHeader title={t('rl.title')} intro={t('rl.intro')} eyebrow={t('rl.eyebrow')} />
      <LabShell
        placeholderMilestone={4}
        regions={{
          theory: (
            <div className="space-y-3 text-sm">
              <div>
                <h3 className="font-semibold text-navy-800">{t('rl.learnTitle')}</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {['rl.learn1', 'rl.learn2', 'rl.learn3', 'rl.learn4'].map((k) => (
                    <li key={k}>{t(k)}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-navy-800">{t('rl.equationsTitle')}</h3>
                <ul className="mt-1 space-y-1 font-mono text-navy-900">
                  <li>{t('rl.eqKvl')}</li>
                  <li>{t('rl.eqSolution')}</li>
                </ul>
                <p className="mt-1">{t('rl.eqMotor')}</p>
              </div>
              <div>
                <h3 className="font-semibold text-navy-800">{t('rl.assumptionsTitle')}</h3>
                <ul className="mt-1 list-disc space-y-1 pl-5">
                  {rlCircuitModel.assumptions.map((a) => (
                    <li key={a}>{a}</li>
                  ))}
                </ul>
              </div>
            </div>
          ),
          workspace: (
            <div className="space-y-3">
              <RlCircuitDiagram
                voltage={p.voltage}
                resistance={p.resistance}
                inductance={p.inductance}
                current={out.current}
                switchClosed={sim.status !== 'idle'}
              />
              <div className="flex flex-wrap gap-2">
                {sim.status === 'running' ? (
                  <Button onClick={sim.pause}>{t('rl.pause')}</Button>
                ) : (
                  <Button
                    onClick={sim.start}
                    disabled={sim.status === 'stopped' || sim.status === 'finished'}
                  >
                    {sim.status === 'paused' ? t('rl.resume') : t('rl.start')}
                  </Button>
                )}
                <Button
                  variant="secondary"
                  onClick={sim.stop}
                  disabled={sim.status !== 'running' && sim.status !== 'paused'}
                >
                  {t('rl.stop')}
                </Button>
                <Button variant="secondary" onClick={sim.reset} disabled={sim.status === 'idle'}>
                  {t('rl.reset')}
                </Button>
              </div>
              <p role="status" className="text-sm text-navy-700" data-testid="run-status">
                {t(statusKey)}
              </p>
              {sim.lagging ? (
                <p className="rounded bg-status-warningBg px-2 py-1 text-sm text-status-warning">
                  {t('rl.lagging')}
                </p>
              ) : null}
            </div>
          ),
          controls: (
            <div className="space-y-4">
              <NumberControl
                label={t('rl.voltage')}
                value={p.voltage}
                min={RL_LIMITS.voltage.min}
                max={RL_LIMITS.voltage.max}
                step={1}
                unit="V"
                disabled={locked}
                onChange={(v) => changeParam('voltage', v)}
              />
              <NumberControl
                label={t('rl.resistance')}
                value={p.resistance}
                min={RL_LIMITS.resistance.min}
                max={RL_LIMITS.resistance.max}
                step={0.1}
                unit="Ω"
                disabled={locked}
                onChange={(v) => changeParam('resistance', v)}
              />
              <NumberControl
                label={t('rl.inductance')}
                value={p.inductance}
                min={RL_LIMITS.inductance.min}
                max={RL_LIMITS.inductance.max}
                step={0.001}
                unit="H"
                disabled={locked}
                onChange={(v) => changeParam('inductance', v)}
              />
              <label className="block text-sm font-medium text-navy-800">
                {t('rl.method')}
                <select
                  className="mt-1 block min-h-touch w-full rounded-md border border-navy-200 bg-white px-2 text-navy-900"
                  value={sim.method}
                  disabled={locked}
                  onChange={(e) => sim.setMethod(e.target.value as IntegratorName)}
                >
                  <option value="rk4">{t('rl.methodRk4')}</option>
                  <option value="euler">{t('rl.methodEuler')}</option>
                </select>
              </label>
              <label className="block text-sm font-medium text-navy-800">
                {t('rl.speed')}
                <select
                  className="mt-1 block min-h-touch w-full rounded-md border border-navy-200 bg-white px-2 text-navy-900"
                  value={playback}
                  onChange={(e) => changePlayback(Number(e.target.value))}
                >
                  {SPEED_CHOICES.map((s) => (
                    <option key={s} value={s}>
                      {t('rl.speedSeconds', { s })}
                    </option>
                  ))}
                </select>
              </label>
              {issues.map((i) => (
                <p key={i.message} role="alert" className="text-sm text-status-danger">
                  {i.message}
                </p>
              ))}
              <p className="text-sm text-navy-600">
                {locked ? t('rl.lockedHint') : null}{' '}
                {t('rl.stepInfo', {
                  dt: formatSignificant(sim.dt * tu.scale, 3),
                  unit: tu.unit,
                })}
              </p>
            </div>
          ),
          measurements: (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <MeasurementDisplay
                  label={t('rl.time')}
                  symbol="t"
                  value={sim.time * tu.scale}
                  unit={tu.unit}
                />
                <MeasurementDisplay
                  label={t('rl.current')}
                  symbol="i"
                  value={out.current}
                  unit="A"
                />
                <MeasurementDisplay
                  label={t('rl.vR')}
                  symbol="v_R"
                  value={out.resistorVoltage}
                  unit="V"
                />
                <MeasurementDisplay
                  label={t('rl.vL')}
                  symbol="v_L"
                  value={out.inductorVoltage}
                  unit="V"
                />
                <MeasurementDisplay
                  label={t('rl.tau')}
                  symbol="τ"
                  value={tau * tu.scale}
                  unit={tu.unit}
                />
                <MeasurementDisplay
                  label={t('rl.iFinal')}
                  symbol="I∞"
                  value={out.finalCurrent}
                  unit="A"
                />
                <MeasurementDisplay
                  label={t('rl.fraction')}
                  symbol="i/I∞"
                  value={100 * out.fractionOfFinal}
                  unit="%"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={record}>{t('rl.record')}</Button>
                <Button variant="ghost" onClick={() => setRows([])} disabled={rows.length === 0}>
                  {t('rl.clear')}
                </Button>
              </div>
              <ResultsTable rows={rows} columns={columns} caption={t('rl.tableCaption')} />
            </div>
          ),
          graphs: (
            <div className="space-y-6">
              <ChartFigure
                title={t('rl.traceTitle')}
                description={t('rl.traceDesc')}
                columns={[
                  { key: 't', label: `t (${tu.unit})` },
                  { key: 'current', label: 'i (A)' },
                ]}
                rows={traceRows}
                testId="trace-chart"
              >
                <TimeTraceChart
                  rows={traceRows}
                  series={SIMULATED}
                  timeUnit={tu.unit}
                  yLabel="i (A)"
                  xMax={endTime * tu.scale}
                  referenceLines={[
                    {
                      key: 'analytic',
                      name: t('rl.analytic'),
                      color: colors.lightblue[400],
                      data: analytic,
                    },
                  ]}
                />
              </ChartFigure>
              <ChartFigure
                title={t('rl.universalTitle')}
                description={t('rl.universalDesc')}
                columns={[
                  { key: 'x', label: 't/τ' },
                  { key: 'y', label: '% of final' },
                ]}
                rows={universal}
                testId="universal-chart"
              >
                <CharacteristicChart
                  curve={universal}
                  point={point}
                  xLabel={t('rl.xTau')}
                  yLabel={t('rl.yPercent')}
                />
              </ChartFigure>
            </div>
          ),
          instructions: (
            <div className="text-sm">
              <h3 className="font-semibold text-navy-800">{t('rl.instructionsTitle')}</h3>
              <ol className="mt-1 list-decimal space-y-1 pl-5">
                {['rl.step1', 'rl.step2', 'rl.step3', 'rl.step4', 'rl.step5'].map((k) => (
                  <li key={k}>{t(k)}</li>
                ))}
              </ol>
            </div>
          ),
        }}
      />
    </>
  );
}
