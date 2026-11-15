/**
 * Relay-ladder evaluator for 24 V DC control circuits (LN Ch5; Festo TP201/TP601).
 *
 * A ladder is a list of rungs. Each rung is a set of parallel branches; each
 * branch is a series chain of contacts; the rung drives one coil. A contact is
 * the normally-open (NO) or normally-closed (NC) contact of an input (push button
 * S1–S3), a sensor (1B1, 1B2, 2B1, 2B2), a relay (K1–K3) or the on-delay timer T1.
 *
 * Relays switch instantly compared with the cylinders, so each scan repeats the
 * evaluation until the relay states stop changing (as the real relays settle). A
 * circuit that never settles (a relay that switches itself off) is reported.
 * Verification: docs/reference-cases/fluid-power.md (RC-M09-02).
 */

export const LADDER_INPUTS = ['S1', 'S2', 'S3'] as const;
export const LADDER_SENSORS = ['1B1', '1B2', '2B1', '2B2'] as const;
export const LADDER_RELAYS = ['K1', 'K2', 'K3'] as const;
export const LADDER_SOLENOIDS = ['1M1', '1M2', '2M1'] as const;

export type LadderInput = (typeof LADDER_INPUTS)[number];
export type LadderSensor = (typeof LADDER_SENSORS)[number];
export type LadderRelay = (typeof LADDER_RELAYS)[number];
export type LadderSolenoid = (typeof LADDER_SOLENOIDS)[number];
export type ContactSource = LadderInput | LadderSensor | LadderRelay | 'T1';
export type CoilName = LadderRelay | LadderSolenoid | 'T1';

export interface Contact {
  readonly source: ContactSource;
  /** true: normally-closed contact (conducts when its source is off). */
  readonly nc: boolean;
}

export interface Rung {
  /** Parallel branches; each is a series chain. An empty chain always conducts. */
  readonly branches: readonly (readonly Contact[])[];
  readonly coil: CoilName;
}

export type Ladder = readonly Rung[];

/** Faults for troubleshooting exercises (Festo TP201/TP601 fault catalogue). */
export type LadderFault =
  | 'none'
  | 'supply'
  | 'S1-contact'
  | '1B2-sensor'
  | '2B2-sensor'
  | 'K1-coil'
  | 'K1-welded'
  | '1M1-coil'
  | 'rung1-wire';

export const LADDER_FAULTS: readonly LadderFault[] = [
  'none',
  'supply',
  'S1-contact',
  '1B2-sensor',
  '2B2-sensor',
  'K1-coil',
  'K1-welded',
  '1M1-coil',
  'rung1-wire',
];

export type SignalMap = Readonly<Record<ContactSource, boolean>>;

export interface LadderResult {
  /** Energised coils after the circuit has settled. */
  readonly coils: Readonly<Record<CoilName, boolean>>;
  /** Relay states after settling (fed back into the next scan). */
  readonly relays: Readonly<Record<LadderRelay, boolean>>;
  /** Rungs that conduct, by index. */
  readonly rungsOn: readonly boolean[];
  /** False if the relays kept changing (the circuit oscillates). */
  readonly stable: boolean;
}

const ALL_COILS: readonly CoilName[] = [...LADDER_RELAYS, ...LADDER_SOLENOIDS, 'T1'];

/** A contact conducts when its source is on (NO) or off (NC). */
function conducts(c: Contact, s: SignalMap): boolean {
  return c.nc ? !s[c.source] : s[c.source];
}

function applyFaultToSignals(signals: Record<ContactSource, boolean>, fault: LadderFault) {
  if (fault === 'S1-contact') signals.S1 = false;
  if (fault === '1B2-sensor') signals['1B2'] = false;
  if (fault === '2B2-sensor') signals['2B2'] = false;
  if (fault === 'K1-welded') signals.K1 = true;
}

/**
 * Evaluate the ladder for the given inputs and sensors, starting from the
 * previous relay states. `timerDone` is the on-delay timer contact.
 */
