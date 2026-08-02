import { fsrs, generatorParameters, createEmptyCard, Rating, State } from 'ts-fsrs';
import type { RecordLogItem } from 'ts-fsrs';
import type { FsrsCard, Grade } from './types';

export { Rating, State };

const f = fsrs(generatorParameters({ enable_fuzz: true, maximum_interval: 365 }));

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
