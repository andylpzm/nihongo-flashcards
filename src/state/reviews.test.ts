import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';

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

    await reviews.recordGrade(makeCard(1), 3 as never, now);
    expect(reviews.getRemainingNewBudget(10, now)).toBe(9);

    await reviews.recordGrade(makeCard(2), 3 as never, now);
    expect(reviews.getRemainingNewBudget(10, now)).toBe(8);
  });

  it('does not decrease the budget for re-reviewing an already-known card', async () => {
    const reviews = await freshImports();
    const now = new Date('2026-06-15T10:00:00Z');

    await reviews.recordGrade(makeCard(1), 3 as never, now);
    expect(reviews.getRemainingNewBudget(10, now)).toBe(9);

    // Grading the same card again later the same day is a review, not a new card.
    const later = new Date('2026-06-15T12:00:00Z');
    await reviews.recordGrade(makeCard(1), 3 as never, later);
    expect(reviews.getRemainingNewBudget(10, later)).toBe(9);
  });

  it('resets on a new calendar day', async () => {
    const reviews = await freshImports();
    const day1 = new Date('2026-06-15T10:00:00Z');
    await reviews.recordGrade(makeCard(1), 3 as never, day1);
    expect(reviews.getRemainingNewBudget(10, day1)).toBe(9);

    const day2 = new Date('2026-06-16T10:00:00Z');
    expect(reviews.getRemainingNewBudget(10, day2)).toBe(10);
  });

  it('never goes below zero once the budget is exhausted', async () => {
    const reviews = await freshImports();
    const now = new Date('2026-06-15T10:00:00Z');
    for (let i = 0; i < 12; i++) {
      await reviews.recordGrade(makeCard(i + 1), 3 as never, now);
    }
    expect(reviews.getRemainingNewBudget(10, now)).toBe(0);
  });
});
