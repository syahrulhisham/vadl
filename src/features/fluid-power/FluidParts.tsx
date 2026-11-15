import { useState, type ReactNode } from 'react';
import { buttonClasses, colors } from '@/design-system';
import type { Contact, Ladder } from '@/sim-core';

/**
 * A momentary push button: on while held (pointer or Space/Enter), off on
 * release, like the lab's spring-return push buttons. aria-pressed shows its state.
 */
export function HoldButton({
  label,
  pressed,
  onChange,
}: {
  readonly label: string;
  readonly pressed: boolean;
  readonly onChange: (pressed: boolean) => void;
}) {
  const [keyHeld, setKeyHeld] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={pressed}
      className={buttonClasses(pressed ? 'primary' : 'secondary', 'select-none touch-none')}
      onPointerDown={(e) => {
        // Keep receiving pointerup if the finger slides off; not every pointer can be captured.
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* capture is a convenience only */
        }
        onChange(true);
      }}
      onPointerUp={() => onChange(false)}
      onPointerCancel={() => onChange(false)}
      onKeyDown={(e) => {
        if ((e.key === ' ' || e.key === 'Enter') && !keyHeld) {
          e.preventDefault();
          setKeyHeld(true);
          onChange(true);
        }
      }}
      onKeyUp={(e) => {
        if (e.key === ' ' || e.key === 'Enter') {
          setKeyHeld(false);
          onChange(false);
        }
      }}
    >
      {label}
    </button>
  );
}

/** A labelled indicator lamp (signal, sensor, coil). Colour plus the word "on" or "off". */
export function Lamp({
  label,
  on,
  testId,
}: {
  readonly label: string;
  readonly on: boolean;
  readonly testId?: string;
}) {
  return (
    <span
      data-testid={testId}
      data-on={on ? 'true' : 'false'}
      className={`inline-flex min-h-[2.25rem] items-center gap-1 rounded border px-2 text-sm font-semibold ${
        on
          ? 'border-navy-700 bg-lightblue-300 text-navy-900'
          : 'border-navy-200 bg-white text-navy-500'
      }`}
    >
      {label} <span className="font-normal">{on ? 'on' : 'off'}</span>
    </span>
  );
}

/**
 * Horizontal cylinder: cap on the left, rod to the right. The piston sits at
 * `fraction` of the stroke; a pressurised chamber is shaded; a single-acting
 * cylinder shows its spring. End-position sensors are drawn at both ends.
 */
export function CylinderView({
  label,
  fraction,
  singleActing,
  capPressurised,
  rodPressurised,
  sensors,
  testId,
}: {
  readonly label: string;
  readonly fraction: number;
  readonly singleActing: boolean;
  readonly capPressurised: boolean;
  readonly rodPressurised: boolean;
  readonly sensors?: readonly [string, boolean, string, boolean];
  readonly testId?: string;
}) {
  const x0 = 40;
  const len = 220;
  const px = x0 + 8 + Math.min(1, Math.max(0, fraction)) * (len - 24);
  const hot = colors.lightblue[300];
  return (
    <svg
      viewBox="0 0 380 110"
      className="h-auto w-full max-w-md"
      role="img"
      aria-label={`${label}: ${Math.round(fraction * 100)} % extended${capPressurised ? ', cap side pressurised' : ''}${rodPressurised ? ', rod side pressurised' : ''}.`}
      data-testid={testId}
    >
      <rect
        x={x0}
        y={30}
        width={len}
        height={44}
        fill={colors.white}
        stroke={colors.navy[800]}
        strokeWidth={2.5}
      />
      {capPressurised ? (
        <rect x={x0 + 2} y={32} width={px - x0 - 2} height={40} fill={hot} />
      ) : null}
      {rodPressurised ? (
        <rect x={px + 8} y={32} width={x0 + len - px - 10} height={40} fill={hot} />
      ) : null}
      {singleActing ? (
        <polyline
          points={Array.from({ length: 9 }, (_, i) => {
            const x = px + 10 + ((x0 + len - px - 14) * i) / 8;
            return `${x},${i % 2 ? 36 : 68}`;
          }).join(' ')}
          fill="none"
          stroke={colors.navy[500]}
          strokeWidth={1.5}
        />
      ) : null}
      <rect x={px} y={30} width={8} height={44} fill={colors.navy[700]} />
      <rect
        x={px + 8}
        y={47}
        width={x0 + len - px - 8 + 90 * fraction + 20}
        height={10}
        fill={colors.navy[600]}
      />
      <g fontFamily="system-ui, sans-serif" fontSize="13" fill={colors.navy[900]}>
        <text x={x0} y={20} fontWeight="600">
          {label}
        </text>
        {sensors ? (
          <>
            <text
              x={x0}
              y={98}
              fill={sensors[1] ? colors.navy[900] : colors.navy[400]}
              fontWeight={sensors[1] ? 600 : 400}
            >
              {sensors[0]} {sensors[1] ? '●' : '○'}
            </text>
            <text
              x={x0 + len}
              y={98}
              textAnchor="end"
              fill={sensors[3] ? colors.navy[900] : colors.navy[400]}
              fontWeight={sensors[3] ? 600 : 400}
            >
              {sensors[2]} {sensors[3] ? '●' : '○'}
            </text>
          </>
        ) : null}
      </g>
    </svg>
  );
}

function contactText(c: Contact): string {
  return `${c.source}${c.nc ? ' NC' : ''}`;
}

/**
 * Ladder (current-path) diagram: rails left (+24 V) and right (0 V), each rung
 * with its contacts and coil; parallel branches stacked; conducting rungs drawn bold.
 */
