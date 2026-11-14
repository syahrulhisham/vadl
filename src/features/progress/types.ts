/** Per-module progress stored under `vadl.v1.progress` (FR-12). */
export interface ModuleProgress {
  /** Ids of activities the student marked as completed. */
  readonly activitiesCompleted: readonly string[];
  /** Times a report was printed or saved as PDF. */
  readonly reportsGenerated: number;
  /** ISO 8601 time the laboratory was last opened, or null. */
  readonly lastOpened: string | null;
}

export type ProgressRecord = Readonly<Record<string, ModuleProgress>>;

export const EMPTY_PROGRESS: ModuleProgress = {
  activitiesCompleted: [],
  reportsGenerated: 0,
  lastOpened: null,
};

/** Progress for one module, or the empty record. */
export function moduleProgress(record: ProgressRecord, moduleId: string): ModuleProgress {
  return record[moduleId] ?? EMPTY_PROGRESS;
}

/** Record with one module's progress changed. */
export function withModuleProgress(
  record: ProgressRecord,
  moduleId: string,
  change: (p: ModuleProgress) => ModuleProgress,
): ProgressRecord {
  return { ...record, [moduleId]: change(moduleProgress(record, moduleId)) };
}

/** Toggle an activity's completed state. */
export function toggleActivity(p: ModuleProgress, activityId: string): ModuleProgress {
  const done = p.activitiesCompleted.includes(activityId);
  return {
    ...p,
    activitiesCompleted: done
      ? p.activitiesCompleted.filter((a) => a !== activityId)
      : [...p.activitiesCompleted, activityId],
  };
}
