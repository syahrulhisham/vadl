// @vitest-environment jsdom
import { act, renderHook, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { describe, expect, it } from 'vitest';
import { useStoredValue } from '@/hooks';
import {
  createLocalStorageRepository,
  createMemoryStorage,
  RepositoryProvider,
  sessionsKey,
  type Repository,
} from '@/storage';

const KEY = sessionsKey('test-module');

/** A repository whose reads wait until `release()` is called. */
function slowRepository(base: Repository) {
  let release: () => void = () => undefined;
  const gate = new Promise<void>((r) => {
    release = r;
  });
  const repo: Repository = {
    ...base,
    get: async (key) => {
      await gate;
      return base.get(key);
    },
  };
  return { repo, release };
}

function wrapperFor(repository: Repository) {
  return ({ children }: { children: ReactNode }) => (
    <RepositoryProvider repository={repository}>{children}</RepositoryProvider>
  );
}

describe('useStoredValue', () => {
  it('loads the stored value and saves updates', async () => {
    const base = createLocalStorageRepository(createMemoryStorage());
    await base.set(KEY, ['a']);
    const { result } = renderHook(() => useStoredValue<string[]>(KEY, []), {
      wrapper: wrapperFor(base),
    });
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.value).toEqual(['a']);
    act(() => result.current.update((v) => [...v, 'b']));
    expect(result.current.value).toEqual(['a', 'b']);
    expect(await base.get(KEY)).toEqual(['a', 'b']);
  });

  it('a change made before the load finishes is kept and applied on top of the stored data', async () => {
    const base = createLocalStorageRepository(createMemoryStorage());
    await base.set(KEY, ['earlier session']);
    const { repo, release } = slowRepository(base);
    const { result } = renderHook(() => useStoredValue<string[]>(KEY, []), {
      wrapper: wrapperFor(repo),
    });

    act(() => result.current.update((v) => [...v, 'fast click']));
    expect(result.current.loaded).toBe(false);
    expect(result.current.value).toEqual(['fast click']);
    expect(await base.get(KEY)).toEqual(['earlier session']); // nothing overwritten yet

    act(() => release());
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.value).toEqual(['earlier session', 'fast click']);
    expect(await base.get(KEY)).toEqual(['earlier session', 'fast click']);
  });

  it('uses the initial value when nothing is stored', async () => {
    const base = createLocalStorageRepository(createMemoryStorage());
    const { result } = renderHook(() => useStoredValue<number>(KEY, 7), {
      wrapper: wrapperFor(base),
    });
    await waitFor(() => expect(result.current.loaded).toBe(true));
    expect(result.current.value).toBe(7);
  });
});
