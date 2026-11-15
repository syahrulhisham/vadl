import { useEffect } from 'react';
import {
  moduleProgress,
  toggleActivity,
  withModuleProgress,
  type ProgressRecord,
} from '@/features/progress';
import type { ExperimentSession, RecordedRow } from '@/features/reports';
import { useStoredValue } from '@/hooks';
import { PROGRESS_KEY, sessionsKey } from '@/storage';

/**
 * Shared laboratory storage: the current session's recorded rows, completed
 * activities, and "last opened". Every laboratory uses this, so recording and
 * progress behave identically across modules (FR-08, FR-12).
 */
export function useLabRecords(moduleId: string) {
  const sessions = useStoredValue<ExperimentSession[]>(sessionsKey(moduleId), []);
  const progress = useStoredValue<ProgressRecord>(PROGRESS_KEY, {});
  const progressLoaded = progress.loaded;
  const updateProgress = progress.update;

  useEffect(() => {
    if (progressLoaded) {
      updateProgress((r) =>
        withModuleProgress(r, moduleId, (m) => ({ ...m, lastOpened: new Date().toISOString() })),
      );
    }
  }, [progressLoaded, updateProgress, moduleId]);

  function record(row: RecordedRow) {
    sessions.update((list) => {
      const last = list.at(-1);
      if (!last) {
        return [
          {
            id: `${moduleId}-session-1`,
            moduleId,
            activityId: `${moduleId}.free`,
            startedAt: new Date().toISOString(),
            rows: [row],
          },
        ];
      }
      return [...list.slice(0, -1), { ...last, rows: [...last.rows, row] }];
    });
  }

  function clear() {
    sessions.update((list) => {
      const last = list.at(-1);
      return last ? [...list.slice(0, -1), { ...last, rows: [] }] : list;
    });
  }

  function toggle(activityId: string) {
    progress.update((r) => withModuleProgress(r, moduleId, (m) => toggleActivity(m, activityId)));
  }

  return {
    rows: sessions.value.at(-1)?.rows ?? [],
    record,
    clear,
    done: moduleProgress(progress.value, moduleId).activitiesCompleted,
    toggleActivity: toggle,
  };
}
