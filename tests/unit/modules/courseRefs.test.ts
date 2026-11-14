import { describe, expect, it } from 'vitest';
import { hasMessage } from '@/i18n';
import {
  moduleChapter,
  moduleCourseLab,
  moduleKey,
  moduleSummary,
  moduleTitle,
} from '@/modules/courseRefs';
import { findModuleBySlug, getModule, MODULES } from '@/modules/registry';

describe('course references (docs/course-alignment.md §3)', () => {
  it('every module has a title, summary and chapter in the language file', () => {
    for (const m of MODULES) {
      const k = moduleKey(m);
      expect(hasMessage(`module.${k}.summary`)).toBe(true);
      expect(hasMessage(`module.${k}.chapter`)).toBe(true);
      expect(moduleTitle(m)).not.toBe(m.titleKey);
      expect(moduleSummary(m).length).toBeGreaterThan(10);
      expect(moduleChapter(m)).toMatch(/^Chapter \d/);
    }
  });

  it('links the five course laboratories to the approved modules', () => {
    const labs = Object.fromEntries(MODULES.map((m) => [m.id, moduleCourseLab(m)]));
    expect(labs['m03-power-converters']).toMatch(/^Lab 1/);
    expect(labs['m08-pneumatics']).toMatch(/^Lab 2/);
    expect(labs['m09-electro-pneumatics']).toMatch(/^Lab 3/);
    expect(labs['m10-electrohydraulics']).toMatch(/Labs 4 and 5/);
    expect(labs['m01-dc-motor']).toMatch(/Lab 1/);
    expect(labs['m02-ac-motor']).toBeNull();
    expect(labs['m05-servo']).toBeNull();
  });

  it('finds modules by slug and returns undefined for unknown slugs', () => {
    expect(findModuleBySlug('stepper-motors')).toBe(getModule('m04-stepper'));
    expect(findModuleBySlug('warp-drive')).toBeUndefined();
  });
});
