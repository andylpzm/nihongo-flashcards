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
