import { Rating, State } from './scheduler';
import type { ReviewRecord } from './types';
import type { Card, CardId } from '../state/types';
import { isVocabCard } from '../data/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const MASTERED_STABILITY_DAYS = 21;

function dateKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
}

export interface RetentionStats {
  /** 0-1: share of reviews in the window that were NOT graded Again. */
  retention: number;
  reviewCount: number;
}

export function computeRetention(
  reviews: ReviewRecord[],
  now: Date = new Date(),
  windowDays = 30
): RetentionStats {
  const cutoff = now.getTime() - windowDays * DAY_MS;
  let total = 0;
  let notAgain = 0;
  for (const record of reviews) {
    for (const entry of record.log) {
      if (entry.ts < cutoff || entry.ts > now.getTime()) continue;
      total++;
      if (entry.rating !== Rating.Again) notAgain++;
    }
  }
  return { retention: total > 0 ? notAgain / total : 0, reviewCount: total };
}

export interface ReviewsPerDay {
  date: string; // YYYY-MM-DD
  count: number;
}

/** Reviews per day for the last `days` days, oldest first, zero-filled so
 * every day appears even with no activity. */
export function computeReviewsPerDay(
  reviews: ReviewRecord[],
  now: Date = new Date(),
  days = 30
): ReviewsPerDay[] {
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    buckets.set(dateKey(now.getTime() - i * DAY_MS), 0);
  }
  for (const record of reviews) {
    for (const entry of record.log) {
      const key = dateKey(entry.ts);
      if (buckets.has(key)) {
        buckets.set(key, buckets.get(key)! + 1);
      }
    }
  }
  return Array.from(buckets.entries()).map(([date, count]) => ({ date, count }));
}

export interface StateCounts {
  new: number;
  learning: number;
  review: number;
  relearning: number;
}

/** How many cards fall in each FSRS state. `totalCardCount` is the size of
 * the full deck - cards with no review record at all are "new". */
export function computeStateCounts(reviews: ReviewRecord[], totalCardCount: number): StateCounts {
  const counts: StateCounts = { new: 0, learning: 0, review: 0, relearning: 0 };
  for (const record of reviews) {
    switch (record.card.state) {
      case State.Learning:
        counts.learning++;
        break;
      case State.Review:
        counts.review++;
        break;
      case State.Relearning:
        counts.relearning++;
        break;
      default:
        break;
    }
  }
  counts.new = Math.max(0, totalCardCount - reviews.length);
  return counts;
}

export interface TopicLapses {
  topic: string;
  lapses: number;
}

/** Topics with the most accumulated lapses, worst first - only meaningful
 * for vocab cards, which are the only ones carrying a `topics` field. */
export function computeWeakestTopics(
  reviews: ReviewRecord[],
  cardsById: Map<CardId, Card>,
  limit = 5
): TopicLapses[] {
  const lapsesByTopic = new Map<string, number>();
  for (const record of reviews) {
    if (record.card.lapses <= 0) continue;
    const card = cardsById.get(record.cardId);
    if (!card || !isVocabCard(card)) continue;
    for (const topic of card.topics) {
      lapsesByTopic.set(topic, (lapsesByTopic.get(topic) ?? 0) + record.card.lapses);
    }
  }
  return Array.from(lapsesByTopic.entries())
    .map(([topic, lapses]) => ({ topic, lapses }))
    .sort((a, b) => b.lapses - a.lapses)
    .slice(0, limit);
}

/** Consecutive days (ending today or yesterday) with at least one review. */
export function computeStreak(reviews: ReviewRecord[], now: Date = new Date()): number {
  const daysWithReviews = new Set<string>();
  for (const record of reviews) {
    for (const entry of record.log) {
      daysWithReviews.add(dateKey(entry.ts));
    }
  }

  let cursorMs = now.getTime();
  if (!daysWithReviews.has(dateKey(cursorMs))) {
    // No review yet today - that alone shouldn't break the streak, so start
    // counting from yesterday instead.
    cursorMs -= DAY_MS;
  }

  let streak = 0;
  while (daysWithReviews.has(dateKey(cursorMs))) {
    streak++;
    cursorMs -= DAY_MS;
  }
  return streak;
}

/** Cards considered durably "learned" for the progress header - in FSRS
 * Review state with a stability past the old app's mastery bar. */
export function countLearned(
  reviews: ReviewRecord[],
  minStabilityDays: number = MASTERED_STABILITY_DAYS
): number {
  return reviews.filter((r) => r.card.state === State.Review && r.card.stability >= minStabilityDays)
    .length;
}

export function countDueToday(reviews: ReviewRecord[], now: Date = new Date()): number {
  return reviews.filter((r) => r.card.due.getTime() <= now.getTime()).length;
}

export function countNewAvailable(allCards: Card[], reviews: ReviewRecord[]): number {
  const reviewedIds = new Set(reviews.map((r) => r.cardId));
  return allCards.filter((c) => !reviewedIds.has(c.id)).length;
}
