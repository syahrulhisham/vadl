import { colors } from '@/design-system';
import { formatSignificant, type ServoOutputs, type ServoParams } from '@/sim-core';

const fmt = (v: number) => formatSignificant(v, 3);

/**
 * Block diagram of the course's servo loop — reference, summing junction,
 * servo amplifier, motor, sensor — labelled with the model's present signals,
 * plus a shaft dial with the reference (dashed) and actual position.
 */
export function ServoDiagram({
  params: p,
  outputs: o,
  highlight = null,
}: {
  readonly params: ServoParams;
  readonly outputs: ServoOutputs;
  /** Part chosen in the explorer: summing, amplifier, motor or sensor. */
  readonly highlight?: string | null;
}) {
  const mark = (id: string) =>
    highlight === id ? { stroke: colors.status.danger, strokeWidth: 5 } : {};
  const wire = colors.navy[800];
  const pos = p.mode === 'position';
  const sensor = pos
    ? p.feedback === 'encoder'
      ? 'Encoder'
      : p.feedback === 'resolver'
        ? 'Resolver'
        : 'Potentiometer'
    : 'Tachometer';
  const desc = `Servo loop: Vcs ${fmt(o.vcs)} V minus Vfc ${fmt(o.vfc)} V gives the drive signal ${fmt(o.driveSignal)} V; the amplifier applies ${fmt(o.armatureVoltage)} V to the motor${o.saturated ? ' (saturated)' : ''}.`;
  return (
    <svg
      viewBox="0 0 560 200"
      className="h-auto w-full max-w-2xl"
      role="img"
      aria-label={desc}
      data-testid="servo-diagram"
      data-highlight={highlight ?? ''}
    >
      <defs>
        <marker
          id="arrow"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto"
        >
          <path d="M0,0 L10,5 L0,10 z" fill={wire} />
        </marker>
      </defs>
      <g stroke={wire} strokeWidth={2} fill="none" markerEnd="url(#arrow)">
        <line x1="40" y1="70" x2="96" y2="70" />
        <line x1="124" y1="70" x2="180" y2="70" />
        <line x1="290" y1="70" x2="340" y2="70" />
        <line x1="450" y1="70" x2="530" y2="70" />
        <polyline points="490,70 490,160 330,160" />
        <polyline points="220,160 110,160 110,86" />
      </g>
      <g stroke={wire} strokeWidth={2.5} fill={colors.white}>
        <circle cx="110" cy="70" r="14" {...mark('summing')} />
        <rect
          x="180"
          y="40"
          width="110"
          height="60"
          rx="6"
          fill={colors.lightblue[50]}
          {...mark('amplifier')}
        />
        <rect x="340" y="40" width="110" height="60" rx="6" {...mark('motor')} />
        <rect x="220" y="135" width="110" height="50" rx="6" {...mark('sensor')} />
      </g>
      <g
        fontFamily="system-ui, sans-serif"
        fill={colors.navy[900]}
        fontSize="12"
        textAnchor="middle"
      >
        <text x="110" y="75" fontSize="16">
          Σ
        </text>
        <text x="96" y="62" fontSize="13">
          +
        </text>
        <text x="100" y="98" fontSize="15">
          −
        </text>
        <text x="40" y="58">
          Vcs
        </text>
        <text x="40" y="92" data-testid="servo-vcs">
          {fmt(o.vcs)} V
        </text>
        <text x="152" y="58">
          Ve
        </text>
        <text x="152" y="92">
          {fmt(o.driveSignal)} V
        </text>
        <text x="235" y="62" fontWeight="600">
          Servo amplifier
        </text>
        <text x="235" y="80">
          Kp = {fmt(p.kp)}
        </text>
        <text
          x="235"
          y="95"
          fontSize="11"
          fill={o.saturated ? colors.status.danger : colors.navy[700]}
        >
          {o.saturated ? `saturated ±${fmt(p.vMax)} V` : `limit ±${fmt(p.vMax)} V`}
        </text>
        <text x="315" y="58">
          Va
        </text>
        <text x="315" y="92">
          {fmt(o.armatureVoltage)} V
        </text>
        <text x="395" y="62" fontWeight="600">
          DC servo motor
        </text>
        <text x="395" y="80">
          Ia = {fmt(o.armatureCurrent)} A
        </text>
        <text x="395" y="95">
          TL = {fmt(p.loadTorque)} N·m
        </text>
        <text x="510" y="58">
          {pos ? 'θ' : 'ω'}
        </text>
        <text x="275" y="157" fontWeight="600">
          {sensor}
        </text>
        <text x="275" y="174">
          {pos ? `Kfb = ${fmt(p.positionGain)} V/rad` : `Kt = ${fmt(p.tachGain)} V·s/rad`}
        </text>
        <text x="165" y="152">
          Vfc
        </text>
        <text x="165" y="178">
          {fmt(o.vfc)} V
        </text>
      </g>
    </svg>
  );
}

/** Shaft dial: reference pointer dashed, actual pointer solid (angles from the model). */
export function ServoDial({
  outputs: o,
  position,
}: {
  readonly outputs: ServoOutputs;
  readonly position: boolean;
}) {
  const c = 70;
  const tip = (deg: number, r: number) => {
    const a = (deg * Math.PI) / 180;
    return { x: c + r * Math.sin(a), y: c - r * Math.cos(a) };
  };
  const actual = tip(o.positionDeg, 52);
  const ref = position ? tip(o.referenceDeg, 58) : null;
  return (
    <svg
      viewBox="0 0 140 140"
      className="h-auto w-36"
      role="img"
      aria-label={`Shaft at ${fmt(o.positionDeg)}°${position ? `, reference ${fmt(o.referenceDeg)}°` : ''}`}
      data-testid="servo-dial"
    >
      <circle
        cx={c}
        cy={c}
        r={64}
        fill={colors.lightblue[50]}
        stroke={colors.navy[800]}
        strokeWidth={2}
      />
      {[0, 90, 180, 270].map((d) => {
        const a = tip(d, 64);
        const b = tip(d, 56);
        return (
          <line
            key={d}
            x1={a.x}
            y1={a.y}
            x2={b.x}
            y2={b.y}
            stroke={colors.navy[500]}
            strokeWidth={2}
          />
        );
      })}
      {ref ? (
        <line
          x1={c}
          y1={c}
          x2={ref.x}
          y2={ref.y}
          stroke={colors.lightblue[400]}
          strokeWidth={4}
          strokeDasharray="6 4"
        />
      ) : null}
      <line x1={c} y1={c} x2={actual.x} y2={actual.y} stroke={colors.navy[900]} strokeWidth={4} />
      <circle cx={c} cy={c} r={5} fill={colors.navy[900]} />
    </svg>
  );
}
