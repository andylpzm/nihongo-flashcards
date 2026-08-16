import { describe, it, expect } from 'vitest';
import { StudySession } from './session';
import { Rating, State } from './scheduler';
import type { QueueItem } from './queue';
import type { Card } from '../state/types';
import type { FsrsCard } from './types';

const LEARN_AHEAD_MS = 20 * 60 * 1000;

function makeCard(id: number): Card {
  return {
    id,
    kana: 'あ',
    romaji: 'a',
    meanings: ['a'],
    level: 'N5',
    pos: 'other',
    topics: ['other'],
  };
}

function makeItems(count: number): QueueItem[] {
  return Array.from({ length: count }, (_, i) => ({ card: makeCard(i + 1), isNew: true }));
}

/** A scheduled FSRS card, defaulting to a Learning-state card due soon
 * (in-session repeat) - override to simulate graduation out of the session. */
function scheduled(overrides: Partial<FsrsCard> = {}, now: Date): FsrsCard {
  return {
    due: new Date(now.getTime() + 10 * 60 * 1000),
    stability: 1,
    difficulty: 5,
    elapsed_days: 0,
    scheduled_days: 0,
    learning_steps: 1,
    reps: 1,
    lapses: 0,
    state: State.Learning,
    last_review: now,
    ...overrides,
  };
}

describe('StudySession', () => {
  it('total never changes, whatever grades are given', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    const session = new StudySession(makeItems(3), LEARN_AHEAD_MS, now);
    expect(session.progress.total).toBe(3);

    session.advance(Rating.Again, scheduled({}, now), now);
    expect(session.progress.total).toBe(3);

    session.advance(
      Rating.Good,
      scheduled({ state: State.Review, due: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000) }, now),
      now
    );
    expect(session.progress.total).toBe(3);
  });

  it('re-queues a card graded Good while still Learning and due within the window; done does not increment', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    const session = new StudySession(makeItems(2), LEARN_AHEAD_MS, now);

    session.advance(Rating.Good, scheduled({ state: State.Learning }, now), now);

    expect(session.progress.done).toBe(0);
    expect(session.progress.remaining).toBe(2); // re-queued, not dropped
    const ids = [session.current!.card.id];
    // Card 1 should reappear somewhere in the remaining queue.
    expect(session.remainingCardIds.includes(1)).toBe(true);
    void ids;
  });

  it('graduates a card once it reaches Review state with a due date beyond the window; it never reappears', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    const session = new StudySession(makeItems(1), LEARN_AHEAD_MS, now);

    session.advance(
      Rating.Good,
      scheduled({ state: State.Review, due: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) }, now),
      now
    );

    expect(session.progress.done).toBe(1);
    expect(session.isComplete).toBe(true);
    expect(session.remainingCardIds).toEqual([]);
  });

  it('Again re-queues the card at position <= 3', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    const session = new StudySession(makeItems(10), LEARN_AHEAD_MS, now);

    session.advance(Rating.Again, scheduled({ state: State.Learning }, now), now);

    const position = session.remainingCardIds.indexOf(1);
    expect(position).toBeGreaterThanOrEqual(0);
    expect(position).toBeLessThanOrEqual(3);
  });

  it('isComplete is only true once every card has graduated', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    const session = new StudySession(makeItems(2), LEARN_AHEAD_MS, now);
    expect(session.isComplete).toBe(false);

    session.advance(
      Rating.Good,
      scheduled({ state: State.Review, due: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) }, now),
      now
    );
    expect(session.isComplete).toBe(false);

    session.advance(
      Rating.Good,
      scheduled({ state: State.Review, due: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) }, now),
      now
    );
    expect(session.isComplete).toBe(true);
  });

  it('a card graded repeatedly until it reaches Review state graduates and never reappears', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    const session = new StudySession(makeItems(1), LEARN_AHEAD_MS, now);

    // First pass: still Learning, due soon - stays in session.
    session.advance(Rating.Good, scheduled({ state: State.Learning }, now), now);
    expect(session.isComplete).toBe(false);

    // Second pass: graduates to Review, due days out - leaves the session.
    session.advance(
      Rating.Good,
      scheduled({ state: State.Review, due: new Date(now.getTime() + 6 * 24 * 60 * 60 * 1000) }, now),
      now
    );
    expect(session.isComplete).toBe(true);
    expect(session.progress.done).toBe(1);
  });

  it('does not count Again/Hard as correct, but Good/Easy do', () => {
    const now = new Date('2026-06-15T12:00:00Z');
    const session = new StudySession(makeItems(4), LEARN_AHEAD_MS, now);

    session.advance(Rating.Again, scheduled({ state: State.Learning }, now), now);
    session.advance(Rating.Hard, scheduled({ state: State.Learning }, now), now);
    session.advance(
      Rating.Good,
      scheduled({ state: State.Review, due: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) }, now),
      now
    );
    session.advance(
      Rating.Easy,
      scheduled({ state: State.Review, due: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000) }, now),
      now
    );

    expect(session.progress.correct).toBe(2);
    expect(session.progress.answers).toBe(4);
  });
});
