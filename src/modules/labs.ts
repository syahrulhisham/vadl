/**
 * Laboratories that have been built, keyed by module id. Adding a laboratory =
 * adding one entry here plus its registry status (NFR-09). The laboratory UI is
 * loaded lazily; its report definition, questions and activity count are small
 * data used by the report, progress and assessment areas.
 */
import { lazy, type ComponentType, type LazyExoticComponent } from 'react';
import type { Question } from '@/features/assessment/types';
import type { ReportDefinition } from '@/features/reports/definition';
import { M01_ACTIVITIES } from './m01-dc-motor/content.en';
import { M01_QUESTIONS } from './m01-dc-motor/questions';
import { M01_REPORT } from './m01-dc-motor/report';
import type { ModuleId } from './types';

export interface BuiltLab {
  readonly Lab: LazyExoticComponent<ComponentType>;
  readonly report: ReportDefinition;
  readonly questions: readonly Question[];
  readonly activityCount: number;
}

export const LABS: Partial<Record<ModuleId, BuiltLab>> = {
  'm01-dc-motor': {
    Lab: lazy(() => import('./m01-dc-motor/DcMotorLab')),
    report: M01_REPORT,
    questions: M01_QUESTIONS,
    activityCount: M01_ACTIVITIES.length,
  },
};

export function builtLab(id: string): BuiltLab | undefined {
  return (LABS as Record<string, BuiltLab | undefined>)[id];
}
