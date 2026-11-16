import { colors } from '@/design-system';
import { formatSignificant, type ServoOutputs, type ServoParams } from '@/sim-core';
import { M05_LABELS as L } from './content.en';

const fmt = (v: number) => formatSignificant(v, 4);

/**
 * Sensor-to-decoder chain (Milestone 11): the same shaft read by the quadrature
 * encoder through its X1/X2/X4 decoder and by the resolver through its n-bit
 * converter. Every number is a model output; the row that closes the position
 * loop is outlined.
 */
export function SensorChain({
  params: p,
  outputs: o,
}: {
  readonly params: ServoParams;
  readonly outputs: ServoOutputs;
}) {
  const wire = colors.navy[800];
  const loop = p.mode === 'position' ? p.feedback : 'none';
  const encoderAngle = o.encoderCount * o.encoderResolutionDeg;
  const resolverAngle = o.resolverCount * o.resolverResolutionDeg;
  const rows = [
    {
      id: 'encoder',
      y: 20,
      sensor: L.chain.encoder,
      signals: `A ${o.encoderA} · B ${o.encoderB} · Z ${o.encoderZ}`,
      decoder: `${L.chain.quadrature} X${p.encoderDecoding}`,
      count: fmt(o.encoderCount),
      angle: `${fmt(encoderAngle)}°`,
      resolution: `${fmt(o.encoderResolutionDeg)}°`,
    },
    {
      id: 'resolver',
      y: 110,
      sensor: L.chain.resolver,
      signals: `sin ${fmt(o.resolverSin)} · cos ${fmt(o.resolverCos)}`,
      decoder: `${L.chain.rdc} ${p.resolverBits}-bit`,
      count: fmt(o.resolverCount),
      angle: `${fmt(resolverAngle)}°`,
      resolution: `${fmt(o.resolverResolutionDeg)}°`,
    },
  ] as const;
  const desc = `${L.chain.title}. ${L.chain.encoder}: X${p.encoderDecoding}, count ${fmt(o.encoderCount)}, ${fmt(encoderAngle)} degrees, ${fmt(o.encoderResolutionDeg)} degrees per count. ${L.chain.resolver}: ${p.resolverBits}-bit, count ${fmt(o.resolverCount)}, ${fmt(resolverAngle)} degrees, ${fmt(o.resolverResolutionDeg)} degrees per count.`;
  return (
    <svg
      viewBox="0 0 640 200"
      className="h-auto w-full max-w-3xl"
      role="img"
      aria-label={desc}
      data-testid="sensor-chain"
    >
      <defs>
        <marker
          id="chain-arrow"
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
      {rows.map((r) => {
        const active = loop === r.id;
        return (
          <g key={r.id} data-testid={`chain-${r.id}`} data-active={active ? 'true' : 'false'}>
            {active ? (
              <rect
                x="4"
                y={r.y - 12}
                width="632"
                height="84"
                rx="8"
                fill={colors.lightblue[50]}
                stroke={colors.navy[700]}
                strokeWidth={2.5}
              />
            ) : null}
            <g stroke={wire} strokeWidth={2} fill="none" markerEnd="url(#chain-arrow)">
              <line x1="130" y1={r.y + 26} x2="238" y2={r.y + 26} />
              <line x1="390" y1={r.y + 26} x2="458" y2={r.y + 26} />
            </g>
            <g stroke={wire} strokeWidth={2} fill={colors.white}>
              <rect x="14" y={r.y} width="116" height="52" rx="6" />
              <rect x="240" y={r.y} width="150" height="52" rx="6" />
              <rect x="460" y={r.y} width="166" height="52" rx="6" />
            </g>
            <g
              fontFamily="system-ui, sans-serif"
              fill={colors.navy[900]}
              fontSize="13"
              textAnchor="middle"
            >
              <text x="72" y={r.y + 31} fontWeight="600">
                {r.sensor}
              </text>
              <text x="184" y={r.y + 18} fontSize="11">
                {r.signals}
              </text>
              <text x="315" y={r.y + 31} fontWeight="600">
                {r.decoder}
              </text>
              <text x="424" y={r.y + 18} fontSize="11">
                {r.count}
              </text>
              <text x="543" y={r.y + 23} fontWeight="600">
                {r.angle}
              </text>
              <text x="543" y={r.y + 42} fontSize="11">
                {L.chain.perCount} {r.resolution}
              </text>
              {active ? (
                <text x="320" y={r.y + 66} fontSize="11" fontWeight="600">
                  {L.chain.closesLoop}
                </text>
              ) : null}
            </g>
          </g>
        );
      })}
    </svg>
  );
}
