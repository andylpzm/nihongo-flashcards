// Profile and points, the stateful layer over the pure engine in srs/points.ts.
//
// Lives in IndexedDB's `meta` store rather than localStorage, deliberately: the
// reviews and sessions it describes are in the same database, so a partial
// clear cannot leave a points total describing history that is no longer there.
//
// The stored total is a CACHE. Every load recomputes from the sessions store
// and takes the computed value as truth, so a corrupted, stale or absent number
// costs one recomputation and nothing else.

import { getMeta, setMeta, getAllSessions, putSession } from '../srs/db';
import {
  computePoints,
  rankFor,
  decksStudied,
  missionXpFor,
  MISSION_DECKS,
  MISSION_XP,
  ALL_MISSIONS_XP,
  type PointsSummary,
  type Rank,
} from '../srs/points';
import { dateKey } from '../srs/dates';
import { legacyTotal } from '../srs/legacyPoints';
import {
  newlyUnlocked,
  countUnlocked,
  countPieces,
  type GallerySaga,
  type UnlockBatch,
} from '../srs/gallery';
import type { SessionRecord } from '../srs/types';
import { coercePos, cropRect, DEFAULT_POS, type ImagePos } from './imagePos';

const PROFILE_KEY = 'profile';

export interface Profile {
  name: string;
  /** the user's own photo, already shrunk, as a data url. empty for none. */
  avatar: string;
  /** how the avatar picture sits in its round frame */
  avatarPos: ImagePos;
  /** path of an unlocked gallery image, e.g. 'gallery/ch-004.jpg'. empty for none. */
  banner: string;
  /** how the banner sits in the card's art area */
  bannerPos: ImagePos;
  createdAt: number;
  /** Cache of computePoints().total - never trusted over a fresh computation. */
  cachedPoints: number;
  /**
   * the pictures that have actually been opened, by id.
   *
   * this used to be a single high-water index - "everything up to N is seen".
   * that cannot express "12 and 14 opened, 13 not", which is the normal case
   * when several unlock at once and get opened out of order, and it is exactly
   * what the frosted reveal has to know.
   */
  seenPictures: string[];
  /**
   * whether the binder tab has been opened for the first time.
   *
   * it starts as a padlock with no name. the first picture earned turns it
   * into something worth tapping, and that tap - not a session summary - is
   * where the binder is introduced. once revealed it never goes back.
   */
  binderRevealed: boolean;
  /**
   * the moment xp started counting, in ms.
   *
   * points are derived from the whole sessions store, so when the binder
   * arrived in an app chris had already been studying in for weeks, his back
   * catalogue silently bought the first seven cards before he had seen the
   * binder exist. the collection is meant to be earned from the day it opens,
   * so anything studied before this instant pays nothing towards it.
   *
   * 0 means "not stamped yet" - the next boot sets it, which for a fresh
   * install is a moment before the first session and so costs nothing.
   */
  pointsEpoch: number;
  /**
   * the total the profile card last showed, so xp earned while away can be
   * counted up in front of the user instead of already being there.
   *
   * -1 means "never shown" - the card then opens on the real total rather than
   * animating a lifetime of xp at somebody who has just installed a backup.
   */
  seenPoints: number;
  /**
   * the day whose completion bonus has been collected, as a local date key.
   *
   * the only piece of progress here that is not derived from the sessions
   * store - a claim is something the user did, with no session behind it to
   * replay. what happens to a day that ends unclaimed is not settled yet; for
   * now this only gates the prize in the ui.
   */
  claimedBonusOn: string;
  /**
   * xp banked under the old per-answer economy, frozen once.
   *
   * the total is a replay, so the new flat scoring would rescore everything
   * chris has ever done and move a number the gallery unlocks are keyed to.
   * this holds the old answer; only sittings after `legacyUntil` are scored
   * the new way, on top of it. see srs/legacyPoints.ts.
   */
  legacyPoints: number;
  /** when that freeze happened, in ms. 0 means "not frozen yet". */
  legacyUntil: number;
  lastBackupAt: number | null;
}

export const DEFAULT_NAME = 'Chris';

