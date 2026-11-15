/**
 * Pure assessment analytics (FR-10 to FR-12): bank statistics, reproducible
 * practice sets and score summaries. Scores count only automatically marked
 * answers; explanations marked by the lecturer are listed separately (D11:
 * self-study scores only).
 */
import { mulberry32 } from './rng';
import type { Attempt, LearningLevel, Question, QuestionKind } from './types';

export const LEVELS: readonly LearningLevel[] = ['beginner', 'intermediate', 'advanced'];

/** The minimum an outcome needs here: its id and the course learning outcome it supports. */
export interface OutcomeRef {
  readonly id: string;
  readonly courseLo: 'LO1' | 'LO2';
}

export interface Tally {
  readonly attempts: number;
  readonly correct: number;
}

const EMPTY: Tally = { attempts: 0, correct: 0 };
const add = (t: Tally, correct: boolean): Tally => ({
  attempts: t.attempts + 1,
  correct: t.correct + (correct ? 1 : 0),
});

/** Number of questions by level and by kind. */
export function bankStats(questions: readonly Question[]) {
  const byLevel = Object.fromEntries(LEVELS.map((l) => [l, 0])) as Record<LearningLevel, number>;
  const byKind: Partial<Record<QuestionKind, number>> = {};
  for (const q of questions) {
    byLevel[q.level] += 1;
    byKind[q.kind] = (byKind[q.kind] ?? 0) + 1;
  }
  return { total: questions.length, byLevel, byKind };
}

/**
 * A practice set: `count` questions drawn without repetition from the pool by a
 * seeded shuffle, so the same set code always gives the same questions in the
 * same order (a lecturer can hand out one code to a class).
 */
export function buildPracticeSet<T>(pool: readonly T[], seed: number, count: number): T[] {
  const rng = mulberry32(seed);
  const items = [...pool];
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j] as T, items[i] as T];
  }
  return items.slice(0, Math.max(0, Math.min(count, items.length)));
}

/** True for answers VADL marks itself (everything except lecturer-marked explanations). */
export function isAutoMarked(a: Attempt): boolean {
  return a.marking !== 'lecturer';
}

export interface ScoreSummary {
  /** Automatically marked answers only. */
  readonly auto: Tally;
  readonly byLevel: Readonly<Record<LearningLevel, Tally>>;
  readonly byCourseLo: Readonly<Record<'LO1' | 'LO2', Tally>>;
  /** Answers awaiting the lecturer, latest first. */
  readonly lecturer: readonly Attempt[];
}

/**
 * Summarise attempts against a question bank and its outcomes. An answer counts
 * towards every course LO its question's outcomes support (once per LO).
 * Attempts at questions not in the bank (e.g. design tasks) count in `auto` only.
 */
export function scoreSummary(
  attempts: readonly Attempt[],
  questions: readonly Question[],
  outcomes: readonly OutcomeRef[],
): ScoreSummary {
  const byId = new Map(questions.map((q) => [q.id, q]));
  const loOf = new Map(outcomes.map((o) => [o.id, o.courseLo]));
  let auto = EMPTY;
  const byLevel = { beginner: EMPTY, intermediate: EMPTY, advanced: EMPTY };
  const byCourseLo = { LO1: EMPTY, LO2: EMPTY };
  const lecturer: Attempt[] = [];
  for (const a of attempts) {
    if (!isAutoMarked(a)) {
      lecturer.push(a);
      continue;
    }
    auto = add(auto, a.correct);
    const q = byId.get(a.questionId);
    if (!q) continue;
    byLevel[q.level] = add(byLevel[q.level], a.correct);
    const los = new Set(q.outcomeIds.map((id) => loOf.get(id)).filter((x) => x !== undefined));
    for (const lo of los) byCourseLo[lo] = add(byCourseLo[lo], a.correct);
  }
  lecturer.sort((x, y) => y.answeredAt.localeCompare(x.answeredAt));
  return { auto, byLevel, byCourseLo, lecturer };
}

/** Add tallies (e.g. across modules). */
export function sumTallies(tallies: readonly Tally[]): Tally {
  return tallies.reduce(
    (s, t) => ({ attempts: s.attempts + t.attempts, correct: s.correct + t.correct }),
    EMPTY,
  );
}

/** Percentage correct, or NaN with no attempts (shown as a dash). */
export function percent(t: Tally): number {
  return t.attempts === 0 ? Number.NaN : (100 * t.correct) / t.attempts;
}

/** Quote a field for CSV (RFC 4180). */
export function csvField(v: string | number): string {
  const s = typeof v === 'number' ? (Number.isFinite(v) ? String(v) : '') : v;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** CSV text from a header and rows. */
export function toCsv(
  header: readonly string[],
  rows: readonly (readonly (string | number)[])[],
): string {
  return [header, ...rows].map((r) => r.map(csvField).join(',')).join('\r\n');
}
