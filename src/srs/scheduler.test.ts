import { describe, it, expect } from 'vitest';
import { newFsrsCard, scheduleReview, formatInterval, Rating } from './scheduler';
import { buildQueue } from './queue';
import { SESSION_SIZES } from './settings';
import type { Card } from '../state/types';
import type { ReviewRecord } from './types';

const sessionSize = SESSION_SIZES.long;

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

describe('scheduleReview', () => {
  it('returns a card whose due date is strictly after now', () => {
    const now = new Date('2026-03-01T00:00:00Z');
    const card = newFsrsCard(now);
    const { card: scheduled } = scheduleReview(card, Rating.Good, now);

    expect(scheduled.due.getTime()).toBeGreaterThan(now.getTime());
  });

  it('schedules a longer interval for Easy than for Hard', () => {
    const now = new Date('2026-03-01T00:00:00Z');
    const card = newFsrsCard(now);
    // Give it one prior review so stability differentiates grades meaningfully.
    const { card: afterGood } = scheduleReview(card, Rating.Good, now);
    const reviewTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const easy = scheduleReview(afterGood, Rating.Easy, reviewTime).card;
    const hard = scheduleReview(afterGood, Rating.Hard, reviewTime).card;

    expect(easy.due.getTime()).toBeGreaterThan(hard.due.getTime());
  });

  it('Again schedules the card to come back sooner than Good', () => {
    const now = new Date('2026-03-01T00:00:00Z');
    const card = newFsrsCard(now);
    const { card: afterGood } = scheduleReview(card, Rating.Good, now);
    const reviewTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const again = scheduleReview(afterGood, Rating.Again, reviewTime).card;
    const good = scheduleReview(afterGood, Rating.Good, reviewTime).card;

    expect(again.due.getTime()).toBeLessThan(good.due.getTime());
  });
});

describe('formatInterval', () => {
  it('formats sub-hour intervals in minutes', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const due = new Date(now.getTime() + 10 * 60 * 1000);
    expect(formatInterval(due, now)).toBe('10m');
  });

  it('formats multi-day intervals in days', () => {
    const now = new Date('2026-01-01T00:00:00Z');
    const due = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    expect(formatInterval(due, now)).toBe('3d');
  });
});

describe('grading a card Good removes it from today\'s queue and it reappears on its due date', () => {
  it('end-to-end with a faked clock', () => {
    const day1 = new Date('2026-05-01T09:00:00Z');
    const card = makeCard(1);

    // New cards pass through short FSRS learning steps (minutes) before
    // graduating to a day-scale Review interval - grade it Good twice to
    // reach a realistic steady-state review card, matching how the app's
    // migrated ("previously mastered") cards actually start out.
    const afterFirstGood = scheduleReview(newFsrsCard(day1), Rating.Good, day1).card;
    const day2 = new Date(day1.getTime() + 24 * 60 * 60 * 1000);
    const { card: scheduled } = scheduleReview(afterFirstGood, Rating.Good, day2);

    const record: ReviewRecord = {
      cardId: 1,
      card: scheduled,
      log: [{ ts: day2.getTime(), rating: Rating.Good, elapsedMs: 0 }],
    };

    expect(scheduled.due.getTime() - day2.getTime()).toBeGreaterThan(24 * 60 * 60 * 1000);

    // Right after grading: not due yet, queue is empty.
    const rightAfter = new Date(day2.getTime() + 60 * 1000);
    const queueSameDay = buildQueue([card], new Map([[1, record]]), sessionSize, rightAfter);
    expect(queueSameDay.items).toHaveLength(0);

    // On its due date: back in the queue.
    const onDueDate = record.card.due;
    const queueOnDue = buildQueue([card], new Map([[1, record]]), sessionSize, onDueDate);
    expect(queueOnDue.items.map((q) => q.card.id)).toEqual([1]);
  });
});