export function LadderDiagram({
  ladder,
  rungsOn,
  signalOn,
}: {
  readonly ladder: Ladder;
  readonly rungsOn: readonly boolean[];
  /** Whether a contact source is on (to mark closed contacts). */
  readonly signalOn: (c: Contact) => boolean;
}) {
  const rowH = 34;
  const rows = ladder.reduce((n, r) => n + Math.max(1, r.branches.length), 0);
  const height = rows * rowH + 20;
  let y = 16;
  const parts: ReactNode[] = [];
  ladder.forEach((rung, i) => {
    const on = rungsOn[i] ?? false;
    const stroke = on ? colors.navy[900] : colors.navy[300];
    const w = on ? 3 : 1.5;
    const top = y;
    const branchRows = Math.max(1, rung.branches.length);
    rung.branches.forEach((chain, b) => {
      const yy = top + b * rowH + 10;
      parts.push(
        <line
          key={`l${i}-${b}`}
          x1={20}
          y1={yy}
          x2={330}
          y2={yy}
          stroke={stroke}
          strokeWidth={w}
        />,
      );
      chain.forEach((c, k) => {
        const cx = 60 + k * 85;
        const closed = c.nc ? !signalOn(c) : signalOn(c);
        parts.push(
          <g key={`c${i}-${b}-${k}`}>
            <rect x={cx - 4} y={yy - 9} width={20} height={18} fill={colors.white} />
            <line
              x1={cx}
              y1={yy - 9}
              x2={cx}
              y2={yy + 9}
              stroke={colors.navy[900]}
              strokeWidth={2}
            />
            <line
              x1={cx + 12}
              y1={yy - 9}
              x2={cx + 12}
              y2={yy + 9}
              stroke={colors.navy[900]}
              strokeWidth={2}
            />
            {c.nc ? (
              <line
                x1={cx - 2}
                y1={yy + 9}
                x2={cx + 14}
                y2={yy - 9}
                stroke={colors.navy[900]}
                strokeWidth={1.5}
              />
            ) : null}
            {closed ? (
              <line
                x1={cx}
                y1={yy}
                x2={cx + 12}
                y2={yy}
                stroke={colors.lightblue[400]}
                strokeWidth={4}
              />
            ) : null}
            <text x={cx + 6} y={yy - 12} fontSize="11" textAnchor="middle" fill={colors.navy[900]}>
              {contactText(c)}
            </text>
          </g>,
        );
      });
    });
    if (rung.branches.length === 0) {
      parts.push(
        <line
          key={`e${i}`}
          x1={20}
          y1={top + 10}
          x2={60}
          y2={top + 10}
          stroke={stroke}
          strokeWidth={w}
        />,
      );
    }
    if (branchRows > 1) {
      parts.push(
        <line
          key={`v${i}`}
          x1={330}
          y1={top + 10}
          x2={330}
          y2={top + (branchRows - 1) * rowH + 10}
          stroke={stroke}
          strokeWidth={w}
        />,
      );
    }
    parts.push(
      <g key={`coil${i}`}>
        <line x1={330} y1={top + 10} x2={360} y2={top + 10} stroke={stroke} strokeWidth={w} />
        <circle
          cx={375}
          cy={top + 10}
          r={14}
          fill={on ? colors.lightblue[300] : colors.white}
          stroke={colors.navy[900]}
          strokeWidth={2}
        />
        <text
          x={375}
          y={top + 14}
          fontSize="11"
          textAnchor="middle"
          fontWeight="600"
          fill={colors.navy[900]}
        >
          {rung.coil}
        </text>
        <line x1={389} y1={top + 10} x2={420} y2={top + 10} stroke={stroke} strokeWidth={w} />
      </g>,
    );
    y += branchRows * rowH;
  });
  return (
    <svg
      viewBox={`0 0 440 ${height}`}
      className="h-auto w-full max-w-xl"
      role="img"
      aria-label={`Ladder diagram with ${ladder.length} rungs. Conducting: ${
        ladder
          .filter((_, i) => rungsOn[i])
          .map((r) => r.coil)
          .join(', ') || 'none'
      }.`}
      data-testid="ladder-diagram"
    >
      <line x1={20} y1={4} x2={20} y2={height - 4} stroke={colors.navy[900]} strokeWidth={3} />
      <line x1={420} y1={4} x2={420} y2={height - 4} stroke={colors.navy[900]} strokeWidth={3} />
      <text x={4} y={12} fontSize="10" fill={colors.navy[700]}>
        +24 V
      </text>
      <text x={424} y={12} fontSize="10" fill={colors.navy[700]}>
        0 V
      </text>
      {parts}
    </svg>
  );
}

/** A chain of signal blocks (inputs → logic → valve → actuator), each lit when its signal is present. */
export function SignalChain({
  stages,
  testId,
}: {
  readonly stages: readonly (readonly {
    readonly label: string;
    readonly on: boolean;
    readonly detail?: string;
  }[])[];
  readonly testId?: string;
}) {
  return (
    <ol className="space-y-1" data-testid={testId} aria-label="Signal flow">
      {stages.map((row, i) => (
        <li key={i} className="flex flex-wrap items-center gap-2">
          {i > 0 ? (
            <span aria-hidden="true" className="text-navy-500">
              ↑
            </span>
          ) : null}
          {row.map((b) => (
            <span
              key={b.label}
              data-on={b.on ? 'true' : 'false'}
              className={`rounded border px-2 py-1 text-sm ${
                b.on
                  ? 'border-navy-700 bg-lightblue-300 font-semibold text-navy-900'
                  : 'border-navy-200 bg-white text-navy-600'
              }`}
            >
              {b.label}
              {b.detail ? <span className="ml-1 font-normal">{b.detail}</span> : null}
            </span>
          ))}
        </li>
      ))}
    </ol>
  );
}
