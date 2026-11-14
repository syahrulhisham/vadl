import { colors } from '@/design-system';
import { t } from '@/i18n';
import { formatSignificant } from '@/sim-core';

export interface RlCircuitDiagramProps {
  readonly voltage: number;
  readonly resistance: number;
  readonly inductance: number;
  /** Simulated current, A. */
  readonly current: number;
  readonly switchClosed: boolean;
}

/**
 * Series RL circuit drawn in SVG. The ammeter shows the simulated current; the
 * switch is drawn open before the run starts. All values come from props.
 */
export function RlCircuitDiagram({
  voltage,
  resistance,
  inductance,
  current,
  switchClosed,
}: RlCircuitDiagramProps) {
  const wire = colors.navy[800];
  const fmt = (v: number) => formatSignificant(v, 3);
  return (
    <svg
      viewBox="0 0 420 240"
      className="h-auto w-full max-w-xl"
      role="img"
      aria-label={t('rl.diagramLabel')}
      data-testid="rl-diagram"
    >
      <g fill="none" stroke={wire} strokeWidth={2.5} strokeLinecap="round">
        {/* Loop wires */}
        <path d="M60 170 V60 H120" />
        <path d="M170 60 H200" />
        <path d="M290 60 H360 V95" />
        <path d="M360 175 V200 H260" />
        <path d="M180 200 H60 V170" />
        {/* Switch: fixed contact at 160, blade from 120 */}
        <circle cx="120" cy="60" r="3.5" fill={wire} />
        <circle cx="170" cy="60" r="3.5" fill={wire} />
        <path d={switchClosed ? 'M120 60 L170 60' : 'M120 60 L162 36'} data-testid="rl-switch" />
        {/* Resistor zig-zag between 200 and 290 */}
        <path d="M200 60 l7 -10 l12 20 l12 -20 l12 20 l12 -20 l12 20 l12 -20 l11 10" />
        {/* Inductor coils between y=95 and y=175 */}
        <path d="M360 95 a10 10 0 0 1 0 20 a10 10 0 0 1 0 20 a10 10 0 0 1 0 20 a10 10 0 0 1 0 20" />
        {/* Ammeter */}
        <circle cx="220" cy="200" r="22" fill={colors.white} />
      </g>
      {/* Battery: long and short plates */}
      <g stroke={wire} strokeWidth={3}>
        <line x1="40" y1="110" x2="80" y2="110" />
        <line x1="50" y1="122" x2="70" y2="122" />
      </g>
      <g fill={colors.navy[900]} fontSize="14" fontFamily="system-ui, sans-serif">
        <text x="14" y="105">
          +
        </text>
        <text x="88" y="120">
          V = {fmt(voltage)} V
        </text>
        <text x="200" y="32">
          R = {fmt(resistance)} Ω
        </text>
        <text x="300" y="140" textAnchor="end">
          L = {fmt(inductance)} H
        </text>
        <text x="220" y="205" textAnchor="middle" fontWeight="600">
          A
        </text>
        <text x="220" y="238" textAnchor="middle" data-testid="rl-ammeter">
          i = {fmt(current)} A
        </text>
        <text x="145" y="88" textAnchor="middle" fontSize="12" fill={colors.navy[600]}>
          {switchClosed ? t('rl.switchClosed') : t('rl.switchOpen')}
        </text>
      </g>
    </svg>
  );
}
