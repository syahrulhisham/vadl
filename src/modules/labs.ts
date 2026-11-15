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
import { M04_ACTIVITIES } from './m04-stepper/content.en';
import { M04_QUESTIONS } from './m04-stepper/questions';
import { M04_REPORT } from './m04-stepper/results';
import { M05_ACTIVITIES } from './m05-servo/content.en';
import { M05_QUESTIONS } from './m05-servo/questions';
import { M05_REPORT } from './m05-servo/results';
import { M06_ACTIVITIES } from './m06-transmission/content.en';
import { M06_QUESTIONS } from './m06-transmission/questions';
import { M06_REPORT } from './m06-transmission/results';
import { M07_ACTIVITIES } from './m07-cam-follower/content.en';
import { M07_QUESTIONS } from './m07-cam-follower/questions';
import { M07_REPORT } from './m07-cam-follower/results';
import { M08_ACTIVITIES } from './m08-pneumatics/content.en';
import { M08_QUESTIONS } from './m08-pneumatics/questions';
import { M08_REPORT } from './m08-pneumatics/results';
import { M09_ACTIVITIES } from './m09-electro-pneumatics/content.en';
import { M09_QUESTIONS } from './m09-electro-pneumatics/questions';
import { M09_REPORT } from './m09-electro-pneumatics/results';
import { M10_ACTIVITIES } from './m10-electrohydraulics/content.en';
import { M10_QUESTIONS } from './m10-electrohydraulics/questions';
import { M10_REPORT } from './m10-electrohydraulics/results';
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
  'm04-stepper': {
    Lab: lazy(() => import('./m04-stepper/StepperLab')),
    report: M04_REPORT,
    questions: M04_QUESTIONS,
    activityCount: M04_ACTIVITIES.length,
  },
  'm05-servo': {
    Lab: lazy(() => import('./m05-servo/ServoLab')),
    report: M05_REPORT,
    questions: M05_QUESTIONS,
    activityCount: M05_ACTIVITIES.length,
  },
  'm06-transmission': {
    Lab: lazy(() => import('./m06-transmission/TransmissionLab')),
    report: M06_REPORT,
    questions: M06_QUESTIONS,
    activityCount: M06_ACTIVITIES.length,
  },
  'm07-cam-follower': {
    Lab: lazy(() => import('./m07-cam-follower/CamLab')),
    report: M07_REPORT,
    questions: M07_QUESTIONS,
    activityCount: M07_ACTIVITIES.length,
  },
  'm08-pneumatics': {
    Lab: lazy(() => import('./m08-pneumatics/PneumaticsLab')),
    report: M08_REPORT,
    questions: M08_QUESTIONS,
    activityCount: M08_ACTIVITIES.length,
  },
  'm09-electro-pneumatics': {
    Lab: lazy(() => import('./m09-electro-pneumatics/ElectroPneumaticsLab')),
    report: M09_REPORT,
    questions: M09_QUESTIONS,
    activityCount: M09_ACTIVITIES.length,
  },
  'm10-electrohydraulics': {
    Lab: lazy(() => import('./m10-electrohydraulics/HydraulicsLab')),
    report: M10_REPORT,
    questions: M10_QUESTIONS,
    activityCount: M10_ACTIVITIES.length,
  },
};

export function builtLab(id: string): BuiltLab | undefined {
  return (LABS as Record<string, BuiltLab | undefined>)[id];
}
