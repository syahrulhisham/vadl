import { createLocalStorageRepository, resolveStorage } from './localStorageRepository';
import type { RepositoryHandle } from './repositoryContext';

/** The browser repository: localStorage when it works, otherwise memory (data lost on reload). */
export function createBrowserRepository(): RepositoryHandle {
  const { storage, persistent } = resolveStorage(() =>
    typeof window === 'undefined' ? undefined : window.localStorage,
  );
  return { repository: createLocalStorageRepository(storage), persistent };
}
