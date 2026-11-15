import { colors } from '@/design-system';
import { formatSignificant, type CamOutputs, type CamParams } from '@/sim-core';

const fmt = (v: number) => formatSignificant(v, 4);
const CX = 160;
const CY = 250;

/**
 * Plate cam and radial follower. The profile comes from the model (cam frame),
 * the group is rotated clockwise by the simulated cam angle, and the follower is
 * drawn at the model's displacement. The drawing only scales and places values.
 */
export function CamDiagram({
  params: p,
  outputs: o,
  profile,
}: {
  readonly params: CamParams;
  readonly outputs: CamOutputs;
  readonly profile: readonly { readonly x: number; readonly y: number }[];
}) {
  const roller = p.follower === 'roller';
  const reach = p.baseRadius + p.lift + (roller ? 2 * p.rollerRadius : 0);
  const k = 120 / reach; // px per metre
  const path = profile
    .map(
      (q, i) => `${i === 0 ? 'M' : 'L'}${(CX + k * q.x).toFixed(1)},${(CY - k * q.y).toFixed(1)}`,
    )
    .join(' ');
  const contactY = CY - k * (p.baseRadius + o.displacement);
  const rollerY = CY - k * (p.baseRadius + p.rollerRadius + o.displacement);
  const stemBottom = roller
    ? rollerY - k * p.rollerRadius
    : contactY - (p.follower === 'flat' ? 4 : 14);
  const desc = `${p.follower === 'knife' ? 'Knife-edge' : roller ? 'Roller' : 'Flat-faced'} follower on a plate cam at ${fmt(o.camAngleDeg)}°: displacement ${fmt(o.displacementMm)} mm.`;
  return (
    <svg
      viewBox="0 0 320 400"
      className="mx-auto h-auto w-full max-w-xs"
      role="img"
      aria-label={desc}
      data-testid="cam-diagram"
    >
      {/* Guide */}
      <g fill={colors.navy[200]} stroke={colors.navy[700]}>
        <rect x={CX - 26} y={40} width={16} height={36} />
        <rect x={CX + 10} y={40} width={16} height={36} />
      </g>
      <g transform={`rotate(${o.camAngleDeg} ${CX} ${CY})`} data-testid="cam-body">
        <path
          d={`${path} Z`}
          fill={colors.lightblue[100]}
          stroke={colors.navy[800]}
          strokeWidth={2}
        />
        <circle
          cx={CX}
          cy={CY}
          r={k * p.baseRadius}
          fill="none"
          stroke={colors.navy[300]}
          strokeDasharray="4 4"
        />
        <line
          x1={CX}
          y1={CY}
          x2={CX}
          y2={CY - k * p.baseRadius * 0.8}
          stroke={colors.navy[500]}
          strokeWidth={3}
        />
      </g>
      <circle cx={CX} cy={CY} r={7} fill={colors.navy[900]} />
      {/* Follower */}
      <g data-testid="follower" fill={colors.navy[600]} stroke={colors.navy[900]}>
        <rect x={CX - 6} y={10} width={12} height={Math.max(0, stemBottom - 10)} />
        {p.follower === 'knife' ? (
          <polygon
            points={`${CX - 10},${contactY - 14} ${CX + 10},${contactY - 14} ${CX},${contactY}`}
          />
        ) : roller ? (
          <circle cx={CX} cy={rollerY} r={k * p.rollerRadius} fill={colors.white} strokeWidth={2} />
        ) : (
          <rect x={CX - 60} y={contactY - 4} width={120} height={4} />
        )}
      </g>
      <g fontFamily="system-ui, sans-serif" fontSize="12" fill={colors.navy[900]}>
        <text x={8} y={390}>
          θ = {fmt(o.camAngleDeg)}°
        </text>
        <text x={312} y={390} textAnchor="end">
          s = {fmt(o.displacementMm)} mm
        </text>
      </g>
    </svg>
  );
}
