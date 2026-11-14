/** Shapes of laboratory content held in each module's language file. */
import type { LearningLevel } from '@/features/assessment/types';

export interface LabOutcome {
  readonly id: string;
  /** Course learning outcome it supports (teaching plan): LO1 or LO2. */
  readonly courseLo: 'LO1' | 'LO2';
  readonly text: string;
}

export interface ActivityContent {
  readonly id: string;
  readonly level: LearningLevel;
  readonly guided: boolean;
  readonly title: string;
  readonly outcomeIds: readonly string[];
  readonly steps: readonly string[];
}
