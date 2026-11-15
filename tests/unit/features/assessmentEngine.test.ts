import { describe, expect, it } from 'vitest';
import {
  bankStats,
  buildPracticeSet,
  csvField,
  markChain,
  scoreSummary,
  sumTallies,
  percent,
  toCsv,
  type Attempt,
  type ChainInstance,
  type Question,
} from '@/features/assessment';
import { rowsToCsv, summariseAttempts } from '@/features/reports';
import { LABS } from '@/modules/labs';
import { MODULES } from '@/modules/registry';

const chain: ChainInstance = {
  stem: 'x',
  explanation: 'e',
  parts: [
    {
      label: '(a)',
      prompt: 'a',
      unit: 'V',
      relativeTolerance: 0.02,
      answer: 10,
      compute: () => 10,
    },
    {
      label: '(b)',
      prompt: 'b',
      unit: 'A',
      relativeTolerance: 0.02,
      answer: 2,
      compute: (e) => (e[0] ?? NaN) / 5,
    },
    {
      label: '(c)',
      prompt: 'c',
      unit: 'W',
      relativeTolerance: 0.02,
      answer: 20,
      compute: (e) => (e[0] ?? NaN) * (e[1] ?? NaN),
    },
  ],
};

describe('error-carried-forward marking', () => {
  it('all correct', () => {
    const m = markChain(['10', '2', '20'], chain);
    expect(m.parts).toEqual(['correct', 'correct', 'correct']);
    expect(m.correct).toBe(true);
  });
  it('a wrong first part carries forward: later parts right for the student’s own value are accepted', () => {
    const m = markChain(['12', '2.4', '28.8'], chain);
    expect(m.parts).toEqual(['wrong', 'ecf', 'ecf']);
    expect(m.correct).toBe(false);
    expect(m.feedback).toMatch(/error carried forward/);
  });
  it('a later slip is wrong even with right earlier parts; blanks are wrong', () => {
    expect(markChain(['10', '2', '25'], chain).parts).toEqual(['correct', 'correct', 'wrong']);
    expect(markChain(['', '2', '20'], chain).parts).toEqual(['wrong', 'correct', 'correct']);
  });
});

describe('analytics', () => {
  const q = (id: string, level: Question['level'], outcomeIds: string[]): Question => ({
    id,
    moduleId: 'm',
    kind: 'multiple-choice',
    level,
    outcomeIds,
    stem: id,
    choices: [{ id: 'a', text: 'a' }],
    correctChoiceId: 'a',
    explanation: '',
  });
  const bank = [q('q1', 'beginner', ['m.lo1']), q('q2', 'advanced', ['m.lo1', 'm.lo2'])];
  const outcomes = [
    { id: 'm.lo1', courseLo: 'LO1' as const },
    { id: 'm.lo2', courseLo: 'LO2' as const },
  ];
  const at = (questionId: string, correct: boolean, extra: Partial<Attempt> = {}): Attempt => ({
    questionId,
    seed: null,
    answerGiven: 'a',
    correct,
    answeredAt: '2026-11-15T10:00:00Z',
    ...extra,
  });

  it('bank statistics by level and kind', () => {
    expect(bankStats(bank)).toEqual({
      total: 2,
      byLevel: { beginner: 1, intermediate: 0, advanced: 1 },
      byKind: { 'multiple-choice': 2 },
    });
  });

  it('practice sets are reproducible from the set code and never repeat a question', () => {
    const pool = Array.from({ length: 30 }, (_, i) => i);
    const a = buildPracticeSet(pool, 1234, 10);
    expect(buildPracticeSet(pool, 1234, 10)).toEqual(a);
    expect(new Set(a).size).toBe(10);
    expect(buildPracticeSet(pool, 99, 10)).not.toEqual(a);
    expect(buildPracticeSet(pool, 1, 50)).toHaveLength(30);
  });

  it('scores: auto-marked only, by level and course LO (once per LO); lecturer answers listed latest first', () => {
    const s = scoreSummary(
      [
        at('q1', true),
        at('q2', false),
        at('q2', true),
        at('task.x', true),
        at('q9', false, { marking: 'lecturer', answeredAt: '2026-11-15T09:00:00Z' }),
        at('q8', false, { marking: 'lecturer', answeredAt: '2026-11-15T11:00:00Z' }),
      ],
      bank,
      outcomes,
    );
    expect(s.auto).toEqual({ attempts: 4, correct: 3 });
    expect(s.byLevel.beginner).toEqual({ attempts: 1, correct: 1 });
    expect(s.byLevel.advanced).toEqual({ attempts: 2, correct: 1 });
    expect(s.byCourseLo.LO1).toEqual({ attempts: 3, correct: 2 });
    expect(s.byCourseLo.LO2).toEqual({ attempts: 2, correct: 1 });
    expect(s.lecturer.map((a) => a.questionId)).toEqual(['q8', 'q9']);
    expect(sumTallies([s.auto, s.byLevel.beginner])).toEqual({ attempts: 5, correct: 4 });
    expect(percent(s.auto)).toBe(75);
    expect(Number.isNaN(percent({ attempts: 0, correct: 0 }))).toBe(true);
  });

  it('report summary excludes lecturer answers and lists laboratory tasks after the bank', () => {
    const s = summariseAttempts(
      [at('q1', true), at('m09.design.or', false), at('q9', false, { marking: 'lecturer' })],
      bank,
    );
    expect(s.total).toBe(2);
    expect(s.byQuestion.map((x) => x.questionId)).toEqual(['q1', 'm09.design.or']);
  });

  it('CSV quoting (RFC 4180) and recorded rows in display units', () => {
    expect(csvField('a,b')).toBe('"a,b"');
    expect(csvField('say "hi"')).toBe('"say ""hi"""');
    expect(csvField(Number.NaN)).toBe('');
    expect(toCsv(['x', 'y'], [[1, 'b']])).toBe('x,y\r\n1,b');
    const csv = rowsToCsv(
      [{ time: 1, parameters: { alpha: Math.PI / 2 }, measurements: { v: 2 } }],
      [
        { source: 'parameters', key: 'alpha', label: 'α', unit: '°', scale: 180 / Math.PI },
        { source: 'measurements', key: 'v', label: 'V', unit: 'V' },
        { source: 'measurements', key: 'v', label: 'V', unit: 'V' },
        { source: 'measurements', key: 'missing', label: 'm', unit: '—' },
      ],
    );
    expect(csv).toBe('row,α (°),V (V),m (—)\r\n1,90,2,');
  });
});

