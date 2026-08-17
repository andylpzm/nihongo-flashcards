import { describe, it, expect } from 'vitest';
import { buildQueue } from './queue';
import { Rating, State, newFsrsCard } from './scheduler';
import { SESSION_SIZES } from './settings';
import type { ReviewRecord, FsrsCard } from './types';
import type { Card, CardId } from '../state/types';

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

const fullSessionSize = SESSION_SIZES.medium;

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

    const result = buildQueue(cards, reviews, fullSessionSize, now);

    expect(result.items.map((q) => q.card.id)).toEqual([1]);
    expect(result.nextDueAt).toEqual(tomorrow);
  });

  it('sorts due reviews oldest-due-first', () => {
    const twoDaysAgo = new Date('2026-06-13T12:00:00Z');
    const cards = [makeCard(1), makeCard(2)];
    const reviews = new Map([
      [1, makeReview(1, yesterday)],
      [2, makeReview(2, twoDaysAgo)],
    ]);

    const result = buildQueue(cards, reviews, fullSessionSize, now);

    expect(result.items.map((q) => q.card.id)).toEqual([2, 1]);
  });

  it('treats cards with no review record as new cards', () => {
    const cards = [makeCard(1)];
    const result = buildQueue(cards, new Map(), fullSessionSize, now);

    expect(result.items).toHaveLength(1);
    expect(result.items[0]!.isNew).toBe(true);
    expect(result.newCount).toBe(1);
  });

  it('admits exactly the session size in new cards, and no more', () => {
    const cards = Array.from({ length: fullSessionSize + 15 }, (_, i) => makeCard(i + 1));
    const result = buildQueue(cards, new Map(), fullSessionSize, now);

    // Session length is the only limit now - there is no daily new-card cap
    // to shrink a sitting below the size the user asked for.
    expect(result.items).toHaveLength(fullSessionSize);
    expect(result.newCount).toBe(fullSessionSize);
    expect(result.newHeldBack).toBe(15);
  });

  it('admits at most the session size in due reviews', () => {
    const cards = Array.from({ length: fullSessionSize + 10 }, (_, i) => makeCard(i + 1));
    const reviews = new Map(cards.map((c) => [c.id as number, makeReview(c.id as number, yesterday)]));
    const result = buildQueue(cards, reviews, fullSessionSize, now);

    expect(result.items).toHaveLength(fullSessionSize);
  });

  it('a smaller preset produces a smaller sitting', () => {
    const cards = Array.from({ length: 200 }, (_, i) => makeCard(i + 1));
    expect(buildQueue(cards, new Map(), SESSION_SIZES.short, now).items).toHaveLength(SESSION_SIZES.short);
    expect(buildQueue(cards, new Map(), SESSION_SIZES.medium, now).items).toHaveLength(SESSION_SIZES.medium);
    expect(buildQueue(cards, new Map(), SESSION_SIZES.long, now).items).toHaveLength(SESSION_SIZES.long);
  });

  it('puts due reviews before new cards', () => {
    const cards = [makeCard(1), makeCard(2)];
    const reviews = new Map([[1, makeReview(1, yesterday)]]);
    const result = buildQueue(cards, reviews, fullSessionSize, now);

    expect(result.items.map((q) => q.card.id)).toEqual([1, 2]);
  });

  it('never exceeds sessionSize, admitting due reviews before new cards when supply exceeds it', () => {
    const dueCards = Array.from({ length: 8 }, (_, i) => makeCard(i + 1));
    const newCards = Array.from({ length: 8 }, (_, i) => makeCard(100 + i));
    const cards = [...dueCards, ...newCards];
    const reviews = new Map(dueCards.map((c) => [c.id as number, makeReview(c.id as number, yesterday)]));

    const result = buildQueue(cards, reviews, 10, now);

    expect(result.items).toHaveLength(10);
    expect(result.items.slice(0, 8).map((q) => q.card.id)).toEqual(dueCards.map((c) => c.id));
    expect(result.items.slice(8).map((q) => q.card.id)).toEqual(newCards.slice(0, 2).map((c) => c.id));
  });

  it('reports newHeldBack as the new cards that exist but weren\'t admitted', () => {
    const cards = Array.from({ length: fullSessionSize + 3 }, (_, i) => makeCard(i + 1));
    const result = buildQueue(cards, new Map(), fullSessionSize, now);

    expect(result.newCount).toBe(fullSessionSize);
    expect(result.newHeldBack).toBe(3);
  });

  it('nextDueAt is null when every candidate is new', () => {
    const cards = [makeCard(1), makeCard(2)];
    const result = buildQueue(cards, new Map(), fullSessionSize, now);
    expect(result.nextDueAt).toBeNull();
  });

  it('nextDueAt is the earliest future due date among candidates', () => {
    const soon = new Date('2026-06-15T13:00:00Z');
    const later = new Date('2026-06-20T00:00:00Z');
    const cards = [makeCard(1), makeCard(2)];
    const reviews = new Map([
      [1, makeReview(1, later)],
      [2, makeReview(2, soon)],
    ]);
    const result = buildQueue(cards, reviews, fullSessionSize, now);
    expect(result.nextDueAt).toEqual(soon);
  });
});

describe('new-card reserve', () => {
  it('admits new cards even when due reviews could fill the sitting', () => {
    // Regression: pure review-priority starved new material entirely for a
    // learner with a persistent backlog.
    const cards: Card[] = Array.from({ length: 60 }, (_, i) => ({
      id: i + 1,
      kana: 'あ',
      romaji: 'a',
      meanings: ['a'],
      level: 'N5' as const,
      pos: 'other' as const,
      topics: ['other'],
    }));
    const now = new Date('2026-05-01T09:00:00Z');
    const reviews = new Map<CardId, ReviewRecord>();
    // 50 cards all overdue - more than a 25-card sitting can hold.
    for (let i = 0; i < 50; i++) {
      reviews.set(cards[i]!.id, {
        cardId: cards[i]!.id,
        card: { ...newFsrsCard(now), due: new Date(now.getTime() - 86400000) },
        log: [],
      });
    }
    const build = buildQueue(cards, reviews, 25, now);
    expect(build.items).toHaveLength(25);
    expect(build.newCount).toBeGreaterThan(0);
    // ...but the backlog still gets the lion's share.
    expect(build.items.filter((i) => !i.isNew).length).toBeGreaterThanOrEqual(20);
  });

  it('gives the whole sitting to reviews when there are no new cards left', () => {
    const cards: Card[] = Array.from({ length: 30 }, (_, i) => ({
      id: i + 1,
      kana: 'あ',
      romaji: 'a',
      meanings: ['a'],
      level: 'N5' as const,
      pos: 'other' as const,
      topics: ['other'],
    }));
    const now = new Date('2026-05-01T09:00:00Z');
    const reviews = new Map<CardId, ReviewRecord>();
    for (const c of cards) {
      reviews.set(c.id, {
        cardId: c.id,
        card: { ...newFsrsCard(now), due: new Date(now.getTime() - 86400000) },
        log: [],
      });
    }
    const build = buildQueue(cards, reviews, 25, now);
    expect(build.items).toHaveLength(25);
    expect(build.newCount).toBe(0);
  });
});
