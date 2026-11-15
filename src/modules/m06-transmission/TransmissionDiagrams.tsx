import { colors } from '@/design-system';
import {
  formatSignificant,
  mToMm,
  type TransmissionOutputs,
  type TransmissionParams,
} from '@/sim-core';
import { wheelsOf, type Wheel } from './results';

const fmt = (v: number) => formatSignificant(v, 4);
const rad2deg = (r: number) => (r * 180) / Math.PI;
const arrow = (rpm: number) => (rpm > 0 ? '↻' : rpm < 0 ? '↺' : '');

interface Placed extends Wheel {
  readonly cx: number;
  readonly r: number;
  readonly kind: TransmissionParams['stages'][number]['kind'];
}

/** Wheel centres along a line: concentric wheels share a shaft; meshing gears touch; belts have a gap. */
function layout(p: TransmissionParams): { wheels: Placed[]; width: number; maxR: number } {
  const wheels = wheelsOf(p);
  const kindOf = (w: Wheel) => p.stages[w.stage]?.kind ?? 'gear';
  const isBelt = (w: Wheel) => kindOf(w).startsWith('belt');
  const toothSizes = wheels.filter((w) => !isBelt(w)).map((w) => w.size);
  const beltSizes = wheels.filter(isBelt).map((w) => w.size);
  const perTooth = toothSizes.length ? 60 / Math.max(...toothSizes) : 1;
  const perMetre = beltSizes.length ? 60 / Math.max(...beltSizes) : 1;
  const radius = (w: Wheel) => Math.max(10, w.size * (isBelt(w) ? perMetre : perTooth));
  const placed: Placed[] = [];
  let shaftX = 0;
  p.stages.forEach((s, i) => {
    const ws = wheels.filter((w) => w.stage === i);
    const driver = ws.find((w) => w.role === 'driver') as Wheel;
    const idler = ws.find((w) => w.role === 'idler');
    const driven = ws.find((w) => w.role === 'driven') as Wheel;
    const rd = radius(driver);
    if (i === 0) shaftX = rd + 16;
    placed.push({ ...driver, cx: shaftX, r: rd, kind: s.kind });
    let x = shaftX + rd;
    if (idler) {
      const ri = radius(idler);
      placed.push({ ...idler, cx: x + ri, r: ri, kind: s.kind });
      x += 2 * ri;
    }
    const rn = radius(driven);
    const gap = s.kind === 'gear' ? 0 : 40;
    shaftX = x + gap + rn;
    placed.push({ ...driven, cx: shaftX, r: rn, kind: s.kind });
  });
  const width = Math.max(...placed.map((w) => w.cx + w.r)) + 16;
  return { wheels: placed, width, maxR: Math.max(...placed.map((w) => w.r)) };
}

/** Tangent lines of an open (external) or crossed (internal) belt between two pulleys. */
function beltLines(a: Placed, b: Placed, cy: number, crossed: boolean) {
  const d = b.cx - a.cx;
  if (crossed) {
    const beta = Math.asin(Math.min(1, (a.r + b.r) / d));
    const s = Math.sin(beta);
    const c = Math.cos(beta);
    return [
      [a.cx + a.r * s, cy - a.r * c, b.cx - b.r * s, cy + b.r * c],
      [a.cx + a.r * s, cy + a.r * c, b.cx - b.r * s, cy - b.r * c],
    ];
  }
  const alpha = Math.asin(Math.max(-1, Math.min(1, (a.r - b.r) / d)));
  const s = Math.sin(alpha);
  const c = Math.cos(alpha);
  return [
    [a.cx + a.r * s, cy - a.r * c, b.cx + b.r * s, cy - b.r * c],
    [a.cx + a.r * s, cy + a.r * c, b.cx + b.r * s, cy + b.r * c],
  ];
}

/**
 * Drive train: wheels drawn to scale within each drive type (gear teeth or belt
 * diameters), each turned to the shaft angle the model reports.
 */