function blankProfile(now = Date.now()): Profile {
  return {
    name: '',
    avatar: '',
    avatarPos: { ...DEFAULT_POS },
    banner: '',
    bannerPos: { ...DEFAULT_POS },
    createdAt: now,
    cachedPoints: 0,
    seenPictures: [],
    binderRevealed: false,
    pointsEpoch: 0,
    seenPoints: -1,
    claimedBonusOn: '',
    legacyPoints: 0,
    legacyUntil: 0,
    lastBackupAt: null,
  };
}

/** Tolerates any shape - this is read from storage the user could have edited. */
export function coerce(raw: unknown, now = Date.now()): Profile {
  const base = blankProfile(now);
  if (!raw || typeof raw !== 'object') return base;
  const p = raw as Partial<Profile>;
  return {
    name: typeof p.name === 'string' ? p.name.slice(0, 24) : base.name,
    avatar: typeof p.avatar === 'string' ? p.avatar : base.avatar,
    avatarPos: coercePos(p.avatarPos),
    banner: typeof p.banner === 'string' ? p.banner : base.banner,
    bannerPos: coercePos(p.bannerPos),
    createdAt: typeof p.createdAt === 'number' ? p.createdAt : base.createdAt,
    cachedPoints: typeof p.cachedPoints === 'number' ? p.cachedPoints : base.cachedPoints,
    seenPictures: coerceSeen(p),
    binderRevealed: p.binderRevealed === true,
    pointsEpoch: typeof p.pointsEpoch === 'number' ? p.pointsEpoch : base.pointsEpoch,
    seenPoints: typeof p.seenPoints === 'number' ? p.seenPoints : base.seenPoints,
    claimedBonusOn: typeof p.claimedBonusOn === 'string' ? p.claimedBonusOn : base.claimedBonusOn,
    legacyPoints: typeof p.legacyPoints === 'number' ? p.legacyPoints : base.legacyPoints,
    legacyUntil: typeof p.legacyUntil === 'number' ? p.legacyUntil : base.legacyUntil,
    lastBackupAt: typeof p.lastBackupAt === 'number' ? p.lastBackupAt : null,
  };
}

/**
 * reads the seen list, carrying the old single-number form across.
 *
 * a profile written before the frosted reveal has `seenUnlocks: N` meaning the
 * first N pictures were seen. their ids are not known here, so they are marked
 * with an index sentinel that `hasSeen` understands - nobody is asked to unwrap
 * a picture they already looked at.
 */
function coerceSeen(p: Partial<Profile> & { seenUnlocks?: unknown }): string[] {
  const raw = (p as { seenPictures?: unknown }).seenPictures;
  if (Array.isArray(raw)) return raw.filter((x): x is string => typeof x === 'string');
  const legacy = p.seenUnlocks;
  return typeof legacy === 'number' && legacy > 0 ? [`#${Math.floor(legacy)}`] : [];
}

/** the legacy sentinel, if one survives: everything up to this index was seen */
function legacyHighWater(seen: string[]): number {
  let n = 0;
  for (const s of seen) if (s.startsWith('#')) n = Math.max(n, Number(s.slice(1)) || 0);
  return n;
}

/** has this picture been opened? `index` is its 1-based place in the gallery */
export function hasSeen(profile: Profile, id: string, index: number): boolean {
  if (profile.seenPictures.includes(id)) return true;
  // index 0 means "position unknown" - it must not satisfy a high water of 0,
  // or every unindexed picture counts as already seen
  return index > 0 && index <= legacyHighWater(profile.seenPictures);
}

/** records that a picture has been opened. returns true if this was the first time */
export async function markSeen(id: string): Promise<boolean> {
  const profile = await loadProfile();
  if (profile.seenPictures.includes(id)) return false;
  await saveProfile({ seenPictures: [...profile.seenPictures, id] });
  return true;
}

let cached: Profile | null = null;

export async function loadProfile(): Promise<Profile> {
  if (cached) return cached;
  cached = coerce(await getMeta<unknown>(PROFILE_KEY));
  return cached;
}

export async function saveProfile(patch: Partial<Profile>): Promise<Profile> {
  const current = await loadProfile();
  const next = { ...current, ...patch };
  cached = next;
  await setMeta(PROFILE_KEY, next);
  return next;
}

