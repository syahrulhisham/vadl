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
import { M02_ACTIVITIES } from './m02-ac-motor/content.en';
import { M02_QUESTIONS } from './m02-ac-motor/questions';
import { M02_REPORT } from './m02-ac-motor/results';
import { M03_ACTIVITIES } from './m03-power-converters/content.en';
import { M03_QUESTIONS } from './m03-power-converters/questions';
import { M03_REPORT } from './m03-power-converters/results';
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
  'm02-ac-motor': {
    Lab: lazy(() => import('./m02-ac-motor/AcMotorLab')),
    report: M02_REPORT,
    questions: M02_QUESTIONS,
    activityCount: M02_ACTIVITIES.length,
  },
  'm03-power-converters': {
    Lab: lazy(() => import('./m03-power-converters/PowerConverterLab')),
    report: M03_REPORT,
    questions: M03_QUESTIONS,
    activityCount: M03_ACTIVITIES.length,
  },
};

export function builtLab(id: string): BuiltLab | undefined {
  return (LABS as Record<string, BuiltLab | undefined>)[id];
}
