import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { CardId } from '../state/types';
import type { ReviewRecord, SessionRecord } from './types';

interface NihongoDB extends DBSchema {
  reviews: {
    key: CardId;
    value: ReviewRecord;
  };
  sessions: {
    key: number;
    value: SessionRecord;
  };
  meta: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'nihongo-srs';
/** v2 adds the `sessions` store (points are computed from it). The upgrade is
 * purely additive - every branch is guarded by a contains() check, so a v1
 * database gains the new store and keeps every review it already had. */
const DB_VERSION = 2;

let dbPromise: Promise<IDBPDatabase<NihongoDB>> | null = null;

function getDb(): Promise<IDBPDatabase<NihongoDB>> {
  if (!dbPromise) {
    dbPromise = openDB<NihongoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('reviews')) {
          db.createObjectStore('reviews', { keyPath: 'cardId' });
        }
        if (!db.objectStoreNames.contains('sessions')) {
          // Keyed by start time: unique in practice, and stable, so writing
          // the same session twice updates it instead of duplicating it.
          db.createObjectStore('sessions', { keyPath: 'startedAt' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta');
        }
      },
    });
  }
  return dbPromise;
}

/**
 * Asks the browser not to evict this origin's storage.
 *
 * Everything the user has ever done lives in this database and there is no
 * server copy, so eviction is total loss. Safari clears storage for sites left
 * unvisited for seven days; installing to the Home Screen mostly exempts the
 * app, and this makes it explicit. Best-effort by design: the browser may
 * refuse, and Firefox prompts, so nothing downstream depends on the result.
 */
export async function requestPersistentStorage(): Promise<boolean> {
  try {
    if (!navigator.storage?.persist) return false;
    if (await navigator.storage.persisted()) return true;
    return await navigator.storage.persist();
  } catch {
    return false;
  }
}

export async function getReview(cardId: CardId): Promise<ReviewRecord | undefined> {
  const db = await getDb();
  return db.get('reviews', cardId);
}

export async function getAllReviews(): Promise<ReviewRecord[]> {
  const db = await getDb();
  return db.getAll('reviews');
}

export async function putReview(record: ReviewRecord): Promise<void> {
  const db = await getDb();
  await db.put('reviews', record);
}

export async function getAllSessions(): Promise<SessionRecord[]> {
  const db = await getDb();
  return db.getAll('sessions');
}

export async function putSession(record: SessionRecord): Promise<void> {
  const db = await getDb();
  await db.put('sessions', record);
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const db = await getDb();
  return db.get('meta', key) as Promise<T | undefined>;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.put('meta', value, key);
}
