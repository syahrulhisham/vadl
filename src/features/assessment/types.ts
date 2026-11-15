/**
 * Assessment contracts (FR-10, FR-11; master instruction section 7).
 *
 * Randomisation is used only to generate question parameters, from a seeded
 * generator, so any question instance can be reproduced from (questionId, seed).
 * It is never used to produce a simulation measurement.
 */

/** The three learning levels (master instruction section 7). */
export type LearningLevel = 'beginner' | 'intermediate' | 'advanced';

export type QuestionKind = 'multiple-choice' | 'calculation' | 'troubleshooting' | 'sequence';

interface QuestionBase {
  /** Stable identifier, unique across all modules, e.g. `m01.q-back-emf-1`. */
  readonly id: string;
  /** Owning module id, e.g. `m01-dc-motor`. */
  readonly moduleId: string;
  readonly kind: QuestionKind;
  readonly level: LearningLevel;
  /** Ids of the module learning outcomes this question assesses (FR-11). At least one. */
  readonly outcomeIds: readonly string[];
}

export interface Choice {
  readonly id: string;
  readonly text: string;
  /** Shown when this choice is selected and it is wrong (FR-10: explanation for each wrong answer). */
  readonly explanationIfChosen?: string;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  readonly kind: 'multiple-choice' | 'troubleshooting';
  readonly stem: string;
  readonly choices: readonly Choice[];
  readonly correctChoiceId: string;
  /** Worked explanation shown after any answer. */
  readonly explanation: string;
}

/** A numerical question instance after its parameters have been drawn from the seed. */
export interface CalculationInstance {
  readonly stem: string;
  /** Correct answer in `unit`, computed by calling the sim-core equation function (never typed by hand). */
  readonly answer: number;
  readonly unit: string;
  /** Accepted relative error, e.g. 0.01 for ±1 %. */
  readonly relativeTolerance: number;
  readonly explanation: string;
}

export interface CalculationQuestion extends QuestionBase {
  readonly kind: 'calculation';
  /** Deterministic: the same seed always produces the same instance. */
  generate(seed: number): CalculationInstance;
}

/**
 * A phase-sequence table instance (course-alignment §5.11: pulse-sequence tables are
 * examined every year). The student fills one row per step: the state of each
 * phase and the rotor angle.
 */
export interface SequenceInstance {
  readonly stem: string;
  readonly phaseLabels: readonly string[];
  /** 'on-off': a phase is off (0) or on (1). 'polarity': current 0, + (1) or − (−1). */
  readonly cellKind: 'on-off' | 'polarity';
  /** Correct cell values, one array per row, computed by the sim-core sequence function. */
  readonly answer: readonly (readonly number[])[];
  /** Correct rotor angle of each row [degrees]. */
  readonly angles: readonly number[];
  /** Accepted angle error [degrees] (§5.11: ±0.5°). */
  readonly angleTolerance: number;
  readonly explanation: string;
}

export interface SequenceQuestion extends QuestionBase {
  readonly kind: 'sequence';
  generate(seed: number): SequenceInstance;
}

/** What the student entered in a sequence table. */
export interface SequenceAnswer {
  readonly cells: readonly (readonly number[])[];
  readonly angles: readonly string[];
}

export type Question = MultipleChoiceQuestion | CalculationQuestion | SequenceQuestion;

/** One recorded answer (stored under `vadl.v1.attempts.<module>`). */
export interface Attempt {
  readonly questionId: string;
  /** Seed used to generate a calculation or sequence instance; `null` for fixed questions. */
  readonly seed: number | null;
  /** Choice id, the numeric answer as entered, or a sequence table as JSON. */
  readonly answerGiven: string;
  readonly correct: boolean;
  /** ISO 8601 timestamp. */
  readonly answeredAt: string;
}
