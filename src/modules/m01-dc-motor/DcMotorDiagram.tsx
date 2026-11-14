import { colors } from '@/design-system';
import { formatSignificant, radToDeg, type DcMotorOutputs, type DcMotorParams } from '@/sim-core';
import { M01_LABELS as L } from './content.en';

export interface DcMotorDiagramProps {
  readonly params: DcMotorParams;
  readonly outputs: DcMotorOutputs;
  readonly running: boolean;
}

const fmt = (v: number) => formatSignificant(v, 3);

/** Vertical winding: four humps from (x, y) down to (x, y + 64). */
function coilV(x: number, y: number) {
  return `M${x} ${y} a8 8 0 0 1 0 16 a8 8 0 0 1 0 16 a8 8 0 0 1 0 16 a8 8 0 0 1 0 16`;
}

/** Horizontal winding: four humps from (x, y) right to (x + 64, y). */
function coilH(x: number, y: number) {
  return `M${x} ${y} a8 8 0 0 1 16 0 a8 8 0 0 1 16 0 a8 8 0 0 1 16 0 a8 8 0 0 1 16 0`;
}

/**
 * Schematic of the drive: supply (battery or converter), optional starting
 * resistor, armature, field winding placed for the motor type, shaft and load.
 * Every number shown comes from the model's parameters or outputs.
 */
export function DcMotorDiagram({ params: p, outputs: o, running }: DcMotorDiagramProps) {
  const wire = colors.navy[800];
  const series = p.motorType === 'series';
  const shunt = p.motorType === 'shunt';
  const separate = p.motorType === 'separately-excited';
  const conv = p.supply === 'converter';
  const description = `${L.motorTypes[p.motorType]} DC motor on ${
    conv
      ? `${L.converters[p.armatureConverter]} at αa ${fmt(radToDeg(p.alphaArmature))}°`
      : 'a DC supply'
  }: Va ${fmt(o.armatureVoltage)} V, Ia ${fmt(o.armatureCurrent)} A, If ${fmt(o.fieldCurrent)} A, speed ${fmt(o.speedRpm)} rpm, load ${fmt(o.loadTorque)} N·m.`;

  return (
    <svg
      viewBox="0 0 560 300"
      className="h-auto w-full max-w-2xl"
      role="img"
      aria-label={description}
      data-testid="dc-diagram"
    >
      <g fill="none" stroke={wire} strokeWidth={2.5} strokeLinecap="round">
        {/* Armature loop: supply at x=60, top rail y=50, bottom rail y=250 */}
        <path d="M60 110 V50 H150" />
        <path d={p.rst > 0 ? 'M210 50 H240' : 'M150 50 H240'} />
        {series ? (
          <>
            <path d="M240 50 H250" />
            <path d={coilH(250, 50)} />
            <path d="M314 50 H330 V110" />
          </>
        ) : (
          <path d="M240 50 H330 V110" />
        )}
        <path d="M330 190 V250 H60 V190" />
        {/* Starting resistor */}
        {p.rst > 0 ? <path d="M150 50 l5 -8 l10 16 l10 -16 l10 16 l10 -16 l10 16 l5 -8" /> : null}
        {/* Armature */}
        <circle cx="330" cy="150" r="40" fill={colors.white} />
        {/* Shaft and load */}
        <path d="M370 150 H440" strokeWidth={5} />
        <rect x="440" y="120" width="90" height="60" rx="6" fill={colors.lightblue[50]} />
        {/* Shunt field across the supply */}
        {shunt ? (
          <>
            <path d="M240 50 V118" />
            <path d={coilV(240, 118)} />
            <path d="M240 182 V250" />
          </>
        ) : null}
        {/* Separate field: its own closed loop with its own source, beside the armature */}
        {separate ? (
          <>
            <path d="M170 120 H250 V122" />
            <path d={coilV(250, 122)} />
            <path d="M250 186 V215 H170 V196" />
            <path d="M170 120 V178" />
          </>
        ) : null}
      </g>
      {/* Supply */}
      {conv ? (
        <g>
          <rect
            x="20"
            y="110"
            width="80"
            height="80"
            rx="6"
            fill={colors.white}
            stroke={wire}
            strokeWidth={2.5}
          />
          <text x="60" y="140" textAnchor="middle" fontSize="12" fill={colors.navy[900]}>
            {L.converters[p.armatureConverter].replace(' converter', '')}
          </text>
          <text x="60" y="160" textAnchor="middle" fontSize="12" fill={colors.navy[900]}>
            αa {fmt(radToDeg(p.alphaArmature))}°
          </text>
          <text x="60" y="178" textAnchor="middle" fontSize="11" fill={colors.navy[600]}>
            {fmt(p.supplyRms)} V rms
          </text>
        </g>
      ) : (
        <g stroke={wire} strokeWidth={3}>
          <line x1="40" y1="140" x2="80" y2="140" />
          <line x1="50" y1="152" x2="70" y2="152" />
          <line x1="40" y1="164" x2="80" y2="164" />
          <line x1="50" y1="176" x2="70" y2="176" />
          <line x1="60" y1="110" x2="60" y2="140" />
          <line x1="60" y1="176" x2="60" y2="190" />
        </g>
      )}
      {separate ? (
        <g stroke={wire} strokeWidth={3}>
          <line x1="155" y1="178" x2="185" y2="178" />
          <line x1="162" y1="188" x2="178" y2="188" />
          <line x1="170" y1="188" x2="170" y2="196" />
        </g>
      ) : null}
      <g fill={colors.navy[900]} fontFamily="system-ui, sans-serif" fontSize="14">
        <text x="330" y="146" textAnchor="middle" fontWeight="600">
          M
        </text>
        <text x="330" y="166" textAnchor="middle" fontSize="12">
          Eg {fmt(o.backEmf)} V
        </text>
        <text x="110" y="40" textAnchor="middle" fontSize="13" data-testid="dc-ia">
          Ia = {fmt(o.armatureCurrent)} A
        </text>
        <text x="60" y="275" textAnchor="middle" fontSize="13">
          Va = {fmt(o.armatureVoltage)} V
        </text>
        {p.rst > 0 ? (
          <text x="180" y="78" textAnchor="middle" fontSize="12">
            Rst {fmt(p.rst)} Ω
          </text>
        ) : null}
        <text
          x={series ? 282 : separate ? 210 : 228}
          y={series ? 30 : separate ? 112 : 155}
          textAnchor={shunt ? 'end' : 'middle'}
          fontSize="12"
        >
          {series ? 'series field, If = Ia' : `field If = ${fmt(o.fieldCurrent)} A`}
        </text>
        {separate ? (
          <text x="210" y="232" textAnchor="middle" fontSize="12">
            Vf {fmt(o.fieldVoltage)} V
            {conv ? ` (field converter, αf ${fmt(radToDeg(p.alphaField))}°)` : ''}
          </text>
        ) : null}
        <text x="485" y="146" textAnchor="middle" fontSize="13">
          Load
        </text>
        <text x="485" y="166" textAnchor="middle" fontSize="12">
          {fmt(o.loadTorque)} N·m
        </text>
        <text
          x="485"
          y="210"
          textAnchor="middle"
          fontSize="15"
          fontWeight="600"
          data-testid="dc-speed"
        >
          {fmt(o.speedRpm)} rpm
        </text>
        <text
          x="405"
          y="135"
          textAnchor="middle"
          fontSize="12"
          fill={running ? colors.navy[700] : colors.navy[500]}
        >
          {running ? 'running' : 'stopped'}
        </text>
      </g>
    </svg>
  );
}
