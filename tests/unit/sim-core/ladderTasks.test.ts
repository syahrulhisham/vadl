import { describe, expect, it } from 'vitest';
import { checkLadderTask, LADDER_TASKS, NC, NO, usesDirectControl, type Ladder } from '@/sim-core';

const task = (id: string) => {
  const t = LADDER_TASKS.find((x) => x.id === id);
  if (!t) throw new Error(id);
  return t;
};

/** Reference solutions (one way of many to meet each task). */
const SOLUTIONS: Record<string, Ladder> = {
  or: [{ branches: [[NO('S1')], [NO('S2')]], coil: '1M1' }],
  'and-indirect': [
    { branches: [[NO('S1'), NO('S2')]], coil: 'K1' },
    { branches: [[NO('K1')]], coil: '1M1' },
  ],
  'latch-reset': [
    {
      branches: [
        [NO('S1'), NC('S2')],
        [NO('K1'), NC('S2')],
      ],
      coil: 'K1',
    },
    { branches: [[NO('K1')]], coil: '1M1' },
  ],
  'latch-set': [
    { branches: [[NO('S1')], [NO('K1'), NC('S2')]], coil: 'K1' },
    { branches: [[NO('K1')]], coil: '1M1' },
  ],
  guard: [{ branches: [[NO('S1'), NC('S3')]], coil: '1M1' }],
};

describe('circuit design checked by simulation', () => {
  it('a reference solution passes every task', () => {
    for (const t of LADDER_TASKS) {
      const r = checkLadderTask(SOLUTIONS[t.id] ?? [], t);
      expect(r.passed, t.id).toBe(true);
    }
  });

  it('a differently drawn but equivalent circuit also passes (behaviour, not drawing)', () => {
    const alt: Ladder = [
      { branches: [[NO('S1')]], coil: 'K2' },
      { branches: [[NO('S2')]], coil: 'K3' },
      { branches: [[NO('K2')], [NO('K3')]], coil: '1M1' },
    ];
    expect(checkLadderTask(alt, task('or')).passed).toBe(true);
  });

  it('the dominant-reset latch fails the set-dominant task in the both-pressed step only', () => {
    const r = checkLadderTask(SOLUTIONS['latch-reset'] ?? [], task('latch-set'));
    expect(r.passed).toBe(false);
    expect(r.steps.map((s) => s.ok)).toEqual([true, true, true, true, true, false]);
  });

  it('direct control fails the indirect task even though the coil states are right', () => {
    const direct: Ladder = [{ branches: [[NO('S1'), NO('S2')]], coil: '1M1' }];
    expect(usesDirectControl(direct)).toBe(true);
    const r = checkLadderTask(direct, task('and-indirect'));
    expect(r.steps.every((s) => s.ok)).toBe(true);
    expect(r.indirectOk).toBe(false);
    expect(r.passed).toBe(false);
  });

  it('a chattering circuit fails as unstable; an empty ladder fails', () => {
    const chatter: Ladder = [{ branches: [[NC('K1')]], coil: 'K1' }, ...(SOLUTIONS.or ?? [])];
    expect(checkLadderTask(chatter, task('or')).stable).toBe(false);
    expect(checkLadderTask([], task('guard')).passed).toBe(false);
  });
});
