import { getAllReviews, putReview } from '../srs/db';
import { newFsrsCard, scheduleReview, State } from '../srs/scheduler';
import type { ReviewRecord, Grade } from '../srs/types';
import type { Card, CardId } from './types';
import { loadDailyNewProgress, saveDailyNewProgress } from './persistence';

function todayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

/** How many new cards are still available today, given the newPerDay budget
 * and how many new cards have already been introduced today across any
 * earlier sessions (not just the current one). */
export function getRemainingNewBudget(newPerDay: number, now: Date = new Date()): number {
  const progress = loadDailyNewProgress();
  const usedToday = progress.date === todayKey(now) ? progress.count : 0;
  return Math.max(0, newPerDay - usedToday);
}

/** A card is considered durably "learned" once it has graduated to FSRS
 * Review state with a stability past the old app's mastery bar. Mirrors
 * srs/stats.ts's countLearned() threshold for a single-card check. */
const MASTERED_STABILITY_DAYS = 21;

/**
 * In-memory cache of every review record, mirrored from IndexedDB. Loaded
 * once per app session and kept in sync as reviews are recorded, so the UI
 * (filters, progress header, stats view) can read it synchronously instead
 * of awaiting IndexedDB on every render.
 */
let reviewsByCardId = new Map<CardId, ReviewRecord>();
let loaded = false;

export async function ensureReviewsLoaded(): Promise<Map<CardId, ReviewRecord>> {
  if (!loaded) {
    const all = await getAllReviews();
    reviewsByCardId = new Map(all.map((r) => [r.cardId, r]));
    loaded = true;
  }
  return reviewsByCardId;
}

export function getReviewsSnapshot(): Map<CardId, ReviewRecord> {
  return reviewsByCardId;
}

export function getReview(cardId: CardId): ReviewRecord | undefined {
  return reviewsByCardId.get(cardId);
}

export function isCardMastered(cardId: CardId): boolean {
  const review = reviewsByCardId.get(cardId);
  return !!review && review.card.state === State.Review && review.card.stability >= MASTERED_STABILITY_DAYS;
}

/** Grade a card: schedules its next review via FSRS, persists the updated
 * record to IndexedDB, and updates the in-memory cache. */
export async function recordGrade(
  card: Card,
  grade: Grade,
  now: Date = new Date(),
  elapsedMs = 0
): Promise<ReviewRecord> {
  const existing = reviewsByCardId.get(card.id);
  const fsrsCard = existing ? existing.card : newFsrsCard(now);
  const { card: scheduled } = scheduleReview(fsrsCard, grade, now);

  const record: ReviewRecord = {
    cardId: card.id,
    card: scheduled,
    log: [...(existing?.log ?? []), { ts: now.getTime(), rating: grade, elapsedMs }],
  };

  await putReview(record);
  reviewsByCardId.set(card.id, record);

  if (!existing) {
    // This card had never been reviewed before - it counts against today's
    // newPerDay budget regardless of which session introduced it.
    const progress = loadDailyNewProgress();
    const today = todayKey(now);
    saveDailyNewProgress({
      date: today,
      count: (progress.date === today ? progress.count : 0) + 1,
    });
  }

  return record;
}
