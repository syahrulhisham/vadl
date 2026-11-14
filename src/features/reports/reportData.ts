/**
 * Pure report assembly. Every number in a report comes from recorded rows or
 * attempts; nothing here creates a measurement (master instruction §8: "Do not
 * invent experimental results").
 */
import type { Attempt, Question } from '@/features/assessment/types';
import type { ResultsColumn } from '@/features/recording';
import type { RecordedRow } from './types';

function columnValue(row: RecordedRow, c: ResultsColumn): number | undefined {
  const raw =
    c.source === 'time'
      ? row.time
      : c.source === 'parameters'
        ? row.parameters[c.key]
        : row.measurements[c.key];
  return raw === undefined ? undefined : raw * (c.scale ?? 1);
}

/** Points for the report graph, sorted by x, skipping rows that lack either value. */
export function graphPoints(
  rows: readonly RecordedRow[],
  x: ResultsColumn,
  y: ResultsColumn,
): { x: number; y: number }[] {
  return rows
    .map((r) => ({ x: columnValue(r, x), y: columnValue(r, y) }))
    .filter((p): p is { x: number; y: number } => p.x !== undefined && p.y !== undefined)
    .sort((a, b) => a.x - b.x);
}

export interface AttemptSummary {
  readonly total: number;
  readonly correct: number;
  /** Per question: attempts, correct attempts, and whether the latest attempt was correct. */
  readonly byQuestion: readonly {
    readonly questionId: string;
    readonly label: string;
    readonly attempts: number;
    readonly correct: number;
    readonly latestCorrect: boolean;
  }[];
}

/** Summarise attempts per question, in bank order, with a short label for each question. */
export function summariseAttempts(
  attempts: readonly Attempt[],
  questions: readonly Question[],
): AttemptSummary {
  const byQuestion = questions
    .map((q, i) => {
      const mine = attempts.filter((a) => a.questionId === q.id);
      return {
        questionId: q.id,
        label: `Question ${i + 1} (${q.level}, ${q.kind})`,
        attempts: mine.length,
        correct: mine.filter((a) => a.correct).length,
        latestCorrect: mine.at(-1)?.correct ?? false,
      };
    })
    .filter((q) => q.attempts > 0);
  return {
    total: attempts.length,
    correct: attempts.filter((a) => a.correct).length,
    byQuestion,
  };
}
