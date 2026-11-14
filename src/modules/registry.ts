/**
 * The module registry: the single list of laboratories. The dashboard, progress
 * and report features read it; nothing else enumerates modules (NFR-09).
 *
 * Milestone 1: summaries only, every module `planned`. Order and milestone
 * numbers follow the project plan, section 6.
 */
import type { ModuleId, ModuleSummary } from './types';

export const MODULES: readonly ModuleSummary[] = [
  {
    id: 'm01-dc-motor',
    number: 1,
    slug: 'dc-motor-drives',
    titleKey: 'module.m01.title',
    milestone: 4,
    status: 'planned',
  },
  {
    id: 'm02-ac-motor',
    number: 2,
    slug: 'ac-motor-drives',
    titleKey: 'module.m02.title',
    milestone: 5,
    status: 'planned',
  },
  {
    id: 'm03-power-converters',
    number: 3,
    slug: 'power-converters',
    titleKey: 'module.m03.title',
    milestone: 5,
    status: 'planned',
  },
  {
    id: 'm04-stepper',
    number: 4,
    slug: 'stepper-motors',
    titleKey: 'module.m04.title',
    milestone: 6,
    status: 'planned',
  },
  {
    id: 'm05-servo',
    number: 5,
    slug: 'servo-motors',
    titleKey: 'module.m05.title',
    milestone: 6,
    status: 'planned',
  },
  {
    id: 'm06-transmission',
    number: 6,
    slug: 'mechanical-transmission',
    titleKey: 'module.m06.title',
    milestone: 7,
    status: 'planned',
  },
  {
    id: 'm07-cam-follower',
    number: 7,
    slug: 'cam-and-follower',
    titleKey: 'module.m07.title',
    milestone: 7,
    status: 'planned',
  },
  {
    id: 'm08-pneumatics',
    number: 8,
    slug: 'pneumatics',
    titleKey: 'module.m08.title',
    milestone: 8,
    status: 'planned',
  },
  {
    id: 'm09-electro-pneumatics',
    number: 9,
    slug: 'electro-pneumatics',
    titleKey: 'module.m09.title',
    milestone: 8,
    status: 'planned',
  },
  {
    id: 'm10-electrohydraulics',
    number: 10,
    slug: 'electrohydraulics',
    titleKey: 'module.m10.title',
    milestone: 8,
    status: 'planned',
  },
];

/** Look up a module by URL slug. Returns `undefined` for an unknown slug (a user-typed address). */
export function findModuleBySlug(slug: string): ModuleSummary | undefined {
  return MODULES.find((m) => m.slug === slug);
}

/** Look up a module by id. Throws for an unknown id, which indicates a programming error. */
export function getModule(id: ModuleId): ModuleSummary {
  const found = MODULES.find((m) => m.id === id);
  if (!found) throw new Error(`Unknown module id: ${id}`);
  return found;
}