export function evaluateLadder(
  ladder: Ladder,
  inputs: Readonly<Record<LadderInput, boolean>>,
  sensors: Readonly<Record<LadderSensor, boolean>>,
  previousRelays: Readonly<Record<LadderRelay, boolean>>,
  timerDone: boolean,
  fault: LadderFault = 'none',
): LadderResult {
  const off = Object.fromEntries(ALL_COILS.map((c) => [c, false])) as Record<CoilName, boolean>;
  if (fault === 'supply') {
    return {
      coils: off,
      relays: { K1: false, K2: false, K3: false },
      rungsOn: ladder.map(() => false),
      stable: true,
    };
  }
  let relays = { ...previousRelays };
  let coils = off;
  let rungsOn: boolean[] = [];
  let stable = false;
  for (let pass = 0; pass < 12; pass += 1) {
    const signals = { ...inputs, ...sensors, ...relays, T1: timerDone } as Record<
      ContactSource,
      boolean
    >;
    applyFaultToSignals(signals, fault);
    rungsOn = ladder.map(
      (r, i) =>
        !(fault === 'rung1-wire' && i === 0) &&
        r.branches.some((chain) => chain.every((c) => conducts(c, signals))),
    );
    coils = { ...off };
    ladder.forEach((r, i) => {
      if (rungsOn[i]) coils[r.coil] = true;
    });
    if (fault === 'K1-coil') coils.K1 = false;
    if (fault === '1M1-coil') coils['1M1'] = false;
    const next = { K1: coils.K1, K2: coils.K2, K3: coils.K3 };
    if (next.K1 === relays.K1 && next.K2 === relays.K2 && next.K3 === relays.K3) {
      stable = true;
      break;
    }
    relays = next;
  }
  return { coils, relays, rungsOn, stable };
}

/** Contact helpers for writing ladders compactly. */
export const NO = (source: ContactSource): Contact => ({ source, nc: false });
export const NC = (source: ContactSource): Contact => ({ source, nc: true });

/**
 * Preset ladders: Lab 3 Parts A–D (Festo TP201 Ex 2, 3, 4, 11), latching with
 * dominant reset, an on-delay return, and continuous cycling.
 */
export const LADDER_PRESETS = {
  /** Part A, direct control: S1 energises 1M1. */
  partA: [{ branches: [[NO('S1')]], coil: '1M1' }],
  /** Part B, indirect control: S1 → K1; K1 → 1M1. */
  partB: [
    { branches: [[NO('S1')]], coil: 'K1' },
    { branches: [[NO('K1')]], coil: '1M1' },
  ],
  /** Part C, OR: S1 or S2 → K1 → 2M1 (single-acting cylinder on a 3/2 valve). */
  partC: [
    { branches: [[NO('S1')], [NO('S2')]], coil: 'K1' },
    { branches: [[NO('K1')]], coil: '2M1' },
  ],
  /** Part D, sequence 1A1+ 2A1+ 1A1− 2A1− (1A1 on a double-solenoid 5/2, 2A1 on a 3/2). */
  partD: [
    { branches: [[NO('S1'), NO('1B1')]], coil: 'K1' },
    { branches: [[NO('K1')]], coil: '1M1' },
    { branches: [[NO('1B2')]], coil: '2M1' },
    { branches: [[NO('2B2'), NC('S1')]], coil: 'K2' },
    { branches: [[NO('K2')]], coil: '1M2' },
  ],
  /** Latch with dominant reset: S1 sets, S2 resets (K1 self-holding). */
  latch: [
    {
      branches: [
        [NO('S1'), NC('S2')],
        [NO('K1'), NC('S2')],
      ],
      coil: 'K1',
    },
    { branches: [[NO('K1')]], coil: '1M1' },
  ],
  /** Timed return: S1 extends 1A1; at 1B2 the timer starts; when it runs out 1A1 returns. */
  timer: [
    {
      branches: [
        [NO('S1'), NC('T1')],
        [NO('K1'), NC('T1')],
      ],
      coil: 'K1',
    },
    { branches: [[NO('K1')]], coil: '1M1' },
    { branches: [[NO('1B2')]], coil: 'T1' },
  ],
  /** Continuous cycle while S1 is held (self-resetting at the stroke ends; double-solenoid valve). */
  cycle: [
    { branches: [[NO('S1'), NO('1B1')]], coil: '1M1' },
    { branches: [[NO('1B2')]], coil: '1M2' },
  ],
} satisfies Record<string, Ladder>;

export type LadderPresetName = keyof typeof LADDER_PRESETS;
