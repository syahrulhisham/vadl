import { colors } from '@/design-system';
import { formatSignificant, type Sample } from '@/sim-core';

export interface TimingSignal {
  readonly key: string;
  readonly label: string;
}

const ROW = 44;
const LEFT = 44;
const WIDTH = 560;

/**
 * Digital timing diagram (as drawn in the course notes): one stepped trace per
 * phase or coil over the time window. Values are the model's phase currents
 * (1 = rated current, −1 = reversed); the drawing only places them.
 */
export function TimingDiagram({
  samples,
  signals,
  tMin,
  tMax,
  timeScale,
  timeUnit,
}: {
  readonly samples: readonly Sample[];
  readonly signals: readonly TimingSignal[];
  readonly tMin: number;
  readonly tMax: number;
  readonly timeScale: number;
  readonly timeUnit: string;
}) {
  const span = Math.max(tMax - tMin, 1e-12);
  const x = (t: number) => LEFT + ((t - tMin) / span) * (WIDTH - LEFT - 8);
  const bipolar = signals.some((s) => samples.some((p) => (p.values[s.key] ?? 0) < 0));
  const height = signals.length * ROW + 26;
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${height}`}
      className="h-auto w-full"
      role="img"
      aria-label={`Timing diagram of ${signals.map((s) => s.label).join(', ')} from ${formatSignificant(tMin * timeScale, 4)} to ${formatSignificant(tMax * timeScale, 4)} ${timeUnit}.`}
      data-testid="timing-diagram"
    >
      {signals.map((s, r) => {
        const top = r * ROW + 6;
        const amp = bipolar ? (ROW - 14) / 2 : ROW - 14;
        const zero = bipolar ? top + amp : top + amp;
        const y = (v: number) => zero - v * amp;
        let d = '';
        samples.forEach((p, i) => {
          const v = p.values[s.key] ?? 0;
          const px = x(p.t);
          if (i === 0) d += `M${px.toFixed(1)},${y(v).toFixed(1)}`;
          else {
            const prev = samples[i - 1];
            const pv = prev?.values[s.key] ?? 0;
            // Step: hold the previous level until this sample, then jump.
            d += ` L${px.toFixed(1)},${y(pv).toFixed(1)} L${px.toFixed(1)},${y(v).toFixed(1)}`;
          }
        });
        return (
          <g key={s.key} data-testid={`timing-${s.key}`}>
            <line x1={LEFT} x2={WIDTH - 8} y1={zero} y2={zero} stroke={colors.navy[100]} />
            <text
              x={8}
              y={zero - (bipolar ? 0 : amp / 2) + 4}
              fontSize="13"
              fontWeight="600"
              fill={colors.navy[900]}
              fontFamily="system-ui, sans-serif"
            >
              {s.label}
            </text>
            <path d={d} fill="none" stroke={colors.navy[700]} strokeWidth={2} />
          </g>
        );
      })}
      <g fontSize="11" fill={colors.navy[600]} fontFamily="system-ui, sans-serif">
        <text x={LEFT} y={height - 6}>
          {formatSignificant(tMin * timeScale, 4)} {timeUnit}
        </text>
        <text x={WIDTH - 8} y={height - 6} textAnchor="end">
          {formatSignificant(tMax * timeScale, 4)} {timeUnit}
        </text>
      </g>
    </svg>
  );
}
