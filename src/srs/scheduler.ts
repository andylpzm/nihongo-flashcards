import { fsrs, generatorParameters, createEmptyCard, Rating, State } from 'ts-fsrs';
import type { RecordLogItem } from 'ts-fsrs';
import type { FsrsCard, Grade } from './types';

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
const f = fsrs(
  generatorParameters({
    enable_fuzz: true,
    maximum_interval: 365,
    learning_steps: [],
    relearning_steps: [],
  })
);

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

/** Human-readable interval label for a grade button, e.g. "10m", "3d". */
export function formatInterval(dueDate: Date, now: Date = new Date()): string {
  const diffMs = dueDate.getTime() - now.getTime();
  const diffMinutes = Math.round(diffMs / (60 * 1000));
  if (diffMinutes < 60) return `${Math.max(1, diffMinutes)}m`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}h`;
  const diffDays = Math.round(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d`;
  const diffMonths = Math.round(diffDays / 30);
  return `${diffMonths}mo`;
}
