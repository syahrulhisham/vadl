import { useCallback, useEffect, useRef, useState } from 'react';
import { useRepository, type StorageKey } from '@/storage';

type Change<T> = (previous: T) => T;

/**
 * A value persisted through the repository. `key` must be a stable object
 * (define it once at module level), because the value is reloaded when the key
 * object changes.
 *
 * `update` applies a change immediately. Changes made before the stored value
 * has loaded are queued and replayed on top of it when it arrives, so a fast
 * click can neither be lost nor overwrite earlier saved data.
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

  useEffect(() => {
    let cancelled = false;
    loadedKey.current = null;
    pending.current = [];
    void repository.get<T>(key).then((stored) => {
      if (cancelled) return;
      const queued = pending.current;
      pending.current = [];
      loadedKey.current = key;
      const value = queued.reduce((v, change) => change(v), stored ?? fallback);
      if (queued.length > 0) void repository.set(key, value);
      setState({ key, value, loaded: true });
    });
    return () => {
      cancelled = true;
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
      setState((s) => {
        const value = change(s.value);
        void repository.set(key, value);
        return { ...s, value };
      });
    },
    [repository, key],
  );

  const current = state.key === key ? state : { value: fallback, loaded: false };
  return { value: current.value, loaded: current.loaded, update };
}
