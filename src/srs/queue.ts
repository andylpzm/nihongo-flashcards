import type { ReviewRecord } from './types';
import type { Card, CardId } from '../state/types';

/** Seats held for new cards even when reviews could fill the whole sitting. */
const NEW_CARD_RESERVE = 3;


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

  // Reviews get first claim on the sitting - they are scheduled work, new
  // cards are optional - but not the whole of it.
  //
  // A few seats are held back for new material, because pure review-priority
  // starves it completely for anyone who forgets more often than FSRS assumes.
  // Simulated over 180 days on the full deck with a learner recalling 72% on
  // schedule, every session filled with reviews from the third week onward and
  // only 181 of 1294 cards were ever introduced: six months of study without
  // meeting a new word. The reserve keeps the deck moving forward while still
  // giving the great majority of each sitting to the backlog.
  // Only bites when the backlog would take the entire sitting. With room to
  // spare, every due card still gets in and new cards simply top up - holding
  // seats back there would leave a due card unstudied for no reason.
  const backlogFillsSitting = due.length >= sessionSize;
  const reservedForNew = backlogFillsSitting ? Math.min(NEW_CARD_RESERVE, fresh.length) : 0;
  const dueSeats = Math.max(0, sessionSize - reservedForNew);
  const admittedDue = due.slice(0, dueSeats).map((d) => d.item);
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
