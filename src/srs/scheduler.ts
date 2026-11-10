import { fsrs, generatorParameters, createEmptyCard, Rating, State } from 'ts-fsrs';
import type { RecordLogItem } from 'ts-fsrs';
import type { FsrsCard, Grade } from './types';
import { UPDATE_SHIPS_ON } from './dates';

export { Rating, State };

/**
 * No learning steps, deliberately.
 *
 * FSRS models retention across days and its optimiser discounts same-day
 * repeats - they sit largely outside what it predicts. Steps are a carry-over
 * from SM-2-era scheduling, and here they cost more than they returned: three
 * of the four grade buttons did not end a card's turn, so a "10 card" session
 * took 17 answers, the grade history recorded mid-struggle presses as if they
 * were verdicts, and cards piled up in a Learning state that only existed
 * because of the steps themselves.
 *
 * One answer now sets the real schedule. The second look at a card you failed
 * is handled by the session queue instead (see session.ts), which targets the
 * repetition at the cards that actually need it rather than every card.
 */
// chris wants a lot of repetition. a word answered right is due again after
// 1, 2, 4, 7, 13 days and then every two weeks at most.
const RETENTION = 0.97;
const MAX_INTERVAL_DAYS = 14;

const f = fsrs(
  generatorParameters({
    enable_fuzz: true,
    request_retention: RETENTION,
    maximum_interval: MAX_INTERVAL_DAYS,
    learning_steps: [],
    relearning_steps: [],
  })
);

const DAY_MS = 24 * 60 * 60 * 1000;
const intervalModifier = f.calculate_interval_modifier(RETENTION);

/** when a card is due. words graded before the change still carry their old,
 * longer due dates - this pulls them in without rewriting what is stored. */
export function dueAt(card: FsrsCard): number {
  const stored = card.due.getTime();
  if (!card.last_review || new Date(card.last_review).getTime() >= UPDATE_SHIPS_ON) return stored;
  const days = Math.min(Math.max(1, Math.round(card.stability * intervalModifier)), MAX_INTERVAL_DAYS);
  return Math.min(stored, new Date(card.last_review).getTime() + days * DAY_MS);
}

/** A brand-new card, never reviewed. */
export function newFsrsCard(now: Date = new Date()): FsrsCard {
  return createEmptyCard(now);
}

/** Schedule the next review for a card given a grade (Again/Hard/Good/Easy). */
export function scheduleReview(
  card: FsrsCard,
  grade: Grade,
  now: Date = new Date()
): RecordLogItem {
  return f.next(card, now, grade);
}

/** Preview the resulting interval for each grade, without committing it - used to
 * label the four grade buttons with their resulting interval before the user picks one. */
export function previewIntervals(card: FsrsCard, now: Date = new Date()): Record<Grade, RecordLogItem> {
  const preview = f.repeat(card, now);
  const result = {} as Record<Grade, RecordLogItem>;
  for (const item of preview) {
    result[item.log.rating as Grade] = item;
  }
  return result;
}
