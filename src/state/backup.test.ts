import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { State, Rating } from '../srs/scheduler';
import type { FsrsCard, ReviewRecord, SessionRecord } from '../srs/types';

/** A clean database and a clean module graph per test. */
async function fresh() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).indexedDB = new IDBFactory();
  localStorage.clear();
  vi.resetModules();
  const db = await import('../srs/db');
  const backup = await import('./backup');
  const profile = await import('./profile');
  profile.resetProfileCache();
  return { db, backup, profile };
}

function makeReview(id: number, due: Date, lastReview: Date | undefined = undefined): ReviewRecord {
  const card: FsrsCard = {
    due,
    stability: 12.5,
    difficulty: 5.1,
    elapsed_days: 3,
    scheduled_days: 12,
    learning_steps: 0,
    reps: 4,
    lapses: 1,
    state: State.Review,
    last_review: lastReview,
  };
  return { cardId: id, card, log: [{ ts: 1_700_000_000_000, rating: Rating.Good, elapsedMs: 2400 }] };
}

function makeSession(startedAt: number, answers = 30, completed = true): SessionRecord {
  return { startedAt, endedAt: startedAt + 300_000, deck: 'vocabulary', answers, completed };
}

describe('backup round trip', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('carries the picture and where it was positioned', async () => {
    const a = await fresh();
    const avatar = 'data:image/jpeg;base64,/9j/4AAQSkZJRg==';
    await a.profile.saveProfile({
      name: 'Chris',
      avatar,
      avatarPos: { scale: 1.8, ox: -0.4, oy: 0.25 },
      banner: 'gallery/ch-004.jpg',
      bannerPos: { scale: 1.2, ox: 0.5, oy: -0.1 },
    });
    const file = await a.backup.buildBackup();

    const b = await fresh();
    await b.backup.applyBackup(JSON.parse(JSON.stringify(file)));

    const restored = await b.profile.loadProfile();
    expect(restored.avatar).toBe(avatar);
    expect(restored.banner).toBe('gallery/ch-004.jpg');
    // a lost position is a silently different crop, not a missing feature
    expect(restored.avatarPos).toEqual({ scale: 1.8, ox: -0.4, oy: 0.25 });
    expect(restored.bannerPos).toEqual({ scale: 1.2, ox: 0.5, oy: -0.1 });
  });

  it('keeps the xp clock, or a restore erases every card he has earned', async () => {
    // the epoch is when points started counting. drop it and the next boot
    // stamps a new one; every restored sitting then predates it and the whole
    // collection reads as unearned - on the one path that exists to stop
    // exactly that happening.
    const a = await fresh();
    const epoch = new Date('2026-02-01T09:00:00').getTime();
    await a.profile.saveProfile({ pointsEpoch: epoch, binderRevealed: true, claimedBonusOn: '2026-08-23' });
    const file = await a.backup.buildBackup();

    const b = await fresh();
    await b.backup.applyBackup(JSON.parse(JSON.stringify(file)));

    const restored = await b.profile.loadProfile();
    expect(restored.pointsEpoch).toBe(epoch);
    // and the binder does not re-lock itself on the new phone
    expect(restored.binderRevealed).toBe(true);
    // nor can today's bonus be claimed a second time
    expect(restored.claimedBonusOn).toBe('2026-08-23');
  });

  it('gives an epoch-less backup one old enough to keep its history', async () => {
    // a backup written before the epoch existed: every sitting in it was
    // earning xp at the time, so all of it must still count
    const a = await fresh();
    const started = new Date('2026-03-04T20:00:00').getTime();
    await a.db.putSession({ startedAt: started, endedAt: started + 1000, deck: 'vocabulary', answers: 25, completed: true });
    const file = await a.backup.buildBackup();
    delete (file.profile as { pointsEpoch?: number }).pointsEpoch;

    const b = await fresh();
    await b.backup.applyBackup(JSON.parse(JSON.stringify(file)));

    const restored = await b.profile.loadProfile();
    expect(restored.pointsEpoch).toBeGreaterThan(0);
    expect(restored.pointsEpoch).toBeLessThan(started);
    const points = await b.profile.getPointsState(new Date('2026-03-05T09:00:00'));
    expect(points.summary.total).toBeGreaterThan(0);
  });

  it('restores reviews, sessions and profile onto an empty device', async () => {
    const a = await fresh();
    const due = new Date('2026-09-01T08:00:00.000Z');
    const last = new Date('2026-08-20T08:00:00.000Z');
    await a.db.putReview(makeReview(1, due, last));
    await a.db.putReview(makeReview(2, due));
    await a.db.putSession(makeSession(1_700_000_000_000));
    await a.profile.saveProfile({ name: 'Chris' });

    const bundle = await a.backup.buildBackup();
    const json = JSON.stringify(bundle);

    // A different phone: empty database, same app.
    const b = await fresh();
    expect(await b.db.getAllReviews()).toHaveLength(0);

    const parsed = b.backup.parseBackup(json);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;

    expect(parsed.summary.reviews).toBe(2);
    expect(parsed.summary.name).toBe('Chris');

    const result = await b.backup.applyBackup(parsed.bundle);
    expect(result.reviews).toBe(2);
    expect(result.sessions).toBe(1);
    expect(result.skipped).toBe(0);

    const restored = await b.db.getAllReviews();
    expect(restored).toHaveLength(2);
    expect((await b.profile.loadProfile()).name).toBe('Chris');
  });

  it('brings Date fields back as real Dates, not strings', async () => {
    // The failure this guards against is silent: a string `due` does not throw,
    // it just compares wrongly forever and quietly corrupts scheduling.
    const a = await fresh();
    const due = new Date('2026-09-01T08:00:00.000Z');
    const last = new Date('2026-08-20T08:00:00.000Z');
    await a.db.putReview(makeReview(7, due, last));
    const json = JSON.stringify(await a.backup.buildBackup());

    const b = await fresh();
    const parsed = b.backup.parseBackup(json);
    if (!parsed.ok) throw new Error(parsed.error);
    await b.backup.applyBackup(parsed.bundle);

    const [record] = await b.db.getAllReviews();
    expect(record!.card.due).toBeInstanceOf(Date);
    expect(record!.card.due.getTime()).toBe(due.getTime());
    expect(record!.card.last_review).toBeInstanceOf(Date);
    expect(record!.card.last_review!.getTime()).toBe(last.getTime());
  });

  it('preserves the points total across a restore', async () => {
    const a = await fresh();
    for (let i = 0; i < 5; i++) {
      await a.db.putSession(makeSession(new Date(`2026-03-${10 + i}T12:00:00`).getTime()));
    }
    const expected = (await a.profile.getPointsState(new Date('2026-03-15T18:00:00'))).summary.total;
    expect(expected).toBeGreaterThan(0);
    const json = JSON.stringify(await a.backup.buildBackup());

    const b = await fresh();
    const parsed = b.backup.parseBackup(json);
    if (!parsed.ok) throw new Error(parsed.error);
    await b.backup.applyBackup(parsed.bundle);

    const after = (await b.profile.getPointsState(new Date('2026-03-15T18:00:00'))).summary.total;
    expect(after).toBe(expected);
  });

  it('preserves settings stored in localStorage', async () => {
    const a = await fresh();
    localStorage.setItem('nihongo_theme', 'light');
    localStorage.setItem('unrelated_key', 'should not travel');
    const bundle = await a.backup.buildBackup();
    expect(bundle.settings['nihongo_theme']).toBe('light');
    expect(bundle.settings['unrelated_key']).toBeUndefined();

    const b = await fresh();
    const parsed = b.backup.parseBackup(JSON.stringify(bundle));
    if (!parsed.ok) throw new Error(parsed.error);
    await b.backup.applyBackup(parsed.bundle);
    expect(localStorage.getItem('nihongo_theme')).toBe('light');
  });

  it('merges rather than wiping when restoring onto a used device', async () => {
    const a = await fresh();
    await a.db.putReview(makeReview(1, new Date('2026-09-01T08:00:00Z')));
    const json = JSON.stringify(await a.backup.buildBackup());

    const b = await fresh();
    // Studied a different card since the backup was taken.
    await b.db.putReview(makeReview(99, new Date('2026-10-01T08:00:00Z')));
    const parsed = b.backup.parseBackup(json);
    if (!parsed.ok) throw new Error(parsed.error);
    await b.backup.applyBackup(parsed.bundle);

    const ids = (await b.db.getAllReviews()).map((r) => r.cardId).sort();
    expect(ids).toEqual([1, 99]);
  });
});

