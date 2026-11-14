/**
 * Stable storage-key objects. `useStoredValue` reloads when its key object
 * changes, so every key comes from here and is created once.
 */
import type { StorageKey } from './types';

export const PROFILE_KEY: StorageKey = { kind: 'profile' };
export const PROGRESS_KEY: StorageKey = { kind: 'progress' };
export const SETTINGS_KEY: StorageKey = { kind: 'settings' };

const cache = new Map<string, StorageKey>();
function cached(id: string, make: () => StorageKey): StorageKey {
  let key = cache.get(id);
  if (!key) {
    key = make();
    cache.set(id, key);
  }
  return key;
}

export function sessionsKey(moduleId: string): StorageKey {
  return cached(`sessions:${moduleId}`, () => ({ kind: 'sessions', moduleId }));
}

export function attemptsKey(moduleId: string): StorageKey {
  return cached(`attempts:${moduleId}`, () => ({ kind: 'attempts', moduleId }));
}

export function reportKey(reportId: string): StorageKey {
  return cached(`report:${reportId}`, () => ({ kind: 'report', reportId }));
}
