import { getAllReviews, putReview } from '../srs/db';
import { State } from '../srs/scheduler';
import type { ReviewRecord, Grade, FsrsCard } from '../srs/types';
import type { Card, CardId } from './types';
import { loadDailyProgress, saveDailyProgress, type DailyProgress } from './persistence';

function todayKey(now: Date): string {
  return now.toISOString().slice(0, 10);
}

function todayProgress(now: Date): DailyProgress {
  const progress = loadDailyProgress();
  const today = todayKey(now);
  return progress.date === today ? progress : { date: today, newCount: 0, reviewCount: 0, extraNew: 0 };
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

function bumpDailyProgress(kind: 'new' | 'review', now: Date): void {
  const progress = todayProgress(now);
  saveDailyProgress({
    ...progress,
    newCount: progress.newCount + (kind === 'new' ? 1 : 0),
    reviewCount: progress.reviewCount + (kind === 'review' ? 1 : 0),
  });
}

/**
 * Grade a card: persists the already-scheduled FSRS card to IndexedDB and
 * updates the in-memory cache.
 *
 * The scheduled card is passed in (rather than computed here via
 * scheduleReview()) so the interval the UI advertised is the interval that
 * gets written. With enable_fuzz on, a second scheduling call re-rolls fuzz
 * and produces a different due date than the one shown on the button - see
 * D10/D11 in SESSION_REBUILD_PLAN.md.
 */
export async function recordGrade(
  card: Card,
  grade: Grade,
  scheduled: FsrsCard,
  now: Date = new Date(),
  elapsedMs = 0
): Promise<ReviewRecord> {
  const existing = reviewsByCardId.get(card.id);
  const record: ReviewRecord = {
    cardId: card.id,
    card: scheduled,
    log: [...(existing?.log ?? []), { ts: now.getTime(), rating: grade, elapsedMs }],
  };

  await putReview(record);
  reviewsByCardId.set(card.id, record);
  bumpDailyProgress(existing ? 'review' : 'new', now);

  return record;
}
