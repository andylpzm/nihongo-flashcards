import { Rating } from './scheduler';
import type { Grade, ReviewRecord } from './types';
import type { Card, CardId } from '../state/types';

export interface SessionSettings {
  newPerDay: number;
  maxReviewsPerDay: number;
}

export const defaultSessionSettings: SessionSettings = {
  newPerDay: 10,
  maxReviewsPerDay: 100,
};

export interface QueueItem {
  card: Card;
  review: ReviewRecord | null; // null = never studied (a "new" card)
}

/**
 * Build today's study queue from a set of already-filtered candidate cards
 * (level/topic/pos/deck filters must be applied before calling this).
 *
 * queue = due reviews (sorted by due date, oldest first) + up to newPerDay
 * new cards. Cards with a review record whose due date is still in the
 * future are simply not part of today's queue.
 */
export function buildQueue(
  candidateCards: Card[],
  reviewsByCardId: Map<CardId, ReviewRecord>,
  settings: SessionSettings = defaultSessionSettings,
  now: Date = new Date()
): QueueItem[] {
  const due: QueueItem[] = [];
  const fresh: QueueItem[] = [];

  for (const card of candidateCards) {
    const review = reviewsByCardId.get(card.id) ?? null;
    if (!review) {
      fresh.push({ card, review: null });
    } else if (review.card.due.getTime() <= now.getTime()) {
      due.push({ card, review });
    }
  }

  due.sort((a, b) => a.review!.card.due.getTime() - b.review!.card.due.getTime());

  const limitedDue = due.slice(0, Math.max(0, settings.maxReviewsPerDay));
  const limitedNew = fresh.slice(0, Math.max(0, settings.newPerDay));

  return [...limitedDue, ...limitedNew];
}

export interface SessionProgress {
  reviewed: number;
  total: number;
  correct: number;
}

/**
 * Runtime state for an active study session. Wraps a queue built by
 * buildQueue() and handles re-inserting Again-graded cards later in the
 * same session, per the plan's "relearning step ~10 min, or end-of-session
 * if fewer than 5 cards remain" rule (approximated positionally, since a
 * session has no real wall-clock wait).
 */
export class StudySession {
  private items: QueueItem[];
  private index = 0;
  private reviewedCount = 0;
  private correctCount = 0;
  private readonly startedAt: number;

  constructor(items: QueueItem[], now: Date = new Date()) {
    this.items = items;
    this.startedAt = now.getTime();
  }

  get current(): QueueItem | null {
    return this.items[this.index] ?? null;
  }

  get isComplete(): boolean {
    return this.index >= this.items.length;
  }

  get progress(): SessionProgress {
    return {
      reviewed: this.reviewedCount,
      total: this.items.length,
      correct: this.correctCount,
    };
  }

  get elapsedMs(): number {
    return Date.now() - this.startedAt;
  }

  /** Record the grade given to the current card and advance the session. */
  advance(grade: Grade): void {
    const current = this.items[this.index];
    if (!current) return;

    this.reviewedCount++;
    if (grade === Rating.Good || grade === Rating.Easy) {
      this.correctCount++;
    }

    this.index++;

    if (grade === Rating.Again) {
      const remaining = this.items.length - this.index;
      const reinsertAt =
        remaining < 5
          ? this.items.length // push to the very end
          : this.index + Math.min(remaining, 10); // ~10 cards later
      this.items.splice(reinsertAt, 0, current);
    }
  }
}
