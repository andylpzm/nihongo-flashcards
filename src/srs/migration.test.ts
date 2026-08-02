import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

async function freshImports() {
  // db.ts memoizes its IndexedDB connection at module scope, so a plain
  // re-import within the same file would reuse the previous test's database
  // even after swapping the global indexedDB. Reset the module registry too
  // so db.ts re-evaluates with a genuinely fresh, empty database.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).indexedDB = new IDBFactory();
  localStorage.clear();
  vi.resetModules();
  const db = await import('./db');
  const migration = await import('./migration');
  return { db, migration };
}

describe('runMigrationIfNeeded', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('converts 100 mastered ids into 21-day-interval review cards with zero loss', async () => {
    const { db, migration } = await freshImports();

    const ids = Array.from({ length: 100 }, (_, i) => i + 1);
    localStorage.setItem('nihongo_mastered_ids', JSON.stringify(ids));

    const now = new Date('2026-01-01T00:00:00Z');
    const result = await migration.runMigrationIfNeeded(now);

    expect(result.migrated).toBe(100);

    const reviews = await db.getAllReviews();
    expect(reviews).toHaveLength(100);

    const byId = new Map(reviews.map((r) => [r.cardId, r]));
    for (const id of ids) {
      const record = byId.get(id);
      expect(record).toBeDefined();
      expect(record!.card.state).toBe(2); // State.Review
      expect(record!.card.stability).toBe(21);
      expect(record!.card.reps).toBe(1);
      expect(record!.card.lapses).toBe(0);
      const dueMs = record!.card.due.getTime() - now.getTime();
      expect(dueMs).toBe(21 * 24 * 60 * 60 * 1000);
      expect(record!.log).toHaveLength(1);
    }
  });

  it('merges vocab and story mastered ids into one review store (fixes B10)', async () => {
    const { db, migration } = await freshImports();

    localStorage.setItem('nihongo_mastered_ids', JSON.stringify([1, 2, 3]));
    localStorage.setItem('nihongo_story_mastered_ids', JSON.stringify(['s1_1', 's1_2']));

    await migration.runMigrationIfNeeded();

    const reviews = await db.getAllReviews();
    const ids = reviews.map((r) => r.cardId).sort();
    expect(ids).toEqual([1, 2, 3, 's1_1', 's1_2']);
  });

  it('never touches the old localStorage keys (rollback path)', async () => {
    const { migration } = await freshImports();

    localStorage.setItem('nihongo_mastered_ids', JSON.stringify([1, 2, 3]));
    await migration.runMigrationIfNeeded();

    expect(localStorage.getItem('nihongo_mastered_ids')).toBe(JSON.stringify([1, 2, 3]));
  });

  it('is idempotent - running twice does not duplicate or re-process records', async () => {
    const { db, migration } = await freshImports();

    localStorage.setItem('nihongo_mastered_ids', JSON.stringify([1, 2, 3]));

    const first = await migration.runMigrationIfNeeded();
    expect(first.migrated).toBe(3);

    const second = await migration.runMigrationIfNeeded();
    expect(second.migrated).toBe(0);

    const reviews = await db.getAllReviews();
    expect(reviews).toHaveLength(3);
  });

  it('writes the schemaVersion marker', async () => {
    const { db, migration } = await freshImports();
    await migration.runMigrationIfNeeded();
    const version = await db.getMeta<number>('schemaVersion');
    expect(version).toBe(migration.CURRENT_SCHEMA_VERSION);
  });

  it('does nothing when there are no mastered ids', async () => {
    const { db, migration } = await freshImports();
    const result = await migration.runMigrationIfNeeded();
    expect(result.migrated).toBe(0);
    const reviews = await db.getAllReviews();
    expect(reviews).toHaveLength(0);
  });
});
