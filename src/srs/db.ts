import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { CardId } from '../state/types';
import type { ReviewRecord } from './types';

interface NihongoDB extends DBSchema {
  reviews: {
    key: CardId;
    value: ReviewRecord;
  };
  meta: {
    key: string;
    value: unknown;
  };
}

const DB_NAME = 'nihongo-srs';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase<NihongoDB>> | null = null;

function getDb(): Promise<IDBPDatabase<NihongoDB>> {
  if (!dbPromise) {
    dbPromise = openDB<NihongoDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('reviews')) {
          db.createObjectStore('reviews', { keyPath: 'cardId' });
        }
        if (!db.objectStoreNames.contains('meta')) {
          db.createObjectStore('meta');
        }
      },
    });
  }
  return dbPromise;
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

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const db = await getDb();
  return db.get('meta', key) as Promise<T | undefined>;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await db.put('meta', value, key);
}