/** The name to greet with. Falls back so the splash is never blank. */
export function displayName(profile: Profile): string {
  return profile.name.trim() || DEFAULT_NAME;
}

/**
 * stamps the moment xp starts counting, once.
 *
 * called at boot. on a fresh install this lands before the first session and
 * changes nothing; on an upgrade it draws the line under everything studied
 * before the binder existed.
 */
export async function startPointsClock(now: Date = new Date()): Promise<void> {
  const profile = await loadProfile();
  if (profile.pointsEpoch) return;
  await saveProfile({ pointsEpoch: now.getTime() });
}

/** True until the user has been asked for a name even once. */
export function needsNamePrompt(profile: Profile): boolean {
  return profile.name === '';
}

/**
 * Freezes the old per-answer total, once, before any new scoring happens.
 *
 * Called at boot next to startPointsClock(). On a fresh install there are no
 * sittings, so this stamps a zero and costs nothing; on an upgrade it is the
 * only thing standing between chris and a total that moves under him.
 */
export async function freezeLegacyPoints(now: Date = new Date()): Promise<void> {
  const profile = await loadProfile();
  if (profile.legacyUntil) return;
  const all = await getAllSessions();
  const sessions = profile.pointsEpoch
    ? all.filter((s) => s.startedAt >= profile.pointsEpoch)
    : all;
  await saveProfile({ legacyPoints: legacyTotal(sessions), legacyUntil: now.getTime() });
}

export interface PointsState {
  summary: PointsSummary;
  rank: Rank;
}

/**
 * Current points, recomputed from the sessions store.
 *
 * Writes the result back to the profile cache when it disagrees, so the
 * self-heal is silent and automatic rather than something anyone has to
 * remember to trigger.
 */
export async function getPointsState(now: Date = new Date()): Promise<PointsState> {
  const profile = await loadProfile();
  const all = await getAllSessions();
  // sittings from before the binder existed do not pay towards it
  const sessions = profile.pointsEpoch ? all.filter((s) => s.startedAt >= profile.pointsEpoch) : all;
  // everything up to the freeze is already counted in legacyPoints and must
  // not be scored twice - but its DAYS still feed the streak, or the upgrade
  // would read as a first-ever session and reset a streak weeks long.
  const fresh = sessions.filter((s) => s.startedAt >= profile.legacyUntil);
  const priorDays = new Set(
    sessions.filter((s) => s.startedAt < profile.legacyUntil).map((s) => dateKey(s.startedAt))
  );
  const summary = computePoints(fresh, now, {
    startingTotal: profile.legacyPoints,
    priorDays,
  });
  if (profile.cachedPoints !== summary.total) {
    await saveProfile({ cachedPoints: summary.total });
  }
  return { summary, rank: rankFor(summary.total) };
}

export interface SessionOutcome {
  pointsEarned: number;
  /** what the sitting itself paid, before any daily */
  sessionPoints: number;
  /** what completing a deck's daily paid, if this sitting completed one */
  missionPoints: number;
  totalBefore: number;
  totalAfter: number;
  rank: Rank;
  /** rank went up as a result of this sitting */
  promoted: boolean;
  unlocked: UnlockBatch;
}

/**
 * Records a finished sitting and reports what it earned.
 *
 * The before/after totals both come from a full recomputation rather than from
 * arithmetic on the cache, so the announced figure is always exactly what the
 * Progress page will show a moment later - the two can never drift apart.
 */
export async function recordSession(
  session: SessionRecord,
  sagas: GallerySaga[],
  now: Date = new Date()
): Promise<SessionOutcome> {
  const before = await getPointsState(now);

  await putSession(session);

  const after = await getPointsState(now);
  const totalBefore = before.summary.total;
  const totalAfter = after.summary.total;

  const missionPoints = after.summary.missionTotal - before.summary.missionTotal;

  return {
    pointsEarned: totalAfter - totalBefore,
    sessionPoints: totalAfter - totalBefore - missionPoints,
    missionPoints,
    totalBefore,
    totalAfter,
    rank: after.rank,
    promoted: after.rank.index > before.rank.index,
    unlocked: newlyUnlocked(sagas, totalBefore, totalAfter),
  };
}

