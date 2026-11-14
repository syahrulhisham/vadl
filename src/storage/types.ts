/**
 * Storage contracts (docs/architecture.md, "Storage strategy").
 *
 * Feature code talks only to `Repository`. The prototype uses a LocalStorage
 * adapter (Stage A); a future database backend (Stage C) replaces the adapter
 * and nothing else. Nothing in the prototype transmits data off the device (NFR-07).
 */

/** Current schema version. Every stored record carries it; a migration runs when it changes. */
export const SCHEMA_VERSION = 1;

/** Key prefix for every LocalStorage entry, e.g. `vadl.v1.profile`. */
export const STORAGE_PREFIX = `vadl.v${SCHEMA_VERSION}`;

/** The stored collections in the plan's storage table. Per-module collections take a module id. */
export type StorageKey =
  | { readonly kind: 'profile' }
  | { readonly kind: 'progress' }
  | { readonly kind: 'settings' }
  | { readonly kind: 'sessions'; readonly moduleId: string }
  | { readonly kind: 'attempts'; readonly moduleId: string }
  | { readonly kind: 'report'; readonly reportId: string };

/** Envelope written around every stored value. */
export interface StoredRecord<T> {
  readonly schemaVersion: number;
  /** ISO 8601 timestamp of the last write. */
  readonly savedAt: string;
  readonly data: T;
}

/** A migration upgrades a record written at `fromVersion` to `fromVersion + 1`. */
export interface Migration {
  readonly fromVersion: number;
  migrate(data: unknown): unknown;
}

/**
 * Asynchronous so that a network-backed adapter can implement the same
 * interface without changing callers.
 */
export interface Repository {
  get<T>(key: StorageKey): Promise<T | null>;
  set<T>(key: StorageKey, value: T): Promise<void>;
  remove(key: StorageKey): Promise<void>;
  /** All VADL data as one JSON-serialisable object, for the student's own backup (Stage B). */
  exportAll(): Promise<Record<string, unknown>>;
  /** Replace all VADL data from a previous export, running migrations as needed. */
  importAll(data: Record<string, unknown>): Promise<void>;
  /** Delete all VADL data from this device. */
  clearAll(): Promise<void>;
}
