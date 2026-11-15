import { colors } from '@/design-system';
import { formatSignificant, type InductionMotorOutputs } from '@/sim-core';
import { M02_LABELS as L } from './content.en';

const fmt = (v: number) => formatSignificant(v, 4);

/**
 * The motor seen from the rotating field. The field arrow is fixed; the rotor
 * marker sits at the model's slip angle θslip (rotor angle relative to the
 * field), so it drifts backwards at Ns − N. Every number comes from the model.
 */
export function AcFieldView({
  outputs: o,
  poles,
}: {
  readonly outputs: InductionMotorOutputs;
  readonly poles: number;
}) {
  const cx = 160;
  const cy = 150;
  const angle = -o.slipAngle; // rotor falls behind the field
  const mx = cx + 70 * Math.sin(angle);
  const my = cy - 70 * Math.cos(angle);
  const phases = ['a', "c'", 'b', "a'", 'c', "b'"];
  const description = `Synchronous speed ${fmt(o.syncSpeedRpm)} rpm, rotor speed ${fmt(o.speedRpm)} rpm, slip ${fmt(100 * o.slip)} %, rotor frequency ${fmt(o.rotorFrequency)} Hz. ${L.fieldViewDesc}`;
  return (
    <svg
      viewBox="0 0 460 300"
      className="h-auto w-full max-w-xl"
      role="img"
      aria-label={description}
      data-testid="ac-field-view"
    >
      {/* Stator ring and winding positions */}
      <circle
        cx={cx}
        cy={cy}
        r={120}
        fill={colors.lightblue[50]}
        stroke={colors.navy[800]}
        strokeWidth={3}
      />
      <circle
        cx={cx}
        cy={cy}
        r={95}
        fill={colors.white}
        stroke={colors.navy[300]}
        strokeWidth={2}
      />
      {phases.map((ph, i) => {
        const a = (i * Math.PI) / 3;
        return (
          <text
            key={ph}
            x={cx + 108 * Math.sin(a)}
            y={cy - 108 * Math.cos(a) + 4}
            textAnchor="middle"
            fontSize="12"
            fill={colors.navy[700]}
          >
            {ph}
          </text>
        );
      })}
      {/* Field axis, fixed in this view */}
      <line x1={cx} y1={cy + 85} x2={cx} y2={cy - 85} stroke={colors.navy[500]} strokeWidth={4} />
      <polygon
        points={`${cx},${cy - 92} ${cx - 8},${cy - 76} ${cx + 8},${cy - 76}`}
        fill={colors.navy[500]}
      />
      <text x={cx + 14} y={cy - 52} fontSize="13" fill={colors.navy[700]}>
        field
      </text>
      {/* Rotor and its marker at the slip angle */}
      <circle
        cx={cx}
        cy={cy}
        r={75}
        fill="none"
        stroke={colors.navy[800]}
        strokeWidth={2}
        strokeDasharray="4 4"
      />
      <line x1={cx} y1={cy} x2={mx} y2={my} stroke={colors.navy[900]} strokeWidth={3} />
      <circle
        cx={mx}
        cy={my}
        r={9}
        fill={colors.lightblue[400]}
        stroke={colors.navy[900]}
        strokeWidth={2}
        data-testid="rotor-marker"
      />
      <g fontFamily="system-ui, sans-serif" fill={colors.navy[900]} fontSize="14">
        <text x={300} y={70}>
          Ns = {fmt(o.syncSpeedRpm)} rpm
        </text>
        <text x={300} y={95}>
          N = {fmt(o.speedRpm)} rpm
        </text>
        <text x={300} y={120}>
          S = {fmt(100 * o.slip)} %
        </text>
        <text x={300} y={145}>
          fr = {fmt(o.rotorFrequency)} Hz
        </text>
        <text x={300} y={170}>
          f = {fmt(o.frequency)} Hz, p = {poles}
        </text>
        <text x={300} y={210} fontSize="12" fill={colors.navy[600]}>
          Marker drifts back at
        </text>
        <text x={300} y={226} fontSize="12" fill={colors.navy[600]}>
          Ns − N = {fmt(o.syncSpeedRpm - o.speedRpm)} rpm
        </text>
      </g>
    </svg>
  );
}
