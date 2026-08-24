import { describe, it, expect } from 'vitest';
import {
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
      // midday, so it is yesterday under any timezone the tests might run in.
      // this used to be 01:00 - which the 6am day boundary now files under the
      // day BEFORE, making it two days ago rather than one
      { cardId: 1, card: makeFsrsCard(), log: [{ ts: new Date('2026-06-14T12:00:00Z').getTime(), rating: Rating.Good, elapsedMs: 0 }] },
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

  // the streak walks backwards a day at a time. done by subtracting 24h it
  // skipped a day on the morning the clocks go forward - that day is only 23
  // hours long, so from just after 6am a flat 24h lands before the previous
  // 6am boundary and the day in between is never asked about.
  it('survives the spring clock change', () => {
    // 2026-03-29 is when european clocks go forward. local times throughout.
    const local = (y: number, m: number, d: number, h: number): number =>
      new Date(y, m - 1, d, h, 0, 0, 0).getTime();
    const days = [
      local(2026, 3, 27, 22),
      local(2026, 3, 28, 22),
      local(2026, 3, 29, 22),
    ];
    const reviews: ReviewRecord[] = [
      {
        cardId: 1,
        card: makeFsrsCard(),
        log: days.map((ts) => ({ ts, rating: Rating.Good, elapsedMs: 0 })),
      },
    ];
    // the hour the flat subtraction fell over in: past 6am, on the short day
    expect(computeStreak(reviews, new Date(local(2026, 3, 30, 6)))).toBe(3);
    expect(computeStreak(reviews, new Date(local(2026, 3, 29, 23)))).toBe(3);
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
