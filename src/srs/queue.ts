import type { ReviewRecord } from './types';
import type { Card, CardId } from '../state/types';


/** A card in the queue. Deliberately carries no ReviewRecord: the record changes
 * every time the card is graded, and a re-queued item must preview intervals from
 * the *current* record, not the one captured when the queue was built. Look it up
 * with getReview(item.card.id) at the point of use. */
export interface QueueItem {
  card: Card;
  /** True if the card had never been reviewed when the session started. */
  isNew: boolean;
}

export interface QueueBuildResult {
  items: QueueItem[];
  /** Cards already due right now, before the daily review cap is applied. */
  dueCount: number;
  /** New cards actually admitted, after the daily new-card budget. */
  newCount: number;
  /** New cards in the deck that exist but weren't admitted today. */
  newHeldBack: number;
  /** Earliest future due time among candidates, or null if none are scheduled. */
  nextDueAt: Date | null;
}

export function buildQueue(
  candidateCards: Card[],
  reviewsByCardId: Map<CardId, ReviewRecord>,
  /** Distinct cards allowed in this sitting - SESSION_SIZES[sessionLength].
   * This is the only limit; there are deliberately no daily caps, which used
   * to silently shrink a session below the length the user picked. */
  sessionSize: number,
  now: Date = new Date()
): QueueBuildResult {
  const due: { item: QueueItem; dueAt: number }[] = [];
  const fresh: QueueItem[] = [];
  let nextDueAt: number | null = null;

  for (const card of candidateCards) {
    const review = reviewsByCardId.get(card.id);
    if (!review) {
      fresh.push({ card, isNew: true });
      continue;
    }
    const dueAt = review.card.due.getTime();
    if (dueAt <= now.getTime()) {
      due.push({ item: { card, isNew: false }, dueAt });
    } else if (nextDueAt === null || dueAt < nextDueAt) {
      nextDueAt = dueAt;
    }
  }

  due.sort((a, b) => a.dueAt - b.dueAt);

  // Due reviews get first claim on the sitting, then new cards top it up. This
  // ordering matters: reviews are already scheduled work, new cards are optional.
  const admittedDue = due.slice(0, Math.max(0, sessionSize)).map((d) => d.item);
  const roomLeft = Math.max(0, sessionSize - admittedDue.length);
  const admittedNew = fresh.slice(0, roomLeft);

  return {
    items: [...admittedDue, ...admittedNew],
    dueCount: due.length,
    newCount: admittedNew.length,
    newHeldBack: fresh.length - admittedNew.length,
    nextDueAt: nextDueAt === null ? null : new Date(nextDueAt),
  };
}
