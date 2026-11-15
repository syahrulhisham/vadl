import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { colors } from '@/design-system';
import { formatTick } from './formatTick';
import type { ChartRow, SeriesSpec } from './chartData';

export interface TimeTraceChartProps {
  readonly rows: readonly ChartRow[];
  readonly series: readonly SeriesSpec[];
  readonly timeUnit: string;
  readonly yLabel: string;
  /** Fixed x-axis end so the axis does not rescale while a run progresses. */
  readonly xMax?: number;
  /** Fixed x-axis start, e.g. for a rolling window. Default 0. */
  readonly xMin?: number;
  readonly height?: number;
  /**
   * Curves with their own x values, e.g. an analytic solution drawn dashed
   * beside the simulated trace. Each row has `t` and the line's `key`.
   */
  readonly referenceLines?: readonly {
    readonly key: string;
    readonly name: string;
    readonly color: string;
    readonly data: readonly ChartRow[];
  }[];
}

/**
 * Live time trace (FR-07). Animations are off: each frame shows the recorded
 * data as it is, without interpolated motion between frames.
 */
export function TimeTraceChart({
  rows,
  series,
  timeUnit,
  yLabel,
  xMax,
  xMin = 0,
  height = 280,
  referenceLines = [],
}: TimeTraceChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height} initialDimension={{ width: 600, height }}>
      <LineChart data={rows as ChartRow[]} margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
        <CartesianGrid stroke={colors.navy[100]} />
        <XAxis
          dataKey="t"
          type="number"
          domain={[xMin, xMax ?? 'auto']}
          allowDataOverflow
          stroke={colors.navy[600]}
          tickFormatter={formatTick}
          label={{
            value: `Time (${timeUnit})`,
            position: 'insideBottom',
            offset: -12,
            fill: colors.navy[700],
          }}
        />
        <YAxis
          stroke={colors.navy[600]}
          tickFormatter={formatTick}
          label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: colors.navy[700] }}
        />
        <Tooltip />
        <Legend verticalAlign="top" />
        {series.map((s) => (
          <Line
            key={s.key}
            dataKey={s.key}
            name={`${s.label} (${s.unit})`}
            stroke={s.color}
            strokeWidth={2}
            {...(s.dashed ? { strokeDasharray: '6 4' } : {})}
            dot={false}
            isAnimationActive={false}
            connectNulls
          />
        ))}
        {referenceLines.map((r) => (
          <Line
            key={r.key}
            data={r.data as ChartRow[]}
            dataKey={r.key}
            name={r.name}
            stroke={r.color}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
