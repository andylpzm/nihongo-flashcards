import type { ReviewRecord } from './types';
import { dueAt as dueAtFor } from './scheduler';
import type { Card, CardId } from '../state/types';

/** Seats held for new cards even when reviews could fill the whole sitting. */
const NEW_CARD_RESERVE = 3;
/** seats held for the longest-unseen due words, so weakest-first cannot leave
 * the words he already knows waiting for months */
const OLD_CARD_RESERVE = 2;


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
  const due: { item: QueueItem; dueAt: number; stability: number; lastSeen: number }[] = [];
  const fresh: QueueItem[] = [];
  let nextDueAt: number | null = null;

  for (const card of candidateCards) {
    const review = reviewsByCardId.get(card.id);
    if (!review) {
      fresh.push({ card, isNew: true });
      continue;
    }
    const dueAt = dueAtFor(review.card);
    if (dueAt <= now.getTime()) {
      const lastSeen = review.log[review.log.length - 1]?.ts ?? 0;
      due.push({ item: { card, isNew: false }, dueAt, stability: review.card.stability, lastSeen });
    } else if (nextDueAt === null || dueAt < nextDueAt) {
      nextDueAt = dueAt;
    }
  }

  // weakest first, oldest first among equals. oldest-due-first made a word
  // learned yesterday wait behind every overdue word from months ago - with a
  // backlog bigger than a sitting it came back after weeks, not days.
  due.sort((a, b) => a.stability - b.stability || a.dueAt - b.dueAt);

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
  // with more due than fits, the longest-unseen get their own seats and the
  // weakest fill the rest. on chris's data this took known words from under one
  // a day to almost three on short sittings, for two fewer weak ones.
  const oldest =
    due.length > dueSeats
      ? [...due].sort((a, b) => a.lastSeen - b.lastSeen).slice(0, Math.min(OLD_CARD_RESERVE, dueSeats))
      : [];
  const admittedDue = [...oldest, ...due.filter((d) => !oldest.includes(d)).slice(0, dueSeats - oldest.length)].map(
    (d) => d.item
  );
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

/**
 * A sitting for a deck too small to schedule.
 *
 * The kana pools are 25-46 cards a tab. FSRS empties one in a single sitting
 * and then pushes every card days out, so the next queue comes back empty and
 * the bar sits on "Nothing due yet" - correct scheduling, useless practice.
 * These decks draw from the pool instead, and nothing here reads a due date.
 *
 * Least recently seen first, then shuffled. A plain random draw of 25 out of
 * the 46 basic hiragana repeats about half the deck every sitting; rotating by
 * staleness walks the whole pool and leaves only the ORDER random. Cards never
 * seen sort first, in deck order, so a fresh tab still starts at あ.
 */
export function buildRandomQueue(
  candidateCards: Card[],
  reviewsByCardId: Map<CardId, ReviewRecord>,
  sessionSize: number,
  rng: () => number = Math.random
): QueueBuildResult {
  const lastSeen = (card: Card): number => {
    const review = reviewsByCardId.get(card.id);
    const last = review?.log[review.log.length - 1];
    return last ? last.ts : -1;
  };

  const items = shuffle(
    [...candidateCards]
      .sort((a, b) => lastSeen(a) - lastSeen(b))
      .slice(0, Math.max(0, sessionSize))
      .map((card) => ({ card, isNew: !reviewsByCardId.has(card.id) })),
    rng
  );

  return {
    items,
    dueCount: items.filter((i) => !i.isNew).length,
    newCount: items.filter((i) => i.isNew).length,
    // nothing is withheld and nothing is scheduled, so the next-review
    // countdown cannot appear for these decks
    newHeldBack: 0,
    nextDueAt: null,
  };
}

function shuffle<T>(items: T[], rng: () => number): T[] {
  for (let i = items.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [items[i], items[j]] = [items[j]!, items[i]!];
  }
  return items;
}
