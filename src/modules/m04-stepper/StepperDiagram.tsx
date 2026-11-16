import { colors } from '@/design-system';
import { formatSignificant, type StepperOutputs, type StepperParams } from '@/sim-core';
import { phaseCurrentsOf } from './phases';

const fmt = (v: number) => formatSignificant(v, 4);
const LETTERS = ['A', 'B', 'C', 'D', 'E'];
const CX = 150;
const CY = 150;

function polar(r: number, deg: number) {
  const a = (deg * Math.PI) / 180;
  return { x: CX + r * Math.sin(a), y: CY - r * Math.cos(a) };
}

/**
 * Cross-section of the motor. Stator poles are placed anticlockwise in phase
 * order, so the sequence A → B → C turns the rotor clockwise (positive angle).
 * The rotor is drawn at the model's angle θ; tooth 0 is darker as a position mark.
 * Every number comes from the model; the drawing only places it.
 */
export function StepperDiagram({
  params: p,
  outputs: o,
  highlight = null,
}: {
  readonly params: StepperParams;
  readonly outputs: StepperOutputs;
  /** Part chosen in the construction explorer: stator, poles, rotor, marker or shaft. */
  readonly highlight?: string | null;
}) {
  const mark = (id: string, stroke: string, width: number) =>
    highlight === id
      ? { stroke: colors.status.danger, strokeWidth: width + 2.5 }
      : { stroke, strokeWidth: width };
  const vr = p.family === 'vr';
  const phases = o.phases;
  const currents = phaseCurrentsOf(o, phases);
  const nPoles = vr ? p.statorTeeth : 4;
  const rotorTeeth = vr ? p.rotorTeeth : Math.round(p.stepsPerRev / 4);
  const poleWidth = Math.min(30, (0.55 * 2 * Math.PI * 64) / nPoles);
  const toothWidth = Math.min(24, (0.5 * 2 * Math.PI * 52) / rotorTeeth);
  const theta = o.rotorAngleDeg;

  const poles = Array.from({ length: nPoles }, (_, j) => {
    const angle = -(j * 360) / nPoles;
    if (vr) {
      const ph = j % phases;
      const i = currents[ph] ?? 0;
      return { angle, label: LETTERS[ph] ?? '', level: Math.abs(i), mark: '' };
    }
    // Two-phase: A, B, Ā, B̄; the far pole of each coil has the opposite polarity.
    const coil = j % 2;
    const i = (currents[coil] ?? 0) * (j >= 2 ? -1 : 1);
    const label = `${coil === 0 ? 'A' : 'B'}${j >= 2 ? '̄' : ''}`;
    return { angle, label, level: Math.abs(i), mark: i > 0 ? 'N' : i < 0 ? 'S' : '' };
  });

  const lit = currents
    .map((i, j) => (i !== 0 ? `${LETTERS[j]}${vr ? '' : i > 0 ? '+' : '−'}` : ''))
    .filter(Boolean)
    .join(', ');
  const desc = `${vr ? `Variable-reluctance motor, ${p.statorTeeth} stator poles, ${p.rotorTeeth} rotor teeth` : `Two-phase motor, ${p.stepsPerRev} steps per revolution`}. Energised: ${lit || 'none'}. Rotor at ${fmt(theta)}°.`;

  return (
    <svg
      viewBox="0 0 300 300"
      className="mx-auto h-auto w-full max-w-sm"
      role="img"
      aria-label={desc}
      data-testid="stepper-diagram"
      data-highlight={highlight ?? ''}
    >
      <circle
        cx={CX}
        cy={CY}
        r={140}
        fill={colors.lightblue[50]}
        {...mark('stator', colors.navy[800], 3)}
        data-part="stator"
      />
      <circle
        cx={CX}
        cy={CY}
        r={64}
        fill={colors.white}
        stroke={colors.navy[200]}
        strokeWidth={1}
      />
      {poles.map((pole, j) => (
        <g key={j} transform={`rotate(${pole.angle} ${CX} ${CY})`}>
          <rect
            x={CX - poleWidth / 2}
            y={CY - 130}
            width={poleWidth}
            height={66}
            rx={3}
            fill={pole.level > 0 ? colors.lightblue[400] : colors.white}
            fillOpacity={pole.level > 0 ? 0.35 + 0.65 * pole.level : 1}
            {...mark('poles', colors.navy[800], 2)}
            data-energised={pole.level > 0 ? 'true' : 'false'}
          />
        </g>
      ))}
      <g fontFamily="system-ui, sans-serif" fontSize="13" fontWeight="600" textAnchor="middle">
        {poles.map((pole, j) => {
          const at = polar(100, pole.angle);
          return (
            <text key={j} x={at.x} y={at.y + 5} fill={colors.navy[900]}>
              {pole.label}
              {pole.mark ? <tspan fontSize="10">{` ${pole.mark}`}</tspan> : null}
            </text>
          );
        })}
      </g>
      <g transform={`rotate(${theta} ${CX} ${CY})`} data-testid="stepper-rotor">
        <circle
          cx={CX}
          cy={CY}
          r={40}
          fill={colors.navy[100]}
          {...mark('rotor', colors.navy[700], 2)}
        />
        {Array.from({ length: rotorTeeth }, (_, i) => (
          <rect
            key={i}
            x={CX - toothWidth / 2}
            y={CY - 60}
            width={toothWidth}
            height={22}
            transform={`rotate(${(i * 360) / rotorTeeth} ${CX} ${CY})`}
            fill={i === 0 ? colors.navy[500] : colors.navy[200]}
            {...mark(i === 0 ? 'marker' : 'rotor', colors.navy[700], 1)}
          />
        ))}
        <line x1={CX} y1={CY} x2={CX} y2={CY - 36} stroke={colors.navy[900]} strokeWidth={3} />
      </g>
      <circle
        cx={CX}
        cy={CY}
        r={highlight === 'shaft' ? 8 : 4}
        fill={colors.navy[900]}
        {...mark('shaft', colors.navy[900], 0)}
      />
      <text x={8} y={292} fontSize="12" fill={colors.navy[700]} fontFamily="system-ui, sans-serif">
        θ = {fmt(theta)}°
      </text>
    </svg>
  );
}
