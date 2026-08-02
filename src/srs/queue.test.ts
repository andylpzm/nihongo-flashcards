import { describe, it, expect } from 'vitest';
import { buildQueue, StudySession, defaultSessionSettings } from './queue';
import { Rating, State } from './scheduler';
import type { ReviewRecord, FsrsCard } from './types';
import type { Card } from '../state/types';

function makeCard(id: number, kana = 'あ'): Card {
  return {
    id,
    kana,
    kanji: undefined,
    romaji: 'a',
    meanings: ['a'],
    level: 'N5',
    pos: 'other',
    topics: ['other'],
  };
}

function makeFsrsCard(due: Date): FsrsCard {
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
    last_review: new Date(due.getTime() - 24 * 60 * 60 * 1000),
  };
}

function makeReview(cardId: number, due: Date): ReviewRecord {
  return {
    cardId,
    card: makeFsrsCard(due),
    log: [{ ts: due.getTime(), rating: Rating.Good, elapsedMs: 0 }],
  };
}

describe('buildQueue', () => {
  const now = new Date('2026-06-15T12:00:00Z');
  const yesterday = new Date('2026-06-14T12:00:00Z');
  const tomorrow = new Date('2026-06-16T12:00:00Z');

  it('includes due reviews and excludes not-yet-due reviews', () => {
    const cards = [makeCard(1), makeCard(2)];
    const reviews = new Map([
      [1, makeReview(1, yesterday)], // due
      [2, makeReview(2, tomorrow)], // not due yet
    ]);

    const queue = buildQueue(cards, reviews, defaultSessionSettings, now);

    expect(queue.map((q) => q.card.id)).toEqual([1]);
  });

  it('sorts due reviews oldest-due-first', () => {
    const twoDaysAgo = new Date('2026-06-13T12:00:00Z');
    const cards = [makeCard(1), makeCard(2)];
    const reviews = new Map([
      [1, makeReview(1, yesterday)],
      [2, makeReview(2, twoDaysAgo)],
    ]);

    const queue = buildQueue(cards, reviews, defaultSessionSettings, now);

    expect(queue.map((q) => q.card.id)).toEqual([2, 1]);
  });

  it('treats cards with no review record as new cards', () => {
    const cards = [makeCard(1)];
    const queue = buildQueue(cards, new Map(), defaultSessionSettings, now);

    expect(queue).toHaveLength(1);
    expect(queue[0]!.review).toBeNull();
  });

  it('caps new cards at newPerDay', () => {
    const cards = Array.from({ length: 20 }, (_, i) => makeCard(i + 1));
    const queue = buildQueue(cards, new Map(), { newPerDay: 5, maxReviewsPerDay: 100 }, now);

    expect(queue).toHaveLength(5);
  });

  it('caps due reviews at maxReviewsPerDay', () => {
    const cards = Array.from({ length: 20 }, (_, i) => makeCard(i + 1));
    const reviews = new Map(cards.map((c) => [c.id as number, makeReview(c.id as number, yesterday)]));
    const queue = buildQueue(cards, reviews, { newPerDay: 0, maxReviewsPerDay: 5 }, now);

    expect(queue).toHaveLength(5);
  });

  it('puts due reviews before new cards', () => {
    const cards = [makeCard(1), makeCard(2)];
    const reviews = new Map([[1, makeReview(1, yesterday)]]);
    const queue = buildQueue(cards, reviews, defaultSessionSettings, now);

    expect(queue.map((q) => q.card.id)).toEqual([1, 2]);
  });
});

describe('StudySession', () => {
  it('advances through the queue and tracks progress', () => {
    const items = [makeCard(1), makeCard(2), makeCard(3)].map((card) => ({ card, review: null }));
    const session = new StudySession(items);

    expect(session.progress).toEqual({ reviewed: 0, total: 3, correct: 0 });
    expect(session.current?.card.id).toBe(1);

    session.advance(Rating.Good);
    expect(session.progress).toEqual({ reviewed: 1, total: 3, correct: 1 });
    expect(session.current?.card.id).toBe(2);

    session.advance(Rating.Again);
    expect(session.progress.correct).toBe(1); // Again does not count as correct

    session.advance(Rating.Easy);
    expect(session.progress.correct).toBe(2);
  });

  it('re-inserts an Again-graded card later in the session instead of dropping it', () => {
    const items = Array.from({ length: 20 }, (_, i) => ({ card: makeCard(i + 1), review: null }));
    const session = new StudySession(items);

    session.advance(Rating.Again); // card 1 graded Again

    // card 1 must still appear somewhere later in the session, not lost
    const remainingIds: number[] = [];
    while (!session.isComplete) {
      const id = session.current!.card.id as number;
      remainingIds.push(id);
      session.advance(Rating.Good);
    }

    expect(remainingIds.filter((id) => id === 1)).toHaveLength(1);
    expect(session.isComplete).toBe(true);
  });

  it('pushes an Again card to the very end when fewer than 5 cards remain', () => {
    const items = Array.from({ length: 4 }, (_, i) => ({ card: makeCard(i + 1), review: null }));
    const session = new StudySession(items);

    session.advance(Rating.Good); // card 1 done, 3 remain (< 5)
    session.advance(Rating.Again); // card 2 graded Again with only 2 left - should go to the end

    const remainingIds: number[] = [];
    while (!session.isComplete) {
      remainingIds.push(session.current!.card.id as number);
      session.advance(Rating.Good);
    }

    expect(remainingIds[remainingIds.length - 1]).toBe(2);
  });

  it('is complete once every item (including re-inserts) has been graded', () => {
    const items = [{ card: makeCard(1), review: null }];
    const session = new StudySession(items);
    expect(session.isComplete).toBe(false);
    session.advance(Rating.Good);
    expect(session.isComplete).toBe(true);
  });
});
