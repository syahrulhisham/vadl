/**
 * Laboratory report contracts (FR-13; master instruction section 8; decision D10).
 *
 * "Recorded data only": a report references measurement rows the student
 * recorded and attempts the student made. It holds no field through which the
 * report generator could create a measurement of its own.
 */
import type { Attempt } from '@/features/assessment/types';

/** Student identification fields approved in decision D10. Entered by the student; never transmitted. */
export interface StudentIdentification {
  readonly name: string;
  readonly matricNumber: string;
  readonly programme: string;
  readonly section: string;
  readonly lecturerName: string;
  /** ISO 8601 date (YYYY-MM-DD). */
  readonly date: string;
}

/** One row of the results table: values the simulation produced at the moment the student pressed Record. */
export interface RecordedRow {
  /** Simulation time of the row, s. */
  readonly time: number;
  /** Parameter values in force when the row was recorded, SI units, keyed by parameter key. */
  readonly parameters: Readonly<Record<string, number>>;
  /** Measurement values, SI units, keyed by measurement key. */
  readonly measurements: Readonly<Record<string, number>>;
}

/** One experiment run (stored under `vadl.v1.sessions.<module>`). */
export interface ExperimentSession {
  readonly id: string;
  readonly moduleId: string;
  readonly activityId: string;
  /** ISO 8601 timestamp. */
  readonly startedAt: string;
  readonly rows: readonly RecordedRow[];
}

/**
 * A report is assembled from module content, sessions and attempts. Only the
 * discussion and conclusion are written by the student. Graphs are regenerated
 * from the recorded sessions, not stored.
 */
export interface LabReport {
  readonly id: string;
  readonly moduleId: string;
  readonly student: StudentIdentification;
  readonly sessionIds: readonly string[];
  readonly attempts: readonly Attempt[];
  readonly discussion: string;
  readonly conclusion: string;
  /** ISO 8601 timestamps. */
  readonly createdAt: string;
  readonly updatedAt: string;
}

/**
 * The ten report sections in master instruction section 8, in order. The
 * report renderer must produce exactly these sections.
 */
export const REPORT_SECTIONS = [
  'student-identification',
  'experiment-title',
  'learning-objectives',
  'theory-and-equations',
  'experimental-parameters',
  'recorded-measurements',
  'generated-graphs',
  'analysis-and-discussion',
  'conclusion',
  'assessment-results',
] as const;

export type ReportSection = (typeof REPORT_SECTIONS)[number];
