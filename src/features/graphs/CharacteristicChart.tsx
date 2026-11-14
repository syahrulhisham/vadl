import {
  CartesianGrid,
  ComposedChart,
  Line,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { colors } from '@/design-system';

export interface CharacteristicChartProps {
  /** The characteristic curve, already in display units. */
  readonly curve: readonly { readonly x: number; readonly y: number }[];
  /** Current operating point, or null when there is none. */
  readonly point: { readonly x: number; readonly y: number } | null;
  readonly xLabel: string;
  readonly yLabel: string;
  readonly height?: number;
}

/** A characteristic curve with the current operating point marked (FR-07). */
export function CharacteristicChart({
  curve,
  point,
  xLabel,
  yLabel,
  height = 280,
}: CharacteristicChartProps) {
  return (
    <ResponsiveContainer width="100%" height={height} initialDimension={{ width: 600, height }}>
      <ComposedChart
        data={curve as { x: number; y: number }[]}
        margin={{ top: 8, right: 16, bottom: 24, left: 8 }}
      >
        <CartesianGrid stroke={colors.navy[100]} />
        <XAxis
          dataKey="x"
          type="number"
          domain={['dataMin', 'dataMax']}
          stroke={colors.navy[600]}
          label={{ value: xLabel, position: 'insideBottom', offset: -12, fill: colors.navy[700] }}
        />
        <YAxis
          stroke={colors.navy[600]}
          label={{ value: yLabel, angle: -90, position: 'insideLeft', fill: colors.navy[700] }}
        />
        <Tooltip />
        <Line
          dataKey="y"
          name={yLabel}
          stroke={colors.navy[500]}
          strokeWidth={2}
          dot={false}
          isAnimationActive={false}
        />
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
