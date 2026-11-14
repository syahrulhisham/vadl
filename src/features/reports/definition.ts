import type { ResultsColumn } from '@/features/recording';

/** What a module's laboratory report contains (master instruction §8). */
export interface ReportDefinition {
  readonly moduleId: string;
  readonly title: string;
  readonly objectives: readonly string[];
  readonly equations: readonly string[];
  readonly assumptions: readonly string[];
  /** Parameter columns for section 5 (experimental parameters). */
  readonly parameterColumns: readonly ResultsColumn[];
  /** Measurement columns for section 6 (recorded measurements). */
  readonly measurementColumns: readonly ResultsColumn[];
  /** Graph of recorded rows for section 7: x and y are measurement keys. */
  readonly graph: {
    readonly title: string;
    readonly x: ResultsColumn;
    readonly y: ResultsColumn;
  };
}

/** Student-written parts of a report, stored under `vadl.v1.reports.<moduleId>`. */
export interface ReportDraft {
  readonly discussion: string;
  readonly conclusion: string;
  /** ISO 8601 time of the last edit, or null. */
  readonly updatedAt: string | null;
}

export const EMPTY_DRAFT: ReportDraft = { discussion: '', conclusion: '', updatedAt: null };
