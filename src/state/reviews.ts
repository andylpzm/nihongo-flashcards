import { getAllReviews, putReview } from '../srs/db';
import type { ReviewRecord, Grade, FsrsCard } from '../srs/types';
import type { Card, CardId } from './types';

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

  return record;
}
