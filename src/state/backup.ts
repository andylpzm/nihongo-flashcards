// Export and restore.
//
// There is no server copy of any of this. Clearing Safari's website data, or
// getting a new phone, is otherwise total and permanent loss of every review,
// every session and every point. This file is the only way any of it leaves
// the device.
//
// Two things it is careful about:
//
//   1. IndexedDB stores real Date objects; JSON does not. Every Date is written
//      as an ISO string and revived on the way back in. Miss one and the
//      scheduler silently starts comparing a string to a Date, which does not
//      throw - it just quietly reschedules everything wrongly.
//   2. Restore REPLACES. Everything here validates hard and reports what it is
//      about to do before anything is written, because getting this wrong
//      destroys exactly the data it exists to protect.

import { getAllReviews, putReview, getAllSessions, putSession } from '../srs/db';
import { loadProfile, saveProfile, resetProfileCache, type Profile } from './profile';
import { coercePos } from './imagePos';
import type { ReviewRecord, SessionRecord } from '../srs/types';

export const BACKUP_FORMAT = 'nihongo-flashcards-backup';
export const BACKUP_VERSION = 1;

const LOCAL_STORAGE_PREFIX = 'nihongo_';

export interface BackupBundle {
  format: typeof BACKUP_FORMAT;
  version: number;
  exportedAt: number;
  reviews: unknown[];
  sessions: SessionRecord[];
  profile: Profile;
  settings: Record<string, string>;
}

/** Everything on the device, in one JSON-safe object. */
export async function buildBackup(now: Date = new Date()): Promise<BackupBundle> {
  const [reviews, sessions, profile] = await Promise.all([
    getAllReviews(),
    getAllSessions(),
    loadProfile(),
  ]);

  const settings: Record<string, string> = {};
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(LOCAL_STORAGE_PREFIX)) continue;
      const value = localStorage.getItem(key);
      if (value !== null) settings[key] = value;
    }
  } catch {
    // A backup missing preferences still beats no backup.
  }

  return {
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    exportedAt: now.getTime(),
    reviews: reviews.map(serialiseReview),
    sessions,
    profile,
    settings,
  };
}

function serialiseReview(record: ReviewRecord): unknown {
  const card = record.card as unknown as Record<string, unknown>;
  return {
    ...record,
    card: {
      ...card,
      due: toIso(card.due),
      last_review: card.last_review ? toIso(card.last_review) : undefined,
    },
  };
}

function toIso(value: unknown): string | undefined {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return new Date(value).toISOString();
  return undefined;
}

function toDate(value: unknown): Date | undefined {
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? undefined : value;
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }
  return undefined;
}

export interface BackupSummary {
  exportedAt: number;
  reviews: number;
  sessions: number;
  name: string;
}

export type ParseResult =
  | { ok: true; bundle: BackupBundle; summary: BackupSummary }
  | { ok: false; error: string };

/**
 * Validates a pasted or loaded backup without touching storage.
 *
 * Separate from applying it so the UI can describe what will happen and get a
 * yes before anything is overwritten.
 */
export function parseBackup(text: string): ParseResult {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'That is not a backup file. Choose the .json the app saved.' };
  }

  if (!raw || typeof raw !== 'object') {
    return { ok: false, error: 'That file does not look like a backup.' };
  }

  const b = raw as Partial<BackupBundle>;
  if (b.format !== BACKUP_FORMAT) {
    return { ok: false, error: 'That is not a Nihongo Cards backup file.' };
  }
  if (typeof b.version !== 'number' || b.version > BACKUP_VERSION) {
    return {
      ok: false,
      error: 'That backup was made by a newer version of the app. Update first, then restore.',
    };
  }
  if (!Array.isArray(b.reviews) || !Array.isArray(b.sessions)) {
    return { ok: false, error: 'That backup is missing its study data and cannot be restored.' };
  }

  const bundle: BackupBundle = {
    format: BACKUP_FORMAT,
    version: b.version,
    exportedAt: typeof b.exportedAt === 'number' ? b.exportedAt : 0,
    reviews: b.reviews,
    sessions: b.sessions.filter(isSessionRecord),
    profile: (b.profile ?? {}) as Profile,
    settings: b.settings && typeof b.settings === 'object' ? b.settings : {},
  };

  return {
    ok: true,
    bundle,
    summary: {
      exportedAt: bundle.exportedAt,
      reviews: bundle.reviews.length,
      sessions: bundle.sessions.length,
      name: typeof bundle.profile?.name === 'string' ? bundle.profile.name : '',
    },
  };
}

function isSessionRecord(value: unknown): value is SessionRecord {
  if (!value || typeof value !== 'object') return false;
  const s = value as Partial<SessionRecord>;
  return typeof s.startedAt === 'number' && typeof s.answers === 'number';
}

