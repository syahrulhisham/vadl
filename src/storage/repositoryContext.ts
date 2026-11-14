import { createContext, useContext } from 'react';
import { createLocalStorageRepository, createMemoryStorage } from './localStorageRepository';
import type { Repository } from './types';

export interface RepositoryHandle {
  readonly repository: Repository;
  /** False when browser storage is blocked and data lives only in memory. */
  readonly persistent: boolean;
}

/**
 * Default: an in-memory repository, so components work (and tests run) without
 * a provider. The app wraps everything in RepositoryProvider with browser storage.
 */
export const RepositoryContext = createContext<RepositoryHandle>({
  repository: createLocalStorageRepository(createMemoryStorage()),
  persistent: false,
});

export function useRepository(): RepositoryHandle {
  return useContext(RepositoryContext);
}
