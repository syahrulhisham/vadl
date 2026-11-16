import { useMemo, useState } from 'react';
import { colors, MeasurementDisplay, NumberControl } from '@/design-system';
import { ChartFigure, TimeTraceChart, type SeriesSpec } from '@/features/graphs';
import { SelectField } from '@/features/lab-shell';
import {
  DC_LIMITS,
  degToRad,
  DRIVE_TOPOLOGIES,
  driveGateAngles,
  driveQuadrant,
  driveWaveforms,
  peakFromRms,
  radToDeg,
  type DcMotorOutputs,
  type DcMotorParams,
  type DrivePath,
  type DriveTopology,
} from '@/sim-core';
import { M01_SCOPE as S } from './content.en';

type EmfSource = 'lab' | 'manual';
const STRIP_LEFT = 150;
const STRIP_WIDTH = 640;
const ROW = 26;

/** Rows of the conduction strip: every path that occurs, in order of first appearance. */
function stripRows(path: readonly DrivePath[]): DrivePath[] {
  const rows: DrivePath[] = [];
  for (const p of path) if (p !== 'none' && !rows.includes(p)) rows.push(p);
  return rows;
}

/** Runs of consecutive samples on one path, as [start, end] sample indices. */
function runs(path: readonly DrivePath[], which: DrivePath): [number, number][] {
  const out: [number, number][] = [];
  let start = -1;
  path.forEach((p, k) => {
    if (p === which && start < 0) start = k;
    if (p !== which && start >= 0) {
      out.push([start, k]);
      start = -1;
    }
  });
  if (start >= 0) out.push([start, path.length - 1]);
  return out;
}

/**
 * Drive waveform view (Milestone 11): instantaneous armature voltage and
 * current of a single-phase converter over one supply cycle, with the devices
 * that conduct. Every value comes from `driveWaveforms` in the simulation core;
 * this component only chooses the inputs and draws the result.
 */
