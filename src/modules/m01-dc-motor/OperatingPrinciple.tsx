import { useEffect, useState } from 'react';
import { Button, colors } from '@/design-system';
import { PartsExplorer } from '@/features/lab-shell';
import { formatSignificant, type DcMotorOutputs } from '@/sim-core';
import { M01_PRINCIPLE as T } from './content.en';

const fmt = (v: number) => formatSignificant(v, 3);
const STEP_SECONDS = 5;
const SLOTS = 12;
const rad = (deg: number) => (deg * Math.PI) / 180;
/** Point at radius r and angle a (degrees, anticlockwise from the right) around the centre. */
const pt = (r: number, a: number): [number, number] => [
  200 + r * Math.cos(rad(a)),
  200 - r * Math.sin(rad(a)),
];

type PartId = (typeof T.parts)[number]['id'];

/**
 * Operating-principle sequence and construction explorer (Milestone 11). The
 * drawing is illustrative (it is labelled so) and no number is read from it; the
 * "from the model now" line shows outputs of the laboratory's own model.
 */
export function OperatingPrinciple({ outputs: o }: { readonly outputs: DcMotorOutputs }) {
  const [stage, setStage] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [part, setPart] = useState<PartId | null>(null);
  const last = T.stages.length - 1;

  useEffect(() => {
    if (!playing) return undefined;
    const id = window.setInterval(() => {
      setStage((s) => {
        if (s >= last) {
          setPlaying(false);
          return s;
        }
        return s + 1;
      });
    }, STEP_SECONDS * 1000);
    return () => window.clearInterval(id);
  }, [playing, last]);

  const current = T.stages[stage] ?? T.stages[0];
  const show = (from: number) => stage >= from;
  const hi = (id: PartId) => part === id;
  const outline = (id: PartId) => ({
    stroke: hi(id) ? colors.status.danger : colors.navy[900],
    strokeWidth: hi(id) ? 4 : 1.5,
  });
  const live = [
    `If = ${fmt(o.fieldCurrent)} A`,
    `Ia = ${fmt(o.armatureCurrent)} A`,
    `Td = ${fmt(o.torque)} N·m`,
    `N = ${fmt(o.speedRpm)} rpm`,
    `Eg = ${fmt(o.backEmf)} V`,
  ].join(' · ');
  const description = `${T.title}. ${current?.title ?? ''}: ${current?.text ?? ''}`;

  return (
    <div className="space-y-3" data-testid="operating-principle">
      <h3 className="text-base font-semibold text-navy-800">{T.title}</h3>
      <div role="group" aria-label={T.stagesLabel} className="flex flex-wrap gap-2">
        {T.stages.map((s, i) => (
          <Button
            key={s.id}
            variant={i === stage ? 'primary' : 'secondary'}
            aria-pressed={i === stage}
            onClick={() => {
              setPlaying(false);
              setStage(i);
            }}
          >
            {s.title}
          </Button>
        ))}
      </div>

      <svg
        viewBox="0 0 400 400"
        className="mx-auto h-auto w-full max-w-md"
        role="img"
        aria-label={description}
        data-testid="principle-drawing"
        data-stage={current?.id}
      >
        <defs>
          <marker
            id="pr-arrow"
            viewBox="0 0 10 10"
            refX="8"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto"
          >
            <path d="M0,0 L10,5 L0,10 z" fill={colors.navy[900]} />
          </marker>
        </defs>

        {/* Yoke */}
        <circle cx="200" cy="200" r="182" fill={colors.navy[200]} {...outline('yoke')} />
        <circle cx="200" cy="200" r="160" fill={colors.white} stroke={colors.navy[900]} />

        {/* Poles with field coils (top N, bottom S) */}
        {(['N', 'S'] as const).map((name) => {
          const top = name === 'N';
          const y = top ? 42 : 298;
          const shoeY = top ? 96 : 292;
          return (
            <g key={name} data-part="poles">
              <rect
                x="170"
                y={y}
                width="60"
                height="60"
                fill={top ? colors.navy[600] : colors.lightblue[300]}
                {...outline('poles')}
              />
              <rect
                x="128"
                y={shoeY}
                width="144"
                height="12"
                rx="6"
                fill={top ? colors.navy[600] : colors.lightblue[300]}
                {...outline('poles')}
              />
              <rect
                x="138"
                y={y + 8}
                width="32"
                height="44"
                fill={show(0) ? colors.lightblue[200] : colors.navy[50]}
                {...outline('field')}
              />
              <rect
                x="230"
                y={y + 8}
                width="32"
                height="44"
                fill={show(0) ? colors.lightblue[200] : colors.navy[50]}
                {...outline('field')}
              />
              <text
                x="200"
                y={y + 38}
                textAnchor="middle"
                fontSize="24"
                fontWeight="700"
                fontFamily="system-ui, sans-serif"
                fill={top ? colors.white : colors.navy[900]}
              >
                {name}
              </text>
            </g>
          );
        })}

        {/* Air gap ring (highlight only) */}
        {hi('gap') ? (
          <circle
            cx="200"
            cy="200"
            r="88"
            fill="none"
            stroke={colors.status.danger}
            strokeWidth="6"
            strokeDasharray="6 4"
          />
        ) : null}

        {/* Rotor: core, slots, commutator and shaft turn together from the rotation step on */}
        <g
          data-testid="principle-rotor"
          data-rotating={show(5) ? 'true' : 'false'}
          className={
            show(5)
              ? 'motion-safe:animate-[spin_8s_linear_infinite] motion-safe:[animation-direction:reverse]'
              : undefined
          }
          style={{ transformOrigin: '200px 200px' }}
        >
          <circle cx="200" cy="200" r="80" fill={colors.navy[100]} {...outline('core')} />
          {Array.from({ length: SLOTS }, (_, i) => {
            const [x, y] = pt(68, 15 + i * 30);
            return (
              <circle
                key={i}
                cx={x}
                cy={y}
                r="8"
                fill={show(2) ? colors.lightblue[300] : colors.navy[300]}
                {...outline('winding')}
              />
            );
          })}
          <circle cx="200" cy="200" r="34" fill={colors.navy[300]} {...outline('commutator')} />
          {Array.from({ length: SLOTS }, (_, i) => {
            const [x1, y1] = pt(16, i * 30);
            const [x2, y2] = pt(34, i * 30);
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={colors.navy[900]} />;
          })}
          <circle cx="200" cy="200" r="14" fill={colors.white} {...outline('shaft')} />
          <rect x="197" y="186" width="6" height="8" fill={colors.navy[900]} />
        </g>

        {/* Current direction in the conductors: fixed in space (that is commutation) */}
        {show(2)
          ? Array.from({ length: SLOTS }, (_, i) => {
              const a = 15 + i * 30;
              const [x, y] = pt(68, a);
              const neutral = Math.abs(Math.sin(rad(a))) < 0.3;
              if (neutral) return null;
              return a < 180 ? (
                <path
                  key={i}
                  d={`M${x - 4} ${y - 4} l8 8 M${x + 4} ${y - 4} l-8 8`}
                  stroke={colors.navy[900]}
                  strokeWidth="2"
                />
              ) : (
                <circle key={i} cx={x} cy={y} r="2.6" fill={colors.navy[900]} />
              );
            })
          : null}

        {/* Brushes on the neutral axis */}
        <g data-part="brushes">
          <rect
            x="140"
            y="190"
            width="26"
            height="20"
            fill={colors.navy[800]}
            {...outline('brushes')}
          />
          <rect
            x="234"
            y="190"
            width="26"
            height="20"
            fill={colors.navy[800]}
            {...outline('brushes')}
          />
          <text x="132" y="186" fontSize="16" fontWeight="700" fill={colors.navy[900]}>
            +
          </text>
          <text x="262" y="186" fontSize="16" fontWeight="700" fill={colors.navy[900]}>
            −
          </text>
        </g>

        {/* Flux from N to S */}
        {show(1)
          ? [-60, -20, 20, 60].map((dx) => (
              <line
                key={dx}
                x1={200 + dx}
                y1={112}
                x2={200 + dx}
                y2={286}
                stroke={colors.lightblue[400]}
                strokeWidth="2.5"
                strokeDasharray="8 5"
                markerEnd="url(#pr-arrow)"
              />
            ))
          : null}

        {/* Forces on the conductors under each pole (tangential, anticlockwise) */}
        {show(3)
          ? [45, 75, 105, 135, 225, 255, 285, 315].map((a) => {
              const [x, y] = pt(96, a);
              const [x2, y2] = [x - 26 * Math.sin(rad(a)), y - 26 * Math.cos(rad(a))];
              return (
                <line
                  key={a}
                  x1={x}
                  y1={y}
                  x2={x2}
                  y2={y2}
                  stroke={colors.navy[900]}
                  strokeWidth="3"
                  markerEnd="url(#pr-arrow)"
                />
              );
            })
          : null}

        {/* Torque */}
        {show(4) ? (
          <g>
            <path
              d={`M${pt(48, 300).join(' ')} A48 48 0 1 0 ${pt(48, 240).join(' ')}`}
              fill="none"
              stroke={colors.navy[900]}
              strokeWidth="3"
              markerEnd="url(#pr-arrow)"
            />
            <text x="200" y="258" textAnchor="middle" fontSize="14" fontWeight="700">
              Td
            </text>
          </g>
        ) : null}

        {/* Neutral axis during commutation */}
        {show(6) ? (
          <line
            x1="20"
            y1="200"
            x2="380"
            y2="200"
            stroke={colors.status.danger}
            strokeWidth="2"
            strokeDasharray="10 6"
          />
        ) : null}

        {/* Back-emf */}
        {show(7) ? (
          <text
            x="200"
            y="24"
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill={colors.navy[900]}
          >
            Eg = Kv·If·ω
          </text>
        ) : null}
      </svg>

      <div aria-live="polite" className="space-y-1">
        <p className="text-sm font-semibold text-navy-900" data-testid="principle-step">
          {T.stepOf.replace('{n}', String(stage + 1)).replace('{total}', String(T.stages.length))}
          {': '}
          {current?.title}
        </p>
        <p className="text-sm text-navy-800" data-testid="principle-text">
          {current?.text}
        </p>
        <p className="text-sm text-navy-700" data-testid="principle-live">
          {T.live}: {live}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant="secondary"
          disabled={stage === 0}
          onClick={() => {
            setPlaying(false);
            setStage((s) => Math.max(0, s - 1));
          }}
        >
          {T.previous}
        </Button>
        <Button
          variant="secondary"
          disabled={stage === last}
          onClick={() => {
            setPlaying(false);
            setStage((s) => Math.min(last, s + 1));
          }}
        >
          {T.next}
        </Button>
        <Button onClick={() => setPlaying((v) => !v)}>{playing ? T.pause : T.play}</Button>
      </div>

      <PartsExplorer
        title={T.partsTitle}
        hint={T.partsHint}
        parts={T.parts}
        selected={part}
        onSelect={(id) => setPart(id as PartId | null)}
      />
      <p className="text-xs text-navy-600">{T.note}</p>
    </div>
  );
}
