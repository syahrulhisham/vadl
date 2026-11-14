import { describe, expect, it } from 'vitest';
import {
  EMPTY_PROGRESS,
  moduleProgress,
  toggleActivity,
  withModuleProgress,
} from '@/features/progress';

describe('progress helpers (FR-12)', () => {
  it('returns the empty record for an unseen module', () => {
    expect(moduleProgress({}, 'm01')).toEqual(EMPTY_PROGRESS);
  });

  it('toggles an activity on and off', () => {
    const on = toggleActivity(EMPTY_PROGRESS, 'a1');
    expect(on.activitiesCompleted).toEqual(['a1']);
    expect(toggleActivity(on, 'a1').activitiesCompleted).toEqual([]);
  });

  it('changes one module without touching others', () => {
    const r = withModuleProgress(
      { m02: { ...EMPTY_PROGRESS, reportsGenerated: 2 } },
      'm01',
      (m) => ({
        ...m,
        reportsGenerated: m.reportsGenerated + 1,
      }),
    );
    expect(r.m01?.reportsGenerated).toBe(1);
    expect(r.m02?.reportsGenerated).toBe(2);
  });
});
