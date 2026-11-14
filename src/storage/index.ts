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
