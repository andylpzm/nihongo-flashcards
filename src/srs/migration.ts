import { State, Rating } from './scheduler';
import type { FsrsCard, ReviewRecord } from './types';
import { getAllReviews, putReview, getMeta, setMeta } from './db';
import { loadMasteredIds, loadStoryMasteredIds } from '../state/persistence';

export const CURRENT_SCHEMA_VERSION = 2;
const MASTERED_INTERVAL_DAYS = 21;

/**
 * One-time migration from the old boolean "mastered" localStorage sets to real
 * FSRS review records in IndexedDB. Idempotent (guarded by a schemaVersion
 * marker) and additive only - the old localStorage keys are never touched, so
 * they remain a rollback path if this migration needs to be redone.
 *
 * Also merges nihongo_mastered_ids and nihongo_story_mastered_ids into a
 * single review store, fixing the old bug where the same word learned via
 * story mode and via vocabulary mode tracked mastery separately (B10).
 */
export async function runMigrationIfNeeded(now: Date = new Date()): Promise<{ migrated: number }> {
  const version = await getMeta<number>('schemaVersion');
  if (version !== undefined && version >= CURRENT_SCHEMA_VERSION) {
    return { migrated: 0 };
  }

  const existing = await getAllReviews();
  const alreadyMigratedIds = new Set(existing.map((r) => r.cardId));

  const masteredIds = loadMasteredIds();
  const storyMasteredIds = loadStoryMasteredIds();
  const allMasteredIds = new Set([...masteredIds, ...storyMasteredIds]);

  const due = new Date(now.getTime() + MASTERED_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
  let migrated = 0;

  for (const cardId of allMasteredIds) {
    if (alreadyMigratedIds.has(cardId)) continue;

    const card: FsrsCard = {
      due,
      stability: MASTERED_INTERVAL_DAYS,
      difficulty: 5,
      elapsed_days: 0,
      scheduled_days: MASTERED_INTERVAL_DAYS,
      learning_steps: 0,
      reps: 1,
      lapses: 0,
      state: State.Review,
      last_review: now,
    };

    const record: ReviewRecord = {
      cardId,
      card,
      log: [{ ts: now.getTime(), rating: Rating.Good, elapsedMs: 0 }],
    };

    await putReview(record);
    migrated++;
  }

  await setMeta('schemaVersion', CURRENT_SCHEMA_VERSION);
  return { migrated };
}
