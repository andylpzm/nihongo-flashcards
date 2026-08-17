import { Rating, State } from './scheduler';
import type { ReviewRecord } from './types';
import type { Card, CardId } from '../state/types';
import { isVocabCard } from '../data/types';

const DAY_MS = 24 * 60 * 60 * 1000;
const MASTERED_STABILITY_DAYS = 21;

function dateKey(ts: number): string {
  return new Date(ts).toISOString().slice(0, 10);
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

/** Reviews below this are too small a sample to quote a rate from. */
export const MIN_SAMPLE = 30;
/**
 * A median duration stabilises far sooner than a rate does: retention is the
 * frequency of a relatively rare event and needs a big sample before it means
 * anything, whereas the middle value of ten timings is already a fair summary
 * of how long a card takes.
 */
export const MIN_PACE_SAMPLE = 10;
/** Anything longer is "put the phone down mid-card", not a slow answer. */
const MAX_SANE_ANSWER_MS = 60_000;

export interface TodayStats {
  reviews: number;
  msSpent: number;
  activeDays: number;
}

/** What happened today, plus how many distinct days have any activity. */
export function computeToday(reviews: ReviewRecord[], now: Date = new Date()): TodayStats {
  const today = dateKey(now.getTime());
  const days = new Set<string>();
  let count = 0;
  let ms = 0;
  for (const record of reviews) {
    for (const entry of record.log) {
      days.add(dateKey(entry.ts));
      if (dateKey(entry.ts) !== today) continue;
      count += 1;
      if (entry.elapsedMs > 0 && entry.elapsedMs < MAX_SANE_ANSWER_MS) ms += entry.elapsedMs;
    }
  }
  return { reviews: count, msSpent: ms, activeDays: days.size };
}

export interface PaceStats {
  /** Median seconds from a card appearing to being graded. */
  medianSec: number;
  /** Same figure for the window before this one, for a trend arrow. */
  previousSec: number | null;
  sampleSize: number;
}

/**
 * Median, not mean, and outliers dropped: leaving a card open while you make
 * a coffee logs a four-minute review, and one of those drags a mean far
 * enough to make the number useless.
 */
export function computePace(
  reviews: ReviewRecord[],
  now: Date = new Date(),
  windowDays = 14
): PaceStats {
  const cutoff = now.getTime() - windowDays * DAY_MS;
  const recent: number[] = [];
  const older: number[] = [];
  for (const record of reviews) {
    for (const entry of record.log) {
      if (entry.elapsedMs <= 0 || entry.elapsedMs >= MAX_SANE_ANSWER_MS) continue;
      (entry.ts >= cutoff ? recent : older).push(entry.elapsedMs);
    }
  }
  const median = (xs: number[]): number => {
    if (xs.length === 0) return 0;
    const s = [...xs].sort((a, b) => a - b);
    const mid = Math.floor(s.length / 2);
    return s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
  };
  return {
    medianSec: Math.round((median(recent) / 1000) * 10) / 10,
    previousSec: older.length >= MIN_PACE_SAMPLE ? Math.round((median(older) / 1000) * 10) / 10 : null,
    sampleSize: recent.length,
  };
}

export type GradeMix = Record<'again' | 'hard' | 'good' | 'easy', number>;

/** Two answers for the same card further apart than this are separate sittings. */
const SITTING_GAP_MS = 30 * 60 * 1000;

/**
 * How well cards were known, counting each card once per sitting.
 *
 * Only the *first* answer counts. A card you fail comes back later in the same
 * sitting, and that second attempt happens seconds after you were shown the
 * answer - so it is a measure of short-term memory, not of knowledge. Counting
 * it logged the same card as both Forgot and Easy and made the mix look better
 * than the session actually went.
 */
export function computeGradeMix(reviews: ReviewRecord[]): GradeMix {
  const mix: GradeMix = { again: 0, hard: 0, good: 0, easy: 0 };
  for (const record of reviews) {
    let previousTs: number | null = null;
    for (const entry of record.log) {
      const isRetry = previousTs !== null && entry.ts - previousTs < SITTING_GAP_MS;
      previousTs = entry.ts;
      if (isRetry) continue;
      if (entry.rating === Rating.Again) mix.again += 1;
      else if (entry.rating === Rating.Hard) mix.hard += 1;
      else if (entry.rating === Rating.Good) mix.good += 1;
      else if (entry.rating === Rating.Easy) mix.easy += 1;
    }
  }
  return mix;
}

export interface CalendarDay {
  date: string;
  count: number;
}

/** One entry per day for the last `weeks` weeks, oldest first. */
export function computeCalendar(
  reviews: ReviewRecord[],
  now: Date = new Date(),
  weeks = 12
): CalendarDay[] {
  const days = weeks * 7;
  const buckets = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) buckets.set(dateKey(now.getTime() - i * DAY_MS), 0);
  for (const record of reviews) {
    for (const entry of record.log) {
      const key = dateKey(entry.ts);
      if (buckets.has(key)) buckets.set(key, buckets.get(key)! + 1);
    }
  }
  return [...buckets.entries()].map(([date, count]) => ({ date, count }));
}

export interface PaceWeek {
  /** ISO date of the week's first day. */
  weekStart: string;
  medianSec: number;
  answers: number;
}

/**
 * Median answer time per week, so the trend is visible as a shape rather than
 * only as a single "faster than before" delta - which cannot appear at all
 * until there are two windows to compare.
 */
export function computePaceTrend(
  reviews: ReviewRecord[],
  now: Date = new Date(),
  weeks = 6
): PaceWeek[] {
  const buckets = new Map<number, number[]>();
  const startOfWeek = (ts: number): number => {
    const d = new Date(ts);
    d.setUTCHours(0, 0, 0, 0);
    d.setUTCDate(d.getUTCDate() - d.getUTCDay());
    return d.getTime();
  };
  const oldest = startOfWeek(now.getTime() - (weeks - 1) * 7 * DAY_MS);
  for (let i = 0; i < weeks; i++) buckets.set(oldest + i * 7 * DAY_MS, []);

  for (const record of reviews) {
    for (const entry of record.log) {
      if (entry.elapsedMs <= 0 || entry.elapsedMs >= MAX_SANE_ANSWER_MS) continue;
      const key = startOfWeek(entry.ts);
      buckets.get(key)?.push(entry.elapsedMs);
    }
  }

  return [...buckets.entries()]
    .sort((a, b) => a[0] - b[0])
    .map(([ts, xs]) => {
      const s = [...xs].sort((a, b) => a - b);
      const mid = Math.floor(s.length / 2);
      const med = s.length === 0 ? 0 : s.length % 2 ? s[mid]! : (s[mid - 1]! + s[mid]!) / 2;
      return {
        weekStart: dateKey(ts),
        medianSec: Math.round((med / 1000) * 10) / 10,
        answers: xs.length,
      };
    });
}
