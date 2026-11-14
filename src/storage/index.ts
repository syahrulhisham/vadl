/**
 * Storage layer: repository interface, LocalStorage adapter and schema migrations
 * (docs/architecture.md, storage strategy).
 */
export * from './types';
export {
  createLocalStorageRepository,
  createMemoryStorage,
  resolveStorage,
  keyToString,
  ImportError,
  NAMESPACE,
  type StorageLike,
  type RepositoryOptions,
} from './localStorageRepository';
export { RepositoryProvider } from './RepositoryProvider';
export { createBrowserRepository } from './browserRepository';
export { useRepository, RepositoryContext, type RepositoryHandle } from './repositoryContext';
export {
  PROFILE_KEY,
  PROGRESS_KEY,
  SETTINGS_KEY,
  sessionsKey,
  attemptsKey,
  reportKey,
} from './keys';
