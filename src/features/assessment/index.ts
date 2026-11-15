/**
 * Assessment engine: seeded question generation, marking and feedback (FR-10, FR-11).
 * Thin version in Milestone 4 (decision D9), complete in Milestone 9.
 */
export type * from './types';
export { mulberry32, randInt, randStep, pick, newSeed, type Rng } from './rng';
export {
  markCalculation,
  markChoice,
  markSequence,
  markChain,
  type ChainMark,
  markTable,
  emptySequenceAnswer,
  sequenceAnswerText,
  sequenceCellText,
  parseAnswer,
  withinTolerance,
  type MarkResult,
} from './marking';
export { QuestionCard, type QuestionCardProps } from './QuestionCard';
export { SequenceTableInput, type SequenceTableInputProps } from './SequenceTableInput';
export { NumericTableInput } from './NumericTableInput';
export { AssessmentPanel, type AssessmentPanelProps } from './AssessmentPanel';
export {
  bankStats,
  buildPracticeSet,
  csvField,
  isAutoMarked,
  LEVELS,
  percent,
  scoreSummary,
  sumTallies,
  toCsv,
  type OutcomeRef,
  type ScoreSummary,
  type Tally,
} from './analytics';
