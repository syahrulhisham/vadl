/**
 * Course references for each module (docs/course-alignment.md §3), read from the
 * language file so they can be translated. Kept apart from the registry so the
 * registry stays plain data.
 */
import { hasMessage, t } from '@/i18n';
import type { ModuleSummary } from './types';

/** Two-character module key, e.g. `m01`, used in language-file keys. */
export function moduleKey(m: ModuleSummary): string {
  return m.id.slice(0, 3);
}

export function moduleTitle(m: ModuleSummary): string {
  return t(m.titleKey);
}

export function moduleSummary(m: ModuleSummary): string {
  return t(`module.${moduleKey(m)}.summary`);
}

export function moduleChapter(m: ModuleSummary): string {
  return t(`module.${moduleKey(m)}.chapter`);
}

/** The course laboratory linked to this module, or `null` when the course has none. */
export function moduleCourseLab(m: ModuleSummary): string | null {
  const key = `module.${moduleKey(m)}.lab`;
  return hasMessage(key) ? t(key) : null;
}
