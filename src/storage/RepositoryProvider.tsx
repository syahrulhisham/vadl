import { useState, type ReactNode } from 'react';
import { createBrowserRepository } from './browserRepository';
import { RepositoryContext, type RepositoryHandle } from './repositoryContext';
import type { Repository } from './types';

export interface RepositoryProviderProps {
  /** Inject a repository (tests); defaults to browser storage. */
  readonly repository?: Repository;
  readonly children: ReactNode;
}

/** Makes the student's data store available to every page. Nothing is transmitted (NFR-07). */
export function RepositoryProvider({ repository, children }: RepositoryProviderProps) {
  const [handle] = useState<RepositoryHandle>(() =>
    repository ? { repository, persistent: true } : createBrowserRepository(),
  );
  return <RepositoryContext.Provider value={handle}>{children}</RepositoryContext.Provider>;
}