describe('every laboratory bank (Milestone 9 completeness)', () => {
  it('all ten laboratories are registered with outcomes; every question’s outcomes exist and map to LO1 or LO2', () => {
    expect(Object.keys(LABS)).toHaveLength(10);
    for (const m of MODULES) {
      const lab = LABS[m.id];
      if (!lab) throw new Error(m.id);
      const ids = new Set(lab.outcomes.map((o) => o.id));
      for (const o of lab.outcomes) expect(['LO1', 'LO2']).toContain(o.courseLo);
      for (const q of lab.questions) {
        expect(q.moduleId).toBe(m.id);
        expect(q.outcomeIds.length).toBeGreaterThan(0);
        for (const id of q.outcomeIds) expect(ids.has(id), `${q.id} → ${id}`).toBe(true);
      }
    }
  });

  it('every laboratory has a lecturer-marked explanation with a marking guide; chain questions accept their own answers for 200 seeds', () => {
    let chains = 0;
    for (const lab of Object.values(LABS)) {
      const ex = lab?.questions.filter((q) => q.kind === 'explanation') ?? [];
      expect(ex.length).toBeGreaterThanOrEqual(1);
      for (const q of ex)
        if (q.kind === 'explanation') expect(q.markingGuide.length).toBeGreaterThanOrEqual(3);
      for (const q of lab?.questions ?? []) {
        if (q.kind !== 'chain') continue;
        chains += 1;
        expect(q.generate(5)).toEqual(expect.objectContaining({ stem: q.generate(5).stem }));
        for (let seed = 0; seed < 200; seed += 1) {
          const inst = q.generate(seed);
          expect(inst.stem).not.toMatch(/NaN|undefined|Infinity/);
          const answers = inst.parts.map((p) => String(p.answer));
          expect(markChain(answers, inst).parts.every((r) => r === 'correct')).toBe(true);
          // Each part's compute reproduces its answer from the true earlier values.
          inst.parts.forEach((p, i) => {
            const v = p.compute(inst.parts.slice(0, i).map((x) => x.answer));
            expect(Math.abs(v - p.answer) / Math.abs(p.answer)).toBeLessThan(1e-9);
          });
        }
      }
    }
    expect(chains).toBe(3);
  });
});
