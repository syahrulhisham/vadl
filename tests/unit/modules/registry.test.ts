import { describe, expect, it } from 'vitest';
import { en } from '@/i18n/en';
import { getModule, MODULES } from '@/modules/registry';

describe('module registry', () => {
  it('registers exactly ten modules', () => {
    expect(MODULES).toHaveLength(10);
  });

  it('uses unique ids and unique slugs', () => {
    expect(new Set(MODULES.map((m) => m.id)).size).toBe(10);
    expect(new Set(MODULES.map((m) => m.slug)).size).toBe(10);
  });

  it('numbers the modules 1 to 10 in order (master instruction section 4)', () => {
    expect(MODULES.map((m) => m.number)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
  });

  it('prefixes each id with its two-digit module number', () => {
    for (const m of MODULES) {
      expect(m.id.startsWith(`m${String(m.number).padStart(2, '0')}-`)).toBe(true);
    }
  });

  it('assigns each module to a laboratory milestone between 4 and 8 (plan section 6)', () => {
    for (const m of MODULES) {
      expect(m.milestone).toBeGreaterThanOrEqual(4);
      expect(m.milestone).toBeLessThanOrEqual(8);
    }
  });

  it('has an English title for every module', () => {
    for (const m of MODULES) {
      expect(en).toHaveProperty([m.titleKey]);
    }
  });

  it('looks modules up by id and rejects unknown ids', () => {
    expect(getModule('m05-servo').number).toBe(5);
    // @ts-expect-error deliberately invalid id
    expect(() => getModule('m11-unknown')).toThrow(/Unknown module id/);
  });
});