/** A review is only restored if its Date fields survive revival. */
function reviveReview(value: unknown): ReviewRecord | null {
  if (!value || typeof value !== 'object') return null;
  const r = value as Record<string, unknown>;
  if (r.cardId === undefined || !r.card || typeof r.card !== 'object') return null;

  const card = { ...(r.card as Record<string, unknown>) };
  const due = toDate(card.due);
  if (!due) return null;
  card.due = due;

  const lastReview = toDate(card.last_review);
  if (lastReview) card.last_review = lastReview;
  else delete card.last_review;

  const log = Array.isArray(r.log) ? r.log : [];

  return {
    cardId: r.cardId as ReviewRecord['cardId'],
    card: card as unknown as ReviewRecord['card'],
    log: log as ReviewRecord['log'],
  };
}

export interface RestoreResult {
  reviews: number;
  sessions: number;
  skipped: number;
}

/**
 * Writes a validated bundle over the current data.
 *
 * Additive at the record level - existing rows with the same key are replaced,
 * rows not mentioned by the backup are left alone. That makes restoring onto a
 * device that has been used since the backup a merge rather than a wipe, which
 * is the forgiving direction to get this wrong in.
 */
/**
 * the seen list out of a restored bundle, old single-index form included - a
 * restore that dropped this would ask for every picture to be unwrapped again.
 */
function restoreSeen(p: Profile): string[] {
  const wide = p as Profile & { seenUnlocks?: unknown };
  if (Array.isArray(wide.seenPictures))
    return wide.seenPictures.filter((x: unknown): x is string => typeof x === 'string');
  const legacy = wide.seenUnlocks;
  return typeof legacy === 'number' && legacy > 0 ? [`#${Math.floor(legacy)}`] : [];
}

/** just before the earliest sitting in the bundle, so all of it still counts */
function oldestSessionStart(sessions: SessionRecord[]): number {
  let oldest = Infinity;
  for (const s of sessions) if (typeof s.startedAt === 'number' && s.startedAt < oldest) oldest = s.startedAt;
  return Number.isFinite(oldest) ? oldest - 1 : Date.now();
}

export async function applyBackup(bundle: BackupBundle): Promise<RestoreResult> {
  let reviews = 0;
  let skipped = 0;

  for (const raw of bundle.reviews) {
    const record = reviveReview(raw);
    if (!record) {
      skipped++;
      continue;
    }
    await putReview(record);
    reviews++;
  }

  let sessions = 0;
  for (const session of bundle.sessions) {
    await putSession({
      startedAt: session.startedAt,
      endedAt: typeof session.endedAt === 'number' ? session.endedAt : session.startedAt,
      deck: typeof session.deck === 'string' ? session.deck : 'vocabulary',
      answers: Math.max(0, session.answers),
      completed: session.completed === true,
    });
    sessions++;
  }

  try {
    for (const [key, value] of Object.entries(bundle.settings)) {
      if (key.startsWith(LOCAL_STORAGE_PREFIX)) localStorage.setItem(key, value);
    }
  } catch {
    // Preferences are the least of it; the study data is already in.
  }

  if (bundle.profile && typeof bundle.profile === 'object') {
    resetProfileCache();
    await saveProfile({
      name: typeof bundle.profile.name === 'string' ? bundle.profile.name : '',
      // the moment xp started counting. losing this is not cosmetic: the next
      // boot would stamp a fresh epoch, every restored session would predate
      // it, and the whole collection would read as unearned. a backup taken
      // before the epoch existed gets one just ahead of its oldest sitting, so
      // the history it holds still counts.
      pointsEpoch:
        typeof bundle.profile.pointsEpoch === 'number' && bundle.profile.pointsEpoch > 0
          ? bundle.profile.pointsEpoch
          : oldestSessionStart(bundle.sessions),
      // whether the binder has been opened for the first time. restoring
      // without it would re-lock a binder that has been in use for months.
      binderRevealed: bundle.profile.binderRevealed === true,
      // today's claimed bonus, or it can be claimed a second time on the phone
      // the backup lands on
      claimedBonusOn:
        typeof bundle.profile.claimedBonusOn === 'string' ? bundle.profile.claimedBonusOn : '',
      seenPoints: typeof bundle.profile.seenPoints === 'number' ? bundle.profile.seenPoints : -1,
      createdAt:
        typeof bundle.profile.createdAt === 'number' ? bundle.profile.createdAt : Date.now(),
      // carried across from the old single-index form as well - a restore that
      // dropped this would ask for every picture to be unwrapped again
      seenPictures: restoreSeen(bundle.profile),
      lastBackupAt:
        typeof bundle.profile.lastBackupAt === 'number' ? bundle.profile.lastBackupAt : null,
      // the picture is the one part of a profile the user made themselves, so
      // it has to survive a restore along with where they positioned it
      avatar: typeof bundle.profile.avatar === 'string' ? bundle.profile.avatar : '',
      avatarPos: coercePos(bundle.profile.avatarPos),
      banner: typeof bundle.profile.banner === 'string' ? bundle.profile.banner : '',
      bannerPos: coercePos(bundle.profile.bannerPos),
    });
  }

  return { reviews, sessions, skipped };
}

export function backupFilename(now: Date = new Date()): string {
  const stamp = now.toISOString().slice(0, 10);
  return `nihongo-cards-backup-${stamp}.json`;
}
