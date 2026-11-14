/**
 * LocalStorage implementation of `Repository` (architecture §5, Stage A).
 *
 * - Every value is wrapped in a `StoredRecord` envelope with the schema version.
 * - Records from an older schema are migrated on read and written back.
 * - Records from a newer schema (written by a later VADL) are not touched and
 *   read as `null`, so an old build never corrupts newer data.
 * - Malformed entries read as `null` instead of crashing the application.
 * - Only keys beginning with `vadl.` are exported, imported or cleared; other
 *   sites' data in the same storage is never touched.
 *
 * Nothing here transmits data (NFR-07).
 */
import {
  SCHEMA_VERSION,
  STORAGE_PREFIX,
  type Migration,
  type Repository,
  type StorageKey,
  type StoredRecord,
} from './types';

/** The subset of the Web Storage API the adapter needs. */
export interface StorageLike {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

/** Root namespace shared by every schema version, e.g. `vadl.v1.profile`. */
export const NAMESPACE = 'vadl.';

/** Storage key string for a logical key. */
export function keyToString(key: StorageKey): string {
  switch (key.kind) {
    case 'profile':
    case 'progress':
    case 'settings':
      return `${STORAGE_PREFIX}.${key.kind}`;
    case 'sessions':
    case 'attempts':
      return `${STORAGE_PREFIX}.${key.kind}.${key.moduleId}`;
    case 'report':
      return `${STORAGE_PREFIX}.reports.${key.reportId}`;
  }
}

function isRecord(value: unknown): value is StoredRecord<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { schemaVersion?: unknown }).schemaVersion === 'number' &&
    Number.isInteger((value as { schemaVersion: number }).schemaVersion) &&
    typeof (value as { savedAt?: unknown }).savedAt === 'string' &&
    'data' in value
  );
}

export interface RepositoryOptions {
  readonly migrations?: readonly Migration[];
  /** Clock, injectable for tests. */
  readonly now?: () => Date;
  readonly schemaVersion?: number;
}

/** Thrown by `importAll` when the file is not a VADL export. Nothing is written in that case. */
export class ImportError extends Error {
  override readonly name = 'ImportError';
}

export function createLocalStorageRepository(
  storage: StorageLike,
  {
    migrations = [],
    now = () => new Date(),
    schemaVersion = SCHEMA_VERSION,
  }: RepositoryOptions = {},
): Repository {
  function envelope<T>(data: T): StoredRecord<T> {
    return { schemaVersion, savedAt: now().toISOString(), data };
  }

  /** Bring a record up to the current schema, or return null if that is impossible. */
  function migrate(record: StoredRecord<unknown>): StoredRecord<unknown> | null {
    let { schemaVersion: version, data } = record;
    if (version > schemaVersion) return null;
    while (version < schemaVersion) {
      const step = migrations.find((m) => m.fromVersion === version);
      if (!step) return null;
      data = step.migrate(data);
      version += 1;
    }
    return { ...record, schemaVersion: version, data };
  }

  function readRaw(key: string): StoredRecord<unknown> | null {
    const text = storage.getItem(key);
    if (text === null) return null;
    try {
      const parsed: unknown = JSON.parse(text);
      return isRecord(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  function vadlKeys(): string[] {
    const keys: string[] = [];
    for (let i = 0; i < storage.length; i += 1) {
      const k = storage.key(i);
      if (k !== null && k.startsWith(NAMESPACE)) keys.push(k);
    }
    return keys;
  }

  return {
    async get<T>(key: StorageKey): Promise<T | null> {
      const k = keyToString(key);
      const raw = readRaw(k);
      if (!raw) return null;
      const current = migrate(raw);
      if (!current) return null;
      if (current.schemaVersion !== raw.schemaVersion) {
        storage.setItem(k, JSON.stringify(envelope(current.data)));
      }
      return current.data as T;
    },

    async set<T>(key: StorageKey, value: T): Promise<void> {
      storage.setItem(keyToString(key), JSON.stringify(envelope(value)));
    },

    async remove(key: StorageKey): Promise<void> {
      storage.removeItem(keyToString(key));
    },

    async exportAll(): Promise<Record<string, unknown>> {
      const out: Record<string, unknown> = {};
      for (const k of vadlKeys()) {
        const raw = readRaw(k);
        if (raw) out[k] = raw;
      }
      return out;
    },

    async importAll(data: Record<string, unknown>): Promise<void> {
      // Validate everything first, so a bad file changes nothing.
      const accepted: [string, StoredRecord<unknown>][] = [];
      for (const [k, value] of Object.entries(data)) {
        if (!k.startsWith(NAMESPACE)) throw new ImportError(`Not a VADL key: ${k}`);
        if (!isRecord(value)) throw new ImportError(`Not a VADL record: ${k}`);
        const migrated = migrate(value);
        if (!migrated) {
          throw new ImportError(
            `Record ${k} uses schema ${value.schemaVersion}, which this version cannot read`,
          );
        }
        accepted.push([k, migrated]);
      }
      for (const k of vadlKeys()) storage.removeItem(k);
      for (const [k, record] of accepted) {
        storage.setItem(k, JSON.stringify({ ...record, schemaVersion }));
      }
    },

    async clearAll(): Promise<void> {
      for (const k of vadlKeys()) storage.removeItem(k);
    },
  };
}

/** In-memory `StorageLike`, used when browser storage is unavailable and in tests. */
export function createMemoryStorage(): StorageLike {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    key: (i) => Array.from(map.keys())[i] ?? null,
    getItem: (k) => map.get(k) ?? null,
    setItem: (k, v) => {
      map.set(k, String(v));
    },
    removeItem: (k) => {
      map.delete(k);
    },
  };
}

/**
 * The browser's localStorage if it works, otherwise in-memory storage (private
 * windows and blocked site data can make localStorage throw). `persistent`
 * tells the UI whether data will survive a reload.
 */
export function resolveStorage(candidate: () => StorageLike | undefined): {
  readonly storage: StorageLike;
  readonly persistent: boolean;
} {
  try {
    const s = candidate();
    if (s) {
      const probe = `${NAMESPACE}__probe__`;
      s.setItem(probe, '1');
      s.removeItem(probe);
      return { storage: s, persistent: true };
    }
  } catch {
    // fall through to memory storage
  }
  return { storage: createMemoryStorage(), persistent: false };
}