export function TrainDiagram({
  params: p,
  outputs: o,
}: {
  readonly params: TransmissionParams;
  readonly outputs: TransmissionOutputs;
}) {
  const { wheels, width, maxR } = layout(p);
  const cy = maxR + 12;
  const LABEL_W = 96; // px a two-line label needs before the next may share its row
  const angleOf = (w: Placed) =>
    rad2deg(w.shaft >= 0 ? (o[`angle${w.shaft}`] ?? 0) : (o[`idlerAngle${w.stage + 1}`] ?? 0));
  const rpmOf = (w: Placed) =>
    w.shaft >= 0 ? (o[`speedRpm${w.shaft}`] ?? 0) : (o[`idlerSpeedRpm${w.stage + 1}`] ?? 0);
  // Labels per shaft position (concentric wheels share one label).
  const labels = new Map<number, { letters: string[]; rpm: number; x: number }>();
  for (const w of wheels) {
    const key = Math.round(w.cx);
    const l = labels.get(key) ?? { letters: [], rpm: rpmOf(w), x: w.cx };
    l.letters.push(w.letter);
    labels.set(key, l);
  }
  // Stagger labels that would collide onto further rows.
  const rowEnds: number[] = [];
  const placedLabels = [...labels.values()]
    .sort((a, b) => a.x - b.x)
    .map((l) => {
      let row = rowEnds.findIndex((end) => l.x - end >= LABEL_W);
      if (row === -1) row = rowEnds.length;
      rowEnds[row] = l.x;
      return { ...l, row };
    });
  const height = 2 * maxR + 30 + 38 * Math.max(1, rowEnds.length);
  const desc = wheels
    .map(
      (w) =>
        `${w.letter} ${w.kind.startsWith('belt') ? `${fmt(mToMm(w.size))} mm` : `${w.size}T`} at ${fmt(Math.abs(rpmOf(w)))} rpm ${rpmOf(w) >= 0 ? 'clockwise' : 'anticlockwise'}`,
    )
    .join('; ');
  const drawOrder = [...wheels].sort((a, b) => b.r - a.r);
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-auto max-h-80 w-full"
      role="img"
      aria-label={`Drive train: ${desc}.`}
      data-testid="train-diagram"
    >
      {p.stages.map((s, i) => {
        if (s.kind === 'gear') return null;
        const a = wheels.find((w) => w.stage === i && w.role === 'driver');
        const b = wheels.find((w) => w.stage === i && w.role === 'driven');
        if (!a || !b) return null;
        return (
          <g
            key={`belt${i}`}
            stroke={colors.navy[700]}
            strokeWidth={s.kind === 'chain' ? 3 : 2.5}
            strokeDasharray={s.kind === 'chain' ? '4 3' : undefined}
          >
            {beltLines(a, b, cy, s.kind === 'belt-crossed').map(([x1, y1, x2, y2], k) => (
              <line key={k} x1={x1} y1={y1} x2={x2} y2={y2} />
            ))}
          </g>
        );
      })}
      {drawOrder.map((w) => {
        const isGear = w.kind === 'gear' || w.kind === 'chain';
        const teeth = isGear && w.size <= 90 ? w.size : 0;
        return (
          <g
            key={w.letter}
            transform={`rotate(${angleOf(w)} ${w.cx} ${cy})`}
            data-testid={`wheel-${w.letter}`}
          >
            <circle
              cx={w.cx}
              cy={cy}
              r={w.r}
              fill={w.role === 'idler' ? colors.white : colors.lightblue[50]}
              stroke={colors.navy[800]}
              strokeWidth={2}
            />
            {Array.from({ length: teeth }, (_, k) => {
              const a = (2 * Math.PI * k) / teeth;
              return (
                <line
                  key={k}
                  x1={w.cx + w.r * Math.sin(a)}
                  y1={cy - w.r * Math.cos(a)}
                  x2={w.cx + (w.r + 4) * Math.sin(a)}
                  y2={cy - (w.r + 4) * Math.cos(a)}
                  stroke={colors.navy[700]}
                  strokeWidth={1.5}
                />
              );
            })}
            <line
              x1={w.cx}
              y1={cy}
              x2={w.cx}
              y2={cy - w.r * 0.85}
              stroke={colors.navy[900]}
              strokeWidth={3}
            />
            <circle cx={w.cx} cy={cy} r={4} fill={colors.navy[900]} />
          </g>
        );
      })}
      <g
        fontFamily="system-ui, sans-serif"
        fontSize="13"
        textAnchor="middle"
        fill={colors.navy[900]}
      >
        {placedLabels.map((l) => (
          <text key={l.x} x={l.x} y={2 * maxR + 40 + 38 * l.row}>
            <tspan fontWeight="600">{l.letters.join('/')}</tspan>
            <tspan x={l.x} dy="16">
              {fmt(Math.abs(l.rpm))} rpm {arrow(l.rpm)}
            </tspan>
          </text>
        ))}
      </g>
    </svg>
  );
}

