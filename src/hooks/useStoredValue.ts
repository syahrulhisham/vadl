import { useCallback, useEffect, useRef, useState } from 'react';
import { useRepository, type Repository, type StorageKey } from '@/storage';

type Change<T> = (previous: T) => T;
type Listener = (value: unknown) => void;

/**
 * Hook instances that show the same stored value (same repository and key
 * object) on one page. A change made through one is passed to the others, so
 * two components holding the same list (e.g. a laboratory's assessment panel
 * and its design tasks) never overwrite each other's additions.
 */
const listeners = new WeakMap<Repository, Map<StorageKey, Set<Listener>>>();

function peers(repository: Repository, key: StorageKey): Set<Listener> {
  let byKey = listeners.get(repository);
  if (!byKey) {
    byKey = new Map();
    listeners.set(repository, byKey);
  }
  let set = byKey.get(key);
  if (!set) {
    set = new Set();
    byKey.set(key, set);
  }
  return set;
}

/**
 * A value persisted through the repository. `key` must be a stable object
 * (define it once at module level), because the value is reloaded when the key
 * object changes.
 *
 * `update` applies a change immediately. Changes made before the stored value
 * has loaded are queued and replayed on top of it when it arrives, so a fast
 * click can neither be lost nor overwrite earlier saved data. Instances with the
 * same key share every change.
 */
export function useStoredValue<T>(key: StorageKey, initial: T) {
  const { repository } = useRepository();
  const [fallback] = useState(initial);
  const [state, setState] = useState<{ key: StorageKey; value: T; loaded: boolean }>({
    key,
    value: initial,
    loaded: false,
  });
  /** Changes waiting for the load to finish (read and written only in callbacks and effects). */
  const pending = useRef<Change<T>[]>([]);
  const loadedKey = useRef<StorageKey | null>(null);
  /** The latest value of this key, for computing the next change outside a state updater. */
  const latest = useRef<T>(initial);
  const self = useRef<Listener | null>(null);

  useEffect(() => {
    let cancelled = false;
    loadedKey.current = null;
    pending.current = [];
    const listener: Listener = (value) => {
      if (loadedKey.current !== key) return;
      latest.current = value as T;
      setState({ key, value: value as T, loaded: true });
    };
    self.current = listener;
    const group = peers(repository, key);
    group.add(listener);
    void repository.get<T>(key).then((stored) => {
      if (cancelled) return;
      const queued = pending.current;
      pending.current = [];
      loadedKey.current = key;
      const value = queued.reduce((v, change) => change(v), stored ?? fallback);
      latest.current = value;
      if (queued.length > 0) {
        void repository.set(key, value);
        for (const other of group) if (other !== listener) other(value);
      }
      setState({ key, value, loaded: true });
    });
    return () => {
      cancelled = true;
      group.delete(listener);
    };
  }, [repository, key, fallback]);

  const update = useCallback(
    (change: Change<T>) => {
      if (loadedKey.current !== key) {
        // Not loaded yet: show the change now, apply it to the stored value on load.
        pending.current.push(change);
        setState((s) => ({ ...s, value: change(s.value) }));
        return;
      }
      const value = change(latest.current);
      latest.current = value;
      setState({ key, value, loaded: true });
      void repository.set(key, value);
      for (const other of peers(repository, key)) if (other !== self.current) other(value);
    },
    [repository, key],
  );

  const current = state.key === key ? state : { value: fallback, loaded: false };
  return { value: current.value, loaded: current.loaded, update };
}
