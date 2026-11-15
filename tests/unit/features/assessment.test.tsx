// @vitest-environment jsdom
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import {
  AssessmentPanel,
  markCalculation,
  markChoice,
  mulberry32,
  parseAnswer,
  pick,
  QuestionCard,
  randInt,
  randStep,
  withinTolerance,
  type CalculationInstance,
  type MultipleChoiceQuestion,
} from '@/features/assessment';
import { M01_QUESTIONS } from '@/modules/m01-dc-motor/questions';

describe('seeded generator', () => {
  it('is reproducible: the same seed gives the same sequence', () => {
    const a = mulberry32(42);
    const b = mulberry32(42);
    const seqA = Array.from({ length: 5 }, () => a());
    expect(Array.from({ length: 5 }, () => b())).toEqual(seqA);
    expect(seqA.every((v) => v >= 0 && v < 1)).toBe(true);
    expect(mulberry32(43)()).not.toBe(seqA[0]);
  });

  it('draws integers, steps and list items inside their ranges', () => {
    const rng = mulberry32(7);
    for (let i = 0; i < 200; i += 1) {
      const n = randInt(rng, 3, 5);
      expect(n >= 3 && n <= 5 && Number.isInteger(n)).toBe(true);
      const s = randStep(rng, 0.2, 0.8, 0.05);
      expect(s).toBeGreaterThanOrEqual(0.2);
      expect(s).toBeLessThanOrEqual(0.8);
      expect(Math.round(s / 0.05) * 0.05).toBeCloseTo(s, 10);
      expect(['x', 'y']).toContain(pick(rng, ['x', 'y']));
    }
    expect(() => pick(rng, [])).toThrow(RangeError);
  });
});

describe('marking', () => {
  const inst: CalculationInstance = {
    stem: 's',
    answer: 1671.127,
    unit: 'rpm',
    relativeTolerance: 0.02,
    explanation: 'because',
  };

  it('parses numbers with spaces, thousands commas and e-notation', () => {
    expect(parseAnswer(' 1,671.1 ')).toBeCloseTo(1671.1, 9);
    expect(parseAnswer('1.6711e3')).toBeCloseTo(1671.1, 9);
    expect(parseAnswer('+42')).toBe(42);
    expect(parseAnswer('12 V')).toBeNaN();
    expect(parseAnswer('')).toBeNaN();
  });

  it('accepts answers within ±2 % and rejects others', () => {
    expect(withinTolerance(1700, 1671.127, 0.02)).toBe(true);
    expect(withinTolerance(1710, 1671.127, 0.02)).toBe(false);
    expect(markCalculation('1671', inst).correct).toBe(true);
    expect(markCalculation('1671', inst).feedback).toMatch(/Correct: 1671 rpm/);
    const wrong = markCalculation('1500', inst);
    expect(wrong.correct).toBe(false);
    expect(wrong.feedback).toMatch(/The answer is 1671 rpm/);
    expect(wrong.explanation).toBe('because');
  });

  it('gives targeted hints for unit and sign mistakes', () => {
    expect(markCalculation('175', inst).feedback).toMatch(/rad\/s or rpm/);
    expect(markCalculation('1.671', inst).feedback).toMatch(/factor of 1000/);
    expect(markCalculation('-1671', inst).feedback).toMatch(/sign/);
    expect(markCalculation('abc', inst).feedback).toBe('Enter a number, without the unit.');
  });

  it('marks multiple choice with the explanation for the chosen wrong answer', () => {
    const q = M01_QUESTIONS.find(
      (x) => x.id === 'm01.mcq.dual-converter',
    ) as MultipleChoiceQuestion;
    expect(markChoice(q, 'c').correct).toBe(true);
    const wrong = markChoice(q, 'a');
    expect(wrong.correct).toBe(false);
    expect(wrong.feedback).toMatch(/one quadrant/);
    expect(wrong.feedback).toMatch(/Dual converter/);
    expect(markChoice(q, 'z').feedback).toBe('Choose an answer.');
  });
});