export function DriveScope({
  params: p,
  outputs: o,
}: {
  readonly params: DcMotorParams;
  readonly outputs: DcMotorOutputs;
}) {
  const [topology, setTopology] = useState<DriveTopology>('full');
  const [alphaDeg, setAlphaDeg] = useState(30);
  const [frequency, setFrequency] = useState(50);
  const [emfSource, setEmfSource] = useState<EmfSource>('lab');
  const [manualEmf, setManualEmf] = useState(150);
  const [active, setActive] = useState<'1' | '2'>('1');
  const [reactor, setReactor] = useState(0.05);
  const [cursorDeg, setCursorDeg] = useState(90);

  const e = emfSource === 'lab' ? o.backEmf : manualEmf;
  const dual = topology.startsWith('dual');
  const result = useMemo(
    () =>
      driveWaveforms({
        topology,
        vm: peakFromRms(p.supplyRms),
        frequency,
        alpha: degToRad(alphaDeg),
        r: p.ra + p.rst,
        l: p.la,
        e,
        activeConverter: active === '2' ? 2 : 1,
        reactor,
      }),
    [topology, p.supplyRms, frequency, alphaDeg, p.ra, p.rst, p.la, e, active, reactor],
  );

  // The current array is read by key: a property named current looks like a React ref to the compiler.
  const { theta, supply, voltage, circulating, path: paths } = result;
  const ia = result['current'];
  const n = theta.length - 1;
  const rows = useMemo(
    () =>
      theta.map((th, k) => ({
        t: radToDeg(th),
        supply: supply[k] ?? 0,
        voltage: voltage[k] ?? 0,
        current: ia[k] ?? 0,
        circulating: circulating[k] ?? 0,
      })),
    [theta, supply, voltage, ia, circulating],
  );
  const tableRows = rows.filter((_, k) => k % 20 === 0);
  const cursorIndex = Math.min(n, Math.max(0, Math.round((cursorDeg / 360) * n)));
  const cursorPath = paths[cursorIndex] ?? 'none';
  const quadrant = driveQuadrant(e, result.averageCurrent);

  const voltageSeries: readonly SeriesSpec[] = [
    { key: 'supply', label: S.series.supply, unit: 'V', color: colors.lightblue[400] },
    { key: 'voltage', label: S.series.voltage, unit: 'V', color: colors.navy[800] },
  ];
  const currentSeries: readonly SeriesSpec[] = [
    { key: 'current', label: S.series.current, unit: 'A', color: colors.navy[800] },
    ...(topology === 'dual-circulating'
      ? [
          {
            key: 'circulating',
            label: S.series.circulating,
            unit: 'A',
            color: colors.lightblue[400],
          },
        ]
      : []),
  ];

  const strip = stripRows(paths);
  const gates = driveGateAngles(topology, degToRad(alphaDeg));
  const x = (k: number) => STRIP_LEFT + (k / n) * (STRIP_WIDTH - STRIP_LEFT - 10);
  const xDeg = (deg: number) => x((((deg % 360) + 360) % 360) * (n / 360));
  const stripHeight = Math.max(1, strip.length) * ROW + 44;
  const stripText = `${S.conductionTitle}. ${strip
    .map(
      (path) =>
        `${S.paths[path]}: ${runs(paths, path)
          .map(([a, b]) => `${Math.round((a / n) * 360)}° to ${Math.round((b / n) * 360)}°`)
          .join(', ')}`,
    )
    .join('. ')}.`;

  return (
    <div className="space-y-4" data-testid="drive-scope">
      <p className="text-sm text-navy-700">{S.note}</p>
      <div className="grid gap-3 sm:grid-cols-2">
        <SelectField<DriveTopology>
          label={S.topology}
          value={topology}
          options={DRIVE_TOPOLOGIES.map((k) => ({ value: k, label: S.topologies[k] }))}
          onChange={setTopology}
        />
        <NumberControl
          label={S.alpha}
          value={alphaDeg}
          min={0}
          max={180}
          step={5}
          unit="°"
          onChange={setAlphaDeg}
        />
        <SelectField<EmfSource>
          label={S.emfSource}
          value={emfSource}
          options={(['lab', 'manual'] as const).map((k) => ({
            value: k,
            label: S.emfSources[k],
          }))}
          onChange={setEmfSource}
        />
        {emfSource === 'manual' ? (
          <NumberControl
            label={S.manualEmf}
            value={manualEmf}
            min={DC_LIMITS.armatureVoltage.min}
            max={DC_LIMITS.armatureVoltage.max}
            step={10}
            unit="V"
            onChange={setManualEmf}
          />
        ) : null}
        <NumberControl
          label={S.frequency}
          value={frequency}
          min={40}
          max={70}
          step={10}
          unit="Hz"
          onChange={setFrequency}
        />
        {topology === 'dual-noncirculating' ? (
          <SelectField<'1' | '2'>
            label={S.activeConverter}
            value={active}
            options={(['1', '2'] as const).map((k) => ({
              value: k,
              label: S.activeConverters[k],
            }))}
            onChange={setActive}
          />
        ) : null}
        {topology === 'dual-circulating' ? (
          <NumberControl
            label={S.reactor}
            value={reactor}
            min={0.005}
            max={0.5}
            step={0.005}
            unit="H"
            onChange={setReactor}
          />
        ) : null}
        <NumberControl
          label={S.cursor}
          value={cursorDeg}
          min={0}
          max={360}
          step={5}
          unit="°"
          onChange={setCursorDeg}
        />
      </div>

      <div className="space-y-1 text-sm text-navy-800" role="status" data-testid="scope-status">
        <p data-testid="scope-mode">
          {!result.converged ? S.notConverged : result.continuous ? S.continuous : S.discontinuous}
        </p>
        <p data-testid="scope-quadrant">{S.quadrants[String(quadrant) as '0']}</p>
        {result.power < 0 ? <p data-testid="scope-regen">{S.regenerating}</p> : null}
        <p data-testid="scope-cursor-path">
          {S.atCursor}: {S.paths[cursorPath]}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        <MeasurementDisplay label={S.meters.backEmf} symbol="Eg" value={e} unit="V" />
        <MeasurementDisplay
          label={S.meters.averageVoltage}
          symbol="Va"
          value={result.averageVoltage}
          unit="V"
        />
        <MeasurementDisplay
          label={S.meters.averageCurrent}
          symbol="Ia"
          value={result.averageCurrent}
          unit="A"
        />
        <MeasurementDisplay label={S.meters.rmsCurrent} value={result.rmsCurrent} unit="A" />
        <MeasurementDisplay label={S.meters.minCurrent} value={result.minCurrent} unit="A" />
        <MeasurementDisplay label={S.meters.maxCurrent} value={result.maxCurrent} unit="A" />
        <MeasurementDisplay
          label={S.meters.conductionAngle}
          value={radToDeg(result.conductionAngle)}
          unit="°"
        />
        <MeasurementDisplay
          label={S.meters.extinctionAngle}
          symbol="β"
          value={radToDeg(result.extinctionAngle)}
          unit="°"
        />
        <MeasurementDisplay label={S.meters.power} value={result.power} unit="W" />
        {dual ? (
          <MeasurementDisplay
            label={S.meters.peakCirculating}
            value={result.peakCirculating}
            unit="A"
          />
        ) : null}
        <MeasurementDisplay
          label={S.meters.cursorVoltage}
          value={voltage[cursorIndex] ?? Number.NaN}
          unit="V"
        />
        <MeasurementDisplay
          label={S.meters.cursorCurrent}
          value={ia[cursorIndex] ?? Number.NaN}
          unit="A"
        />
      </div>

      <ChartFigure
        title={S.voltageTitle}
        description={S.voltageDesc}
        columns={[
          { key: 't', label: 'θ (°)' },
          { key: 'supply', label: 'vs (V)' },
          { key: 'voltage', label: 'va (V)' },
        ]}
        rows={tableRows}
        testId="scope-voltage-chart"
      >
        <TimeTraceChart
          rows={rows}
          series={voltageSeries}
          timeUnit="°"
          xLabel={S.angleAxis}
          yLabel="v (V)"
          xMin={0}
          xMax={360}
          height={240}
        />
      </ChartFigure>
      <ChartFigure
        title={S.currentTitle}
        description={S.currentDesc}
        columns={[
          { key: 't', label: 'θ (°)' },
          { key: 'current', label: 'ia (A)' },
          ...(topology === 'dual-circulating' ? [{ key: 'circulating', label: 'ir (A)' }] : []),
        ]}
        rows={tableRows}
        testId="scope-current-chart"
      >
        <TimeTraceChart
          rows={rows}
          series={currentSeries}
          timeUnit="°"
          xLabel={S.angleAxis}
          yLabel="i (A)"
          xMin={0}
          xMax={360}
          height={220}
        />
      </ChartFigure>

      <figure>
        <figcaption className="text-sm font-medium text-navy-800">{S.conductionTitle}</figcaption>
        <svg
          viewBox={`0 0 ${STRIP_WIDTH} ${stripHeight}`}
          className="h-auto w-full"
          role="img"
          aria-label={stripText}
          data-testid="conduction-strip"
        >
          {strip.map((path, r) => (
            <g key={path} data-path={path}>
              <text
                x={STRIP_LEFT - 8}
                y={r * ROW + 30}
                textAnchor="end"
                fontSize="12"
                fontFamily="system-ui, sans-serif"
                fill={colors.navy[900]}
              >
                {S.paths[path]}
              </text>
              <line
                x1={STRIP_LEFT}
                x2={STRIP_WIDTH - 10}
                y1={r * ROW + 26}
                y2={r * ROW + 26}
                stroke={colors.navy[100]}
              />
              {runs(paths, path).map(([a, b]) => (
                <rect
                  key={a}
                  x={x(a)}
                  y={r * ROW + 16}
                  width={Math.max(1, x(b) - x(a))}
                  height={14}
                  fill={path === 'freewheel' ? colors.lightblue[300] : colors.navy[600]}
                  stroke={colors.navy[900]}
                  strokeWidth={0.8}
                />
              ))}
            </g>
          ))}
          {gates.map((g) => (
            <g key={g.device} data-gate={g.device}>
              <path d={`M${xDeg(radToDeg(g.angle))} 12 l-5 -9 h10 z`} fill={colors.navy[900]} />
              <line
                x1={xDeg(radToDeg(g.angle))}
                x2={xDeg(radToDeg(g.angle))}
                y1={12}
                y2={stripHeight - 22}
                stroke={colors.navy[400]}
                strokeDasharray="3 3"
              />
            </g>
          ))}
          <line
            x1={x(cursorIndex)}
            x2={x(cursorIndex)}
            y1={4}
            y2={stripHeight - 22}
            stroke={colors.status.danger}
            strokeWidth={1.5}
          />
          {[0, 90, 180, 270, 360].map((d) => (
            <text
              key={d}
              x={xDeg(d === 360 ? 359.999 : d)}
              y={stripHeight - 6}
              textAnchor="middle"
              fontSize="11"
              fontFamily="system-ui, sans-serif"
              fill={colors.navy[700]}
            >
              {d}°
            </text>
          ))}
        </svg>
        <p className="text-xs text-navy-600">{S.conductionDesc}</p>
      </figure>
    </div>
  );
}
