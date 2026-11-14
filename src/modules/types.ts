/**
 * Module definition contract (NFR-09: a laboratory is added by registering one
 * definition object; shared code is not edited).
 *
 * Milestone 1 registers only `ModuleSummary` for each of the ten laboratories.
 * The full `ModuleDefinition` is filled in module by module from Milestone 4.
 */
import type { ComponentType } from 'react';
import type { LearningLevel, Question } from '@/features/assessment/types';

/** Module ids, in the order of master instruction section 4. */
export type ModuleId =
  | 'm01-dc-motor'
  | 'm02-ac-motor'
  | 'm03-power-converters'
  | 'm04-stepper'
  | 'm05-servo'
  | 'm06-transmission'
  | 'm07-cam-follower'
  | 'm08-pneumatics'
  | 'm09-electro-pneumatics'
  | 'm10-electrohydraulics';

/** Development status shown on the dashboard. */
export type ModuleStatus = 'planned' | 'in-development' | 'available';

/** Dashboard-level metadata available for every module from Milestone 1. */
export interface ModuleSummary {
  readonly id: ModuleId;
  /** 1 to 10, matching master instruction section 4. */
  readonly number: number;
  /** URL path segment, e.g. `dc-motor-drives`. */
  readonly slug: string;
  /** Key into the language file for the module title (decision D5). */
  readonly titleKey: string;
  /** The milestone in which the laboratory is built (plan section 6). */
  readonly milestone: number;
  readonly status: ModuleStatus;
}

/**
 * A learning outcome. Marked provisional until checked against BELK 3423 course
 * materials (decision D2); the UI shows the provisional flag.
 */
export interface LearningOutcome {
  readonly id: string;
  readonly text: string;
  readonly provisional: boolean;
}

/** An adjustable parameter (FR-05). Limits are SI; `displayUnit` is converted by sim-core/units. */
export interface ControlDefinition {
  readonly key: string;
  readonly labelKey: string;
  readonly siUnit: string;
  readonly displayUnit: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

/** A displayed measurement (FR-06). The value always comes from a model output with the same key. */
export interface MeasurementDefinition {
  readonly key: string;
  readonly labelKey: string;
  readonly siUnit: string;
  readonly displayUnit: string;
  readonly significantFigures: number;
}

export type GraphKind = 'time-trace' | 'characteristic';

/** A graph (FR-07): either a time trace or a characteristic curve with the operating point marked. */
export interface GraphDefinition {
  readonly id: string;
  readonly kind: GraphKind;
  readonly titleKey: string;
  /** Measurement or parameter key on the x axis (`time` for traces). */
  readonly x: string;
  /** Measurement keys on the y axis. */
  readonly y: readonly string[];
}

/** A guided or independent experiment (FR-03, master instruction sections 3 J and 7). */
export interface ActivityDefinition {
  readonly id: string;
  readonly titleKey: string;
  readonly level: LearningLevel;
  readonly guided: boolean;
  /** Ordered procedure step keys. */
  readonly stepKeys: readonly string[];
  /** Outcomes the activity supports. */
  readonly outcomeIds: readonly string[];
}

/** Lazily loaded UI parts, so each laboratory is its own bundle. */
export interface ModuleViews {
  readonly loadTheory: () => Promise<{ default: ComponentType }>;
  readonly loadWorkspace: () => Promise<{ default: ComponentType }>;
}

/** Everything a laboratory provides. The dashboard, progress and report features read only this. */
export interface ModuleDefinition extends ModuleSummary {
  readonly outcomes: readonly LearningOutcome[];
  /** Id of the sim-core model this module runs. */
  readonly modelId: string;
  readonly controls: readonly ControlDefinition[];
  readonly measurements: readonly MeasurementDefinition[];
  readonly graphs: readonly GraphDefinition[];
  readonly activities: readonly ActivityDefinition[];
  readonly questions: readonly Question[];
  readonly views: ModuleViews;
}
