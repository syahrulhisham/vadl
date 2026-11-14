import { describe, expect, it } from 'vitest';
import {
  createLocalStorageRepository,
  createMemoryStorage,
  ImportError,
  keyToString,
  resolveStorage,
  type StorageLike,
} from '@/storage';

const FIXED = new Date('2026-11-14T10:00:00.000Z');
const now = () => FIXED;

describe('keyToString', () => {
  it('maps every logical key to the documented vadl.v1.* names', () => {
    expect(keyToString({ kind: 'profile' })).toBe('vadl.v1.profile');
    expect(keyToString({ kind: 'progress' })).toBe('vadl.v1.progress');
    expect(keyToString({ kind: 'settings' })).toBe('vadl.v1.settings');
    expect(keyToString({ kind: 'sessions', moduleId: 'm01-dc-motor' })).toBe(
      'vadl.v1.sessions.m01-dc-motor',
    );
    expect(keyToString({ kind: 'attempts', moduleId: 'm04-stepper' })).toBe(
      'vadl.v1.attempts.m04-stepper',
    );
    expect(keyToString({ kind: 'report', reportId: 'r1' })).toBe('vadl.v1.reports.r1');
  });
});

describe('LocalStorage repository', () => {
  it('round-trips a value inside a versioned envelope', async () => {
    const storage = createMemoryStorage();
    const repo = createLocalStorageRepository(storage, { now });
    await repo.set({ kind: 'settings' }, { level: 'beginner' });
    expect(await repo.get({ kind: 'settings' })).toEqual({ level: 'beginner' });
    expect(JSON.parse(storage.getItem('vadl.v1.settings') ?? '')).toEqual({
      schemaVersion: 1,
      savedAt: '2026-11-14T10:00:00.000Z',
      data: { level: 'beginner' },
    });
  });

  it('returns null for missing, malformed or non-envelope entries', async () => {
    const storage = createMemoryStorage();
    const repo = createLocalStorageRepository(storage);
    expect(await repo.get({ kind: 'profile' })).toBeNull();
    storage.setItem('vadl.v1.profile', '{not json');
    expect(await repo.get({ kind: 'profile' })).toBeNull();
    storage.setItem('vadl.v1.profile', JSON.stringify({ name: 'no envelope' }));
    expect(await repo.get({ kind: 'profile' })).toBeNull();
  });

  it('leaves data written by a newer schema untouched and reads it as null', async () => {
    const storage = createMemoryStorage();
    const newer = JSON.stringify({ schemaVersion: 2, savedAt: 'x', data: { future: true } });
    storage.setItem('vadl.v1.progress', newer);
    const repo = createLocalStorageRepository(storage);
    expect(await repo.get({ kind: 'progress' })).toBeNull();
    expect(storage.getItem('vadl.v1.progress')).toBe(newer);
  });

  it('migrates older records on read and writes the upgraded record back', async () => {
    const storage = createMemoryStorage();
    storage.setItem(
      'vadl.v1.progress',
      JSON.stringify({ schemaVersion: 1, savedAt: 'old', data: { done: ['a'] } }),
    );
    const repo = createLocalStorageRepository(storage, {
      schemaVersion: 2,
      now,
      migrations: [{ fromVersion: 1, migrate: (d) => ({ ...(d as object), migrated: true }) }],
    });
    expect(await repo.get({ kind: 'progress' })).toEqual({ done: ['a'], migrated: true });
    expect(JSON.parse(storage.getItem('vadl.v1.progress') ?? '').schemaVersion).toBe(2);
  });

  it('reads as null when a migration step is missing', async () => {
    const storage = createMemoryStorage();
    storage.setItem(
      'vadl.v1.progress',
      JSON.stringify({ schemaVersion: 1, savedAt: 'old', data: {} }),
    );
    const repo = createLocalStorageRepository(storage, { schemaVersion: 3, migrations: [] });
    expect(await repo.get({ kind: 'progress' })).toBeNull();
  });

  it('removes a single key', async () => {
    const repo = createLocalStorageRepository(createMemoryStorage());
    await repo.set({ kind: 'profile' }, { name: 'A' });
    await repo.remove({ kind: 'profile' });
    expect(await repo.get({ kind: 'profile' })).toBeNull();
  });

  it('exports, clears and imports only VADL keys', async () => {
    const storage = createMemoryStorage();
    storage.setItem('other-site.token', 'keep me');
    const repo = createLocalStorageRepository(storage, { now });
    await repo.set({ kind: 'profile' }, { name: 'A' });
    await repo.set({ kind: 'sessions', moduleId: 'm01-dc-motor' }, [{ id: 's1' }]);

    const exported = await repo.exportAll();
    expect(Object.keys(exported).sort()).toEqual([
      'vadl.v1.profile',
      'vadl.v1.sessions.m01-dc-motor',
    ]);

    await repo.clearAll();
    expect(await repo.get({ kind: 'profile' })).toBeNull();
    expect(storage.getItem('other-site.token')).toBe('keep me');

    await repo.importAll(exported);
    expect(await repo.get({ kind: 'profile' })).toEqual({ name: 'A' });
    expect(await repo.get({ kind: 'sessions', moduleId: 'm01-dc-motor' })).toEqual([{ id: 's1' }]);
    expect(storage.getItem('other-site.token')).toBe('keep me');
  });

  it('rejects an invalid import without changing existing data', async () => {
    const repo = createLocalStorageRepository(createMemoryStorage(), { now });
    await repo.set({ kind: 'profile' }, { name: 'A' });
    const good = { schemaVersion: 1, savedAt: 'x', data: {} };
    await expect(repo.importAll({ 'evil.key': good })).rejects.toBeInstanceOf(ImportError);
    await expect(repo.importAll({ 'vadl.v1.x': { nope: 1 } })).rejects.toThrow(/Not a VADL record/);
    await expect(
      repo.importAll({ 'vadl.v1.x': { schemaVersion: 9, savedAt: 'x', data: {} } }),
    ).rejects.toThrow(/schema 9/);
    expect(await repo.get({ kind: 'profile' })).toEqual({ name: 'A' });
  });
});

describe('resolveStorage', () => {
  it('uses working browser storage', () => {
    const s = createMemoryStorage();
    expect(resolveStorage(() => s)).toEqual({ storage: s, persistent: true });
    expect(s.length).toBe(0);
  });

  it('falls back to memory when storage throws or is missing (private windows, blocked data)', () => {
    const throwing: StorageLike = {
      length: 0,
      key: () => null,
      getItem: () => null,
      setItem: () => {
        throw new Error('QuotaExceededError');
      },
      removeItem: () => undefined,
    };
    expect(resolveStorage(() => throwing).persistent).toBe(false);
    expect(resolveStorage(() => undefined).persistent).toBe(false);
    expect(
      resolveStorage(() => {
        throw new Error('SecurityError');
      }).persistent,
    ).toBe(false);
  });
});
