/**
 * Circuit-design tasks checked by simulation (course-alignment §5.11: designs
 * are checked by simulation rather than by matching a drawing). A task is a
 * sequence of input states with the coil states the circuit must produce; the
 * student's ladder is run through the sequence, carrying relay states from step
 * to step, exactly as the lab circuit would behave.
 */
import {
  evaluateLadder,
  LADDER_INPUTS,
  LADDER_SOLENOIDS,
  type CoilName,
  type Ladder,
  type LadderInput,
  type LadderRelay,
} from './ladder';

export interface LadderTaskStep {
  /** Buttons pressed in this step (others released). */
  readonly pressed: readonly LadderInput[];
  /** Required coil states after the circuit settles. */
  readonly expect: Readonly<Partial<Record<CoilName, boolean>>>;
}

export interface LadderTask {
  /** Stable id; the task's title and brief are interface text in the M09 content file. */
  readonly id: string;
  readonly steps: readonly LadderTaskStep[];
  /** Push buttons must switch relays, never a solenoid directly (indirect control). */
  readonly indirect?: boolean;
}

export interface LadderTaskResult {
  readonly passed: boolean;
  readonly steps: readonly {
    readonly pressed: readonly LadderInput[];
    readonly ok: boolean;
    readonly expected: Readonly<Partial<Record<CoilName, boolean>>>;
    readonly got: Readonly<Partial<Record<CoilName, boolean>>>;
  }[];
  /** False if an input contact is in a rung that drives a solenoid while the task asks for indirect control. */
  readonly indirectOk: boolean;
  /** False if the circuit never settles in some step. */
  readonly stable: boolean;
}

const NO_SENSORS = { '1B1': false, '1B2': false, '2B1': false, '2B2': false };

/** Whether any rung with a push-button contact drives a solenoid (direct control). */
export function usesDirectControl(ladder: Ladder): boolean {
  const inputs = new Set<string>(LADDER_INPUTS);
  const solenoids = new Set<string>(LADDER_SOLENOIDS);
  return ladder.some(
    (r) => solenoids.has(r.coil) && r.branches.some((ch) => ch.some((c) => inputs.has(c.source))),
  );
}

/** Run the student's ladder through the task's steps. */
export function checkLadderTask(ladder: Ladder, task: LadderTask): LadderTaskResult {
  let relays: Record<LadderRelay, boolean> = { K1: false, K2: false, K3: false };
  let stable = true;
  const steps = task.steps.map((step) => {
    const inputs = { S1: false, S2: false, S3: false };
    for (const s of step.pressed) inputs[s] = true;
    const r = evaluateLadder(ladder, inputs, NO_SENSORS, relays, false);
    relays = { ...r.relays };
    stable = stable && r.stable;
    const got: Partial<Record<CoilName, boolean>> = {};
    let ok = true;
    for (const [coil, want] of Object.entries(step.expect) as [CoilName, boolean][]) {
      got[coil] = r.coils[coil];
      if (r.coils[coil] !== want) ok = false;
    }
    return { pressed: step.pressed, ok, expected: step.expect, got };
  });
  const indirectOk = !task.indirect || !usesDirectControl(ladder);
  return { passed: stable && indirectOk && steps.every((s) => s.ok), steps, indirectOk, stable };
}

const on = { '1M1': true } as const;
const off = { '1M1': false } as const;

/** Design tasks for M09 (original to VADL, built on the Lab 3 topics): OR, two-hand AND with a relay, latches, interlock. */
export const LADDER_TASKS: readonly LadderTask[] = [
  {
    id: 'or',
    steps: [
      { pressed: [], expect: off },
      { pressed: ['S1'], expect: on },
      { pressed: ['S2'], expect: on },
      { pressed: ['S1', 'S2'], expect: on },
      { pressed: [], expect: off },
    ],
  },
  {
    id: 'and-indirect',
    indirect: true,
    steps: [
      { pressed: [], expect: off },
      { pressed: ['S1'], expect: off },
      { pressed: ['S2'], expect: off },
      { pressed: ['S1', 'S2'], expect: on },
      { pressed: ['S1'], expect: off },
    ],
  },
  {
    id: 'latch-reset',
    steps: [
      { pressed: [], expect: off },
      { pressed: ['S1'], expect: on },
      { pressed: [], expect: on },
      { pressed: ['S2'], expect: off },
      { pressed: [], expect: off },
      { pressed: ['S1', 'S2'], expect: off },
    ],
  },
  {
    id: 'latch-set',
    steps: [
      { pressed: [], expect: off },
      { pressed: ['S1'], expect: on },
      { pressed: [], expect: on },
      { pressed: ['S2'], expect: off },
      { pressed: [], expect: off },
      { pressed: ['S1', 'S2'], expect: on },
    ],
  },
  {
    id: 'guard',
    steps: [
      { pressed: [], expect: off },
      { pressed: ['S1'], expect: on },
      { pressed: ['S1', 'S3'], expect: off },
      { pressed: ['S3'], expect: off },
      { pressed: ['S1'], expect: on },
    ],
  },
];