describe('parseBackup validation', () => {
  it('rejects text that is not JSON', async () => {
    const { backup } = await fresh();
    const r = backup.parseBackup('not json at all');
    expect(r.ok).toBe(false);
  });

  it('rejects JSON that is not a backup', async () => {
    const { backup } = await fresh();
    const r = backup.parseBackup(JSON.stringify({ hello: 'world' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/not a Nihongo Cards backup/i);
  });

  it('refuses a backup from a newer app version rather than mangling it', async () => {
    const { backup } = await fresh();
    const r = backup.parseBackup(
      JSON.stringify({
        format: 'nihongo-flashcards-backup',
        version: 99,
        reviews: [],
        sessions: [],
      })
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/newer version/i);
  });

  it('rejects a backup with no study data at all', async () => {
    const { backup } = await fresh();
    const r = backup.parseBackup(
      JSON.stringify({ format: 'nihongo-flashcards-backup', version: 1 })
    );
    expect(r.ok).toBe(false);
  });

  it('skips individual corrupt reviews instead of failing the whole restore', async () => {
    const { backup, db } = await fresh();
    const good = {
      cardId: 5,
      card: { due: '2026-09-01T08:00:00.000Z', state: 2, stability: 1, difficulty: 5 },
      log: [],
    };
    const parsed = backup.parseBackup(
      JSON.stringify({
        format: 'nihongo-flashcards-backup',
        version: 1,
        exportedAt: Date.now(),
        reviews: [good, { cardId: 6 }, null, { cardId: 7, card: { due: 'nonsense' } }],
        sessions: [],
        profile: {},
        settings: {},
      })
    );
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const result = await backup.applyBackup(parsed.bundle);
    expect(result.reviews).toBe(1);
    expect(result.skipped).toBe(3);
    expect(await db.getAllReviews()).toHaveLength(1);
  });
});
