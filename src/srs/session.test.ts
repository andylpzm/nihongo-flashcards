// A sitting is now one answer per card, with a second look only for cards you
// got wrong. These tests pin that, and in particular pin the two properties
// the old learning-steps model kept getting wrong: the card count must equal
// the number of cards, and a failed card must not be able to loop forever.

import { describe, it, expect } from 'vitest';
import { StudySession } from './session';
import { Rating } from './scheduler';
import type { QueueItem } from './queue';
import type { Card } from '../state/types';

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

/** Answer whatever is in front of you until the sitting ends. */
function playOut(session: StudySession, grade: Parameters<StudySession['advance']>[0]): number {
  let answers = 0;
  while (!session.isComplete && answers < 500) {
    session.advance(grade);
    answers++;
  }
  return answers;
}

describe('StudySession', () => {
  it('total never changes, whatever grades are given', () => {
    const session = new StudySession(makeItems(3));
    session.advance(Rating.Again);
    session.advance(Rating.Easy);
    expect(session.progress.total).toBe(3);
  });

  it('takes exactly one answer per card when nothing is failed', () => {
    // The whole point of dropping learning steps: 10 cards is 10 decisions.
    const session = new StudySession(makeItems(10));
    expect(playOut(session, Rating.Good)).toBe(10);
    expect(session.progress.done).toBe(10);
  });

  it('lets Hard through in one answer too', () => {
    // Hard used to repeat the learning step forever, so a card could never
    // leave the sitting on Hard alone.
    const session = new StudySession(makeItems(5));
    expect(playOut(session, Rating.Hard)).toBe(5);
  });

  it('brings a failed card back for a second look', () => {
    const session = new StudySession(makeItems(4));
    const first = session.current!.card.id;
    session.advance(Rating.Again);
    expect(session.isComplete).toBe(false);
    expect(session.remainingCardIds).toContain(first);
    // ...but not immediately, or the answer would still be on screen.
    expect(session.current!.card.id).not.toBe(first);
  });

  it('does not bring a card back once it has been answered well', () => {
    const session = new StudySession(makeItems(3));
    const first = session.current!.card.id;
    session.advance(Rating.Good);
    expect(session.remainingCardIds).not.toContain(first);
    expect(session.progress.done).toBe(1);
  });

  it('stops re-queueing a card that keeps being failed', () => {
    // Otherwise a single stubborn card blocks the sitting indefinitely.
    const session = new StudySession(makeItems(1));
    const answers = playOut(session, Rating.Again);
    expect(session.isComplete).toBe(true);
    expect(answers).toBeLessThanOrEqual(3);
  });

  it('counts every press as an answer, and only Good/Easy as correct', () => {
    const session = new StudySession(makeItems(4));
    session.advance(Rating.Good);
    session.advance(Rating.Easy);
    session.advance(Rating.Hard);
    session.advance(Rating.Again);
    expect(session.progress.answers).toBe(4);
    expect(session.progress.correct).toBe(2);
  });

  it('restores its counters when resumed from storage', () => {
    const session = new StudySession(makeItems(2), new Date(), {
      totalCards: 10,
      graduatedCount: 8,
      answers: 9,
      correct: 7,
      startedAt: Date.now() - 60_000,
    });
    expect(session.progress.total).toBe(10);
    expect(session.progress.done).toBe(8);
    expect(session.progress.answers).toBe(9);
    expect(session.progress.remaining).toBe(2);
  });
});
