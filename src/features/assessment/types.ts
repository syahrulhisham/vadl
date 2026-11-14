/**
 * Assessment contracts (FR-10, FR-11; master instruction section 7).
 *
 * Randomisation is used only to generate question parameters, from a seeded
 * generator, so any question instance can be reproduced from (questionId, seed).
 * It is never used to produce a simulation measurement.
 */

/** The three learning levels (master instruction section 7). */
export type LearningLevel = 'beginner' | 'intermediate' | 'advanced';

export type QuestionKind = 'multiple-choice' | 'calculation' | 'troubleshooting';

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

export type Question = MultipleChoiceQuestion | CalculationQuestion;

/** One recorded answer (stored under `vadl.v1.attempts.<module>`). */
export interface Attempt {
  readonly questionId: string;
  /** Seed used to generate a calculation instance; `null` for fixed questions. */
  readonly seed: number | null;
  /** Choice id, or the numeric answer given, as entered. */
  readonly answerGiven: string;
  readonly correct: boolean;
  /** ISO 8601 timestamp. */
  readonly answeredAt: string;
}
