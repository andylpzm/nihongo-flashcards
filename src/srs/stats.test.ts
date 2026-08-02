import { describe, it, expect } from 'vitest';
import {
  computeRetention,
  computeReviewsPerDay,
  computeStateCounts,
  computeStreak,
  countLearned,
  countDueToday,
  countNewAvailable,
} from './stats';
import { Rating, State } from './scheduler';
import type { ReviewRecord, FsrsCard } from './types';
import type { Card } from '../state/types';

function makeFsrsCard(overrides: Partial<FsrsCard> = {}): FsrsCard {
  return {
    due: new Date('2026-06-15T00:00:00Z'),
    stability: 21,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 21,
    learning_steps: 0,
    reps: 1,
    lapses: 0,
    state: State.Review,
    last_review: new Date('2026-06-14T00:00:00Z'),
    ...overrides,
  };
}

describe('computeRetention', () => {
  it('is 1.0 when no reviews were graded Again', () => {
    const now = new Date('2026-06-15T00:00:00Z');
    const reviews: ReviewRecord[] = [
      {
        cardId: 1,
        card: makeFsrsCard(),
        log: [
          { ts: now.getTime() - 1000, rating: Rating.Good, elapsedMs: 0 },
          { ts: now.getTime() - 2000, rating: Rating.Easy, elapsedMs: 0 },
        ],
      },
    ];
    expect(computeRetention(reviews, now).retention).toBe(1);
  });

  it('excludes reviews outside the window', () => {
    const now = new Date('2026-06-15T00:00:00Z');
    const wayBack = now.getTime() - 60 * 24 * 60 * 60 * 1000;
    const reviews: ReviewRecord[] = [
      { cardId: 1, card: makeFsrsCard(), log: [{ ts: wayBack, rating: Rating.Again, elapsedMs: 0 }] },
    ];
    expect(computeRetention(reviews, now, 30).reviewCount).toBe(0);
  });

  it('counts Again as a lapse in the retention ratio', () => {
    const now = new Date('2026-06-15T00:00:00Z');
    const reviews: ReviewRecord[] = [
      {
        cardId: 1,
        card: makeFsrsCard(),
        log: [
          { ts: now.getTime() - 1000, rating: Rating.Good, elapsedMs: 0 },
          { ts: now.getTime() - 2000, rating: Rating.Again, elapsedMs: 0 },
        ],
      },
    ];
    expect(computeRetention(reviews, now).retention).toBe(0.5);
  });
});

describe('computeReviewsPerDay', () => {
  it('zero-fills every day in the window', () => {
    const now = new Date('2026-06-15T00:00:00Z');
    const result = computeReviewsPerDay([], now, 7);
    expect(result).toHaveLength(7);
    expect(result.every((r) => r.count === 0)).toBe(true);
    expect(result[6]!.date).toBe('2026-06-15');
  });

  it('buckets reviews by their calendar day', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    const reviews: ReviewRecord[] = [
      {
        cardId: 1,
        card: makeFsrsCard(),
        log: [
          { ts: new Date('2026-06-15T01:00:00Z').getTime(), rating: Rating.Good, elapsedMs: 0 },
          { ts: new Date('2026-06-15T02:00:00Z').getTime(), rating: Rating.Good, elapsedMs: 0 },
          { ts: new Date('2026-06-14T01:00:00Z').getTime(), rating: Rating.Good, elapsedMs: 0 },
        ],
      },
    ];
    const result = computeReviewsPerDay(reviews, now, 7);
    expect(result.find((r) => r.date === '2026-06-15')?.count).toBe(2);
    expect(result.find((r) => r.date === '2026-06-14')?.count).toBe(1);
  });
});

describe('computeStateCounts', () => {
  it('derives new-card count from total minus reviewed', () => {
    const reviews: ReviewRecord[] = [
      { cardId: 1, card: makeFsrsCard({ state: State.Review }), log: [] },
      { cardId: 2, card: makeFsrsCard({ state: State.Learning }), log: [] },
    ];
    const counts = computeStateCounts(reviews, 10);
    expect(counts).toEqual({ new: 8, learning: 1, review: 1, relearning: 0 });
  });
});

describe('computeStreak', () => {
  it('counts consecutive days ending today', () => {
    const now = new Date('2026-06-15T18:00:00Z');
    const reviews: ReviewRecord[] = [
      {
        cardId: 1,
        card: makeFsrsCard(),
        log: [
          { ts: new Date('2026-06-15T01:00:00Z').getTime(), rating: Rating.Good, elapsedMs: 0 },
          { ts: new Date('2026-06-14T01:00:00Z').getTime(), rating: Rating.Good, elapsedMs: 0 },
          { ts: new Date('2026-06-13T01:00:00Z').getTime(), rating: Rating.Good, elapsedMs: 0 },
        ],
      },
    ];
    expect(computeStreak(reviews, now)).toBe(3);
  });

  it('does not break the streak just because today has no review yet', () => {
    const now = new Date('2026-06-15T08:00:00Z');
    const reviews: ReviewRecord[] = [
      { cardId: 1, card: makeFsrsCard(), log: [{ ts: new Date('2026-06-14T01:00:00Z').getTime(), rating: Rating.Good, elapsedMs: 0 }] },
    ];
    expect(computeStreak(reviews, now)).toBe(1);
  });

  it('is 0 once a full day has passed with no review', () => {
    const now = new Date('2026-06-15T08:00:00Z');
    const reviews: ReviewRecord[] = [
      { cardId: 1, card: makeFsrsCard(), log: [{ ts: new Date('2026-06-10T01:00:00Z').getTime(), rating: Rating.Good, elapsedMs: 0 }] },
    ];
    expect(computeStreak(reviews, now)).toBe(0);
  });
});

describe('countLearned / countDueToday / countNewAvailable', () => {
  it('countLearned requires Review state and stability past the threshold', () => {
    const reviews: ReviewRecord[] = [
      { cardId: 1, card: makeFsrsCard({ state: State.Review, stability: 25 }), log: [] },
      { cardId: 2, card: makeFsrsCard({ state: State.Review, stability: 5 }), log: [] },
      { cardId: 3, card: makeFsrsCard({ state: State.Learning, stability: 25 }), log: [] },
    ];
    expect(countLearned(reviews)).toBe(1);
  });

  it('countDueToday counts records due at or before now', () => {
    const now = new Date('2026-06-15T00:00:00Z');
    const reviews: ReviewRecord[] = [
      { cardId: 1, card: makeFsrsCard({ due: new Date('2026-06-14T00:00:00Z') }), log: [] },
      { cardId: 2, card: makeFsrsCard({ due: new Date('2026-06-16T00:00:00Z') }), log: [] },
    ];
    expect(countDueToday(reviews, now)).toBe(1);
  });

  it('countNewAvailable is cards with no review record', () => {
    const cards: Card[] = [
      { id: 1, kana: 'あ', romaji: 'a', meanings: ['a'], level: 'N5', pos: 'other', topics: ['other'] },
      { id: 2, kana: 'い', romaji: 'i', meanings: ['i'], level: 'N5', pos: 'other', topics: ['other'] },
    ];
    const reviews: ReviewRecord[] = [{ cardId: 1, card: makeFsrsCard(), log: [] }];
    expect(countNewAvailable(cards, reviews)).toBe(1);
  });
});