export async function galleryProgress(
  sagas: GallerySaga[],
  now: Date = new Date()
): Promise<{ unlocked: number; total: number; points: number }> {
  const { summary } = await getPointsState(now);
  return {
    unlocked: countUnlocked(sagas, summary.total),
    total: countPieces(sagas),
    points: summary.total,
  };
}

export interface MissionState {
  deck: string;
  label: string;
  glyph: string;
  done: boolean;
  xp: number;
}

export interface TodayMissions {
  missions: MissionState[];
  doneCount: number;
  /** all four done but the prize not collected yet */
  bonusReady: boolean;
  bonusClaimed: boolean;
  /** xp banked from missions today */
  earned: number;
  /** xp still available today, all four included */
  remaining: number;
  allDone: boolean;
  allBonus: number;
}

const DECK_LABELS: Record<string, string> = {
  vocabulary: 'Vocabulary',
  hiragana: 'Hiragana',
  katakana: 'Katakana',
  kanji: 'Kanji',
};

/** one character per deck, so a node says which deck without a label */
const DECK_GLYPHS: Record<string, string> = {
  vocabulary: '語',
  hiragana: 'あ',
  katakana: 'ア',
  kanji: '漢',
};

/** today's missions, derived from the sessions store like everything else */
export async function getTodayMissions(now: Date = new Date()): Promise<TodayMissions> {
  const today = dateKey(now.getTime());
  const sessions = (await getAllSessions()).filter((s) => dateKey(s.startedAt) === today);
  const done = decksStudied(sessions);

  const missions = MISSION_DECKS.map((deck) => ({
    deck,
    label: DECK_LABELS[deck] ?? deck,
    glyph: DECK_GLYPHS[deck] ?? '?',
    done: done.has(deck),
    xp: MISSION_XP,
  }));

  const allDone = missions.every((m) => m.done);
  const earned = missionXpFor(done);
  const maxPossible = MISSION_DECKS.length * MISSION_XP + ALL_MISSIONS_XP;
  const bonusClaimed = (await loadProfile()).claimedBonusOn === today;

  return {
    missions,
    doneCount: missions.filter((m) => m.done).length,
    bonusReady: allDone && !bonusClaimed,
    bonusClaimed,
    earned,
    remaining: Math.max(0, maxPossible - earned),
    allDone,
    allBonus: ALL_MISSIONS_XP,
  };
}

/** collects today's completion bonus. safe to call twice - the day is the key */
export async function claimDailyBonus(now: Date = new Date()): Promise<void> {
  await saveProfile({ claimedBonusOn: dateKey(now.getTime()) });
}

/** longest edge of a stored avatar, in px */
export const AVATAR_SIZE = 256;

/**
 * shrinks a chosen photo to a square data url, cropped where the user put it.
 *
 * a phone photo is 3-5MB; stored raw it would dwarf every review record in the
 * database and make the backup file unusable. at 256px square it is ~20kb,
 * small enough to travel with a backup so a restore keeps the picture.
 *
 * the crop is baked in here rather than stored alongside the full photo: only
 * the square the user chose is ever written, so the rest of their picture never
 * enters the database or the backup file.
 */
export async function photoToAvatar(file: File, pos: ImagePos = DEFAULT_POS): Promise<string> {
  const bitmap = await createImageBitmap(file);
  try {
    const crop = cropRect(pos, bitmap.width, bitmap.height, 1, 1);
    const sw = crop.w * bitmap.width;
    const sh = crop.h * bitmap.height;

    const canvas = document.createElement('canvas');
    canvas.width = AVATAR_SIZE;
    canvas.height = AVATAR_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('no 2d context');
    ctx.drawImage(
      bitmap,
      crop.x * bitmap.width,
      crop.y * bitmap.height,
      sw,
      sh,
      0,
      0,
      AVATAR_SIZE,
      AVATAR_SIZE
    );
    return canvas.toDataURL('image/jpeg', 0.85);
  } finally {
    bitmap.close();
  }
}

/** Test seam - drops the in-memory copy so the next load re-reads storage. */
export function resetProfileCache(): void {
  cached = null;
}