/** Belt between two pulleys with the tight (T1) and slack (T2) sides labelled. */
export function BeltDiagram({ params: p }: { readonly params: TransmissionParams }) {
  const scale = 70 / Math.max(p.beltDriverRadius, p.beltDrivenRadius);
  const a = { cx: 20 + p.beltDriverRadius * scale, r: p.beltDriverRadius * scale };
  const b = { cx: a.cx + a.r + 120 + p.beltDrivenRadius * scale, r: p.beltDrivenRadius * scale };
  const cy = 90;
  const lines = beltLines(
    { ...a, letter: 'A', role: 'driver', stage: 0, size: 0, shaft: 0, kind: 'belt-open' },
    { ...b, letter: 'B', role: 'driven', stage: 0, size: 0, shaft: 1, kind: 'belt-open' },
    cy,
    false,
  );
  const top = lines[0] as number[];
  const bottom = lines[1] as number[];
  const width = b.cx + b.r + 20;
  return (
    <svg
      viewBox={`0 0 ${width} 190`}
      className="h-auto w-full max-w-xl"
      role="img"
      aria-label={`Belt drive: tight side ${fmt(p.beltTight)} N, slack side ${fmt(p.beltSlack)} N, driver radius ${fmt(mToMm(p.beltDriverRadius))} mm, driven radius ${fmt(mToMm(p.beltDrivenRadius))} mm.`}
      data-testid="belt-diagram"
    >
      <g fill={colors.lightblue[50]} stroke={colors.navy[800]} strokeWidth={2}>
        <circle cx={a.cx} cy={cy} r={a.r} />
        <circle cx={b.cx} cy={cy} r={b.r} />
      </g>
      <line
        x1={top[0]}
        y1={top[1]}
        x2={top[2]}
        y2={top[3]}
        stroke={colors.navy[900]}
        strokeWidth={4}
      />
      <line
        x1={bottom[0]}
        y1={bottom[1]}
        x2={bottom[2]}
        y2={bottom[3]}
        stroke={colors.navy[400]}
        strokeWidth={2.5}
        strokeDasharray="6 4"
      />
      <g
        fontFamily="system-ui, sans-serif"
        fontSize="13"
        textAnchor="middle"
        fill={colors.navy[900]}
      >
        <text x={(a.cx + b.cx) / 2} y={Math.min(top[1] ?? 0, top[3] ?? 0) - 8}>
          T1 = {fmt(p.beltTight)} N (tight)
        </text>
        <text x={(a.cx + b.cx) / 2} y={Math.max(bottom[1] ?? 0, bottom[3] ?? 0) + 20}>
          T2 = {fmt(p.beltSlack)} N (slack)
        </text>
        <text x={a.cx} y={cy + 5}>
          A ↻
        </text>
        <text x={b.cx} y={cy + 5}>
          B
        </text>
      </g>
    </svg>
  );
}

/** Block and tackle with n supporting rope segments. */
export function LiftDiagram({
  params: p,
  outputs: o,
}: {
  readonly params: TransmissionParams;
  readonly outputs: TransmissionOutputs;
}) {
  const n = p.liftSupports;
  const left = 60;
  const spacing = 22;
  const ropes = Array.from({ length: n }, (_, i) => left + i * spacing);
  const right = left + (n - 1) * spacing;
  return (
    <svg
      viewBox="0 0 320 240"
      className="h-auto w-full max-w-sm"
      role="img"
      aria-label={`Lifting pulley with ${n} supporting rope segments: load ${fmt(p.liftLoad)} N, effort ${fmt(o.liftEffort)} N.`}
      data-testid="lift-diagram"
    >
      <rect x="20" y="8" width="280" height="10" fill={colors.navy[700]} />
      <g stroke={colors.navy[900]} strokeWidth={2}>
        {ropes.map((x) => (
          <line key={x} x1={x} y1={34} x2={x} y2={140} />
        ))}
        <line x1={right + 18} y1={34} x2={right + 18} y2={200} />
      </g>
      <rect
        x={left - 12}
        y="22"
        width={right - left + 24 + 18}
        height="18"
        rx="8"
        fill={colors.lightblue[200]}
        stroke={colors.navy[800]}
      />
      <rect
        x={left - 12}
        y="134"
        width={right - left + 24}
        height="18"
        rx="8"
        fill={colors.lightblue[200]}
        stroke={colors.navy[800]}
      />
      <line
        x1={(left + right) / 2}
        y1={152}
        x2={(left + right) / 2}
        y2={170}
        stroke={colors.navy[900]}
        strokeWidth={2}
      />
      <rect
        x={(left + right) / 2 - 30}
        y="170"
        width="60"
        height="40"
        fill={colors.navy[100]}
        stroke={colors.navy[800]}
      />
      <g
        fontFamily="system-ui, sans-serif"
        fontSize="12"
        textAnchor="middle"
        fill={colors.navy[900]}
      >
        <text x={(left + right) / 2} y="195">
          {fmt(p.liftLoad)} N
        </text>
        <text x={right + 18} y="218">
          Effort
        </text>
        <text x={right + 18} y="232">
          {fmt(o.liftEffort)} N ↓
        </text>
        <text x={left - 30} y="90" textAnchor="middle">
          n = {n}
        </text>
      </g>
    </svg>
  );
}
