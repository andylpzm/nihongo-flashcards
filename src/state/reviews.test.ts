import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { State } from '../srs/scheduler';
import type { FsrsCard } from '../srs/types';

async function freshImports() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).indexedDB = new IDBFactory();
  localStorage.clear();
  vi.resetModules();
  return import('./reviews');
}

function makeCard(id: number) {
  return {
    id,
    kana: 'あ',
    romaji: 'a',
    meanings: ['a'],
    level: 'N5' as const,
    pos: 'other' as const,
    topics: ['other' as const],
  };
}

function makeScheduled(due: Date): FsrsCard {
  return {
    due,
    stability: 1,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 1,
    learning_steps: 0,
    reps: 1,
    lapses: 0,
    state: State.Review,
    last_review: due,
  };
}

describe('getRemainingNewBudget', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns the full budget when nothing has been studied today', async () => {
    const reviews = await freshImports();
    expect(reviews.getRemainingNewBudget(10)).toBe(10);
  });

  it('decreases as new cards are graded today', async () => {
    const reviews = await freshImports();
    const now = new Date('2026-06-15T10:00:00Z');

    await reviews.recordGrade(makeCard(1), 3 as never, makeScheduled(now), now);
    expect(reviews.getRemainingNewBudget(10, now)).toBe(9);

    await reviews.recordGrade(makeCard(2), 3 as never, makeScheduled(now), now);
    expect(reviews.getRemainingNewBudget(10, now)).toBe(8);
  });

  it('does not decrease the budget for re-reviewing an already-known card', async () => {
    const reviews = await freshImports();
    const now = new Date('2026-06-15T10:00:00Z');

    await reviews.recordGrade(makeCard(1), 3 as never, makeScheduled(now), now);
    expect(reviews.getRemainingNewBudget(10, now)).toBe(9);

    // Grading the same card again later the same day is a review, not a new card.
    const later = new Date('2026-06-15T12:00:00Z');
    await reviews.recordGrade(makeCard(1), 3 as never, makeScheduled(later), later);
    expect(reviews.getRemainingNewBudget(10, later)).toBe(9);
  });

  it('resets on a new calendar day', async () => {
    const reviews = await freshImports();
    const day1 = new Date('2026-06-15T10:00:00Z');
    await reviews.recordGrade(makeCard(1), 3 as never, makeScheduled(day1), day1);
    expect(reviews.getRemainingNewBudget(10, day1)).toBe(9);

    const day2 = new Date('2026-06-16T10:00:00Z');
    expect(reviews.getRemainingNewBudget(10, day2)).toBe(10);
  });

  it('never goes below zero once the budget is exhausted', async () => {
    const reviews = await freshImports();
    const now = new Date('2026-06-15T10:00:00Z');
    for (let i = 0; i < 12; i++) {
      await reviews.recordGrade(makeCard(i + 1), 3 as never, makeScheduled(now), now);
    }
    expect(reviews.getRemainingNewBudget(10, now)).toBe(0);
  });
});

describe('getRemainingReviewBudget', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('decreases only for reviews of already-known cards, not new ones', async () => {
    const reviews = await freshImports();
    const now = new Date('2026-06-15T10:00:00Z');

    await reviews.recordGrade(makeCard(1), 3 as never, makeScheduled(now), now);
    expect(reviews.getRemainingReviewBudget(100, now)).toBe(100); // still new, doesn't count as a review

    await reviews.recordGrade(makeCard(1), 3 as never, makeScheduled(now), now);
    expect(reviews.getRemainingReviewBudget(100, now)).toBe(99);
  });
});

describe('recordGrade', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('writes exactly the scheduled card it was handed - guards against a second, re-rolled schedule (D10)', async () => {
    const reviews = await freshImports();
    const now = new Date('2026-06-15T10:00:00Z');
    const due = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const scheduled = makeScheduled(due);

    const record = await reviews.recordGrade(makeCard(1), 3 as never, scheduled, now);

    expect(record.card.due.getTime()).toBe(due.getTime());
    expect(reviews.getReview(1)?.card.due.getTime()).toBe(due.getTime());
  });
});