describe('M01 question bank', () => {
  it('has unique ids, every level, and every question tagged with an outcome', () => {
    expect(new Set(M01_QUESTIONS.map((q) => q.id)).size).toBe(M01_QUESTIONS.length);
    expect(new Set(M01_QUESTIONS.map((q) => q.level))).toEqual(
      new Set(['beginner', 'intermediate', 'advanced']),
    );
    expect(new Set(M01_QUESTIONS.map((q) => q.kind))).toEqual(
      new Set(['multiple-choice', 'calculation', 'troubleshooting']),
    );
    for (const q of M01_QUESTIONS) {
      expect(q.moduleId).toBe('m01-dc-motor');
      expect(q.outcomeIds.length).toBeGreaterThan(0);
      expect(q.outcomeIds.every((o) => /^m01\.lo[1-4]$/.test(o))).toBe(true);
    }
  });

  it('every multiple-choice question has its correct answer among the choices and explanations for wrong ones', () => {
    for (const q of M01_QUESTIONS) {
      if (q.kind === 'calculation' || q.kind === 'sequence') continue;
      expect(q.choices.some((c) => c.id === q.correctChoiceId)).toBe(true);
      for (const c of q.choices) {
        if (c.id !== q.correctChoiceId) expect(c.explanationIfChosen).toBeTruthy();
      }
    }
  });

  it('calculation questions are reproducible from the seed and give physical answers over 200 seeds', () => {
    for (const q of M01_QUESTIONS) {
      if (q.kind !== 'calculation') continue;
      expect(q.generate(123)).toEqual(q.generate(123));
      for (let seed = 0; seed < 200; seed += 1) {
        const inst = q.generate(seed);
        expect(Number.isFinite(inst.answer)).toBe(true);
        expect(inst.answer).toBeGreaterThan(0);
        expect(inst.relativeTolerance).toBe(0.02);
        expect(inst.stem).not.toMatch(/NaN|undefined|Infinity/);
        // The worked explanation ends at the same number the marker accepts.
        expect(markCalculation(String(inst.answer), inst).correct).toBe(true);
      }
    }
  });

  it('the speed calculation matches an independent hand formula', () => {
    const q = M01_QUESTIONS.find((x) => x.id === 'm01.calc.speed');
    if (q?.kind !== 'calculation') throw new Error('missing');
    const inst = q.generate(2026);
    const nums = (inst.stem.match(/\d+(\.\d+)?/g) ?? []).map(Number);
    // Stem order: Ra, Kv·If, Va, TL
    const [ra, k, va, tl] = nums as [number, number, number, number];
    const ia = tl / k;
    const rpm = ((va - ia * ra) / k) * (60 / (2 * Math.PI));
    expect(inst.answer).toBeCloseTo(rpm, 6);
  });
});

describe('QuestionCard and AssessmentPanel', () => {
  const q = M01_QUESTIONS.find((x) => x.id === 'm01.calc.starting-resistance');
  if (q?.kind !== 'calculation') throw new Error('missing');

  it('checks a calculation answer, shows feedback and the explanation, and reports the attempt', () => {
    const onAttempt = vi.fn();
    render(<QuestionCard question={q} number={1} onAttempt={onAttempt} initialSeed={5} />);
    const inst = q.generate(5);
    fireEvent.change(screen.getByLabelText(/Your answer \(Ω\)/), {
      target: { value: String(inst.answer) },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    expect(screen.getByRole('status')).toHaveTextContent('Correct');
    expect(screen.getByRole('status')).toHaveTextContent('Explanation');
    expect(onAttempt).toHaveBeenCalledWith(
      expect.objectContaining({ questionId: q.id, seed: 5, correct: true }),
    );
  });

  it('new numbers clears the answer and feedback', () => {
    render(<QuestionCard question={q} number={1} onAttempt={vi.fn()} initialSeed={5} />);
    fireEvent.change(screen.getByLabelText(/Your answer/), { target: { value: '1' } });
    fireEvent.click(screen.getByRole('button', { name: 'Check answer' }));
    fireEvent.click(screen.getByRole('button', { name: 'New numbers' }));
    expect(screen.queryByRole('status')).toBeNull();
    expect(screen.getByLabelText(/Your answer/)).toHaveValue('');
  });

  it('the panel filters by level and counts saved attempts', async () => {
    render(<AssessmentPanel moduleId="m01-dc-motor" questions={M01_QUESTIONS} />);
    expect(screen.getAllByRole('article')).toHaveLength(M01_QUESTIONS.length);
    fireEvent.change(screen.getByLabelText('Show questions for level'), {
      target: { value: 'advanced' },
    });
    const advanced = M01_QUESTIONS.filter((x) => x.level === 'advanced').length;
    expect(screen.getAllByRole('article')).toHaveLength(advanced);
    const first = screen.getAllByRole('article')[0] as HTMLElement;
    fireEvent.click(first.querySelector('input[type="radio"], input[type="text"]') as HTMLElement);
    const radio = first.querySelector('input[type="radio"]');
    if (!radio)
      fireEvent.change(first.querySelector('input') as HTMLElement, { target: { value: '1' } });
    fireEvent.click(screen.getAllByRole('button', { name: 'Check answer' })[0] as HTMLElement);
    expect(await screen.findByText(/in this browser: \d of 1 attempts/)).toBeInTheDocument();
  });
});
