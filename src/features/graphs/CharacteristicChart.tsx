import {
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { colors } from '@/design-system';
import { formatTick } from './formatTick';

type Point = { readonly x: number; readonly y: number };

export interface CharacteristicChartProps {
  /** The characteristic curve, already in display units. */
  readonly curve: readonly Point[];
  /** Current operating point, or null when there is none. */
  readonly point: Point | null;
  readonly xLabel: string;
  readonly yLabel: string;
  readonly height?: number;
  /** Legend name of the main curve; the legend is shown only when extra curves exist. */
  readonly curveName?: string;
  /** Further curves on the same axes, e.g. a load line, drawn dashed. */
  readonly extraCurves?: readonly {
    readonly name: string;
    readonly color: string;
    readonly data: readonly Point[];
  }[];
  /** Fixed y-axis range; defaults to the data range. */
  readonly yDomain?: readonly [number, number];
}

/** A characteristic curve with the current operating point marked (FR-07). */
export function CharacteristicChart({
  curve,
  point,
  xLabel,
  yLabel,
  height = 280,
  curveName,
  extraCurves = [],
  yDomain,
}: CharacteristicChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height} initialDimension={{ width: 600, height }}>
      <ComposedChart margin={{ top: 8, right: 16, bottom: 24, left: 8 }}>
        <CartesianGrid stroke={colors.navy[100]} />
        <XAxis
          dataKey="x"
          type="number"
          domain={['dataMin', 'dataMax']}
          stroke={colors.navy[600]}
          tickFormatter={formatTick}
          label={{ value: xLabel, position: 'insideBottom', offset: -12, fill: colors.navy[700] }}
        />
        <YAxis
          type="number"
          domain={yDomain ? [yDomain[0], yDomain[1]] : ['auto', 'auto']}
          allowDataOverflow={yDomain !== undefined}
          stroke={colors.navy[600]}
          tickFormatter={formatTick}
          label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: colors.navy[700] }}
        />
        <Tooltip />
        {extraCurves.length > 0 ? <Legend verticalAlign="top" /> : null}
        <Line
          data={curve as Point[]}
          dataKey="y"
          name={curveName ?? yLabel}
          stroke={colors.navy[500]}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
        {extraCurves.map((c) => (
          <Line
            key={c.name}
            data={c.data as Point[]}
            dataKey="y"
            name={c.name}
            stroke={c.color}
            strokeWidth={2}
            strokeDasharray="6 4"
            dot={false}
            isAnimationActive={false}
          />
        ))}
        {point ? (
          <ReferenceDot
            x={point.x}
            y={point.y}
            r={6}
            fill={colors.lightblue[400]}
            stroke={colors.navy[900]}
            strokeWidth={2}
            ifOverflow="extendDomain"
          />
        ) : null}
      </ComposedChart>
    </ResponsiveContainer>
  );
}
