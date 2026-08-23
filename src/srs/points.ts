// Points engine.
//
// Points are DERIVED, never accumulated. Everything here is a pure function of
// the sessions store, so the total can be thrown away and rebuilt at any time -
// which is what makes a corrupted or missing counter a non-event instead of a
// disaster. The cached total in `meta` is a cache and is treated as one.
//
// Two properties this file exists to guarantee:
//
//   1. Points already earned can never be taken away. Each session is scored
//      with the streak as it stood ON THAT DAY, so breaking a streak today
//      cannot retroactively devalue work done last month. A replay of the same
//      sessions always produces the same number.
//   2. Effort is what pays. Points come from answers given, not sessions
//      started, so five Short sittings cannot out-earn one Long one.

import type { SessionRecord } from './types';
import { dateKey, daysBetween, dayStart } from './dates';

/** One point per grade press - the same unit the Progress page reports. */
export const POINTS_PER_ANSWER = 1;

/**
 * finishing bonus, as a fraction of the sitting's own answers, paid only when
 * the queue is worked to empty. it RISES WITH RANK - this is what rank rewards,
 * rather than a blanket multiplier on everything.
 *
 * proportional, not flat. a flat bonus is farmable: with +10 per completed
 * sitting, four short sessions out-earned one long session covering the same
 * ground, which is precisely what this must not reward.
 */
export const COMPLETION_BONUS_BY_RANK = [1 / 3, 0.4, 0.5, 0.6, 0.75, 0.9, 1] as const;
export const COMPLETION_BONUS_RATE = COMPLETION_BONUS_BY_RANK[0];

/** Days of unbroken study to reach the maximum multiplier. */
export const STREAK_RAMP_DAYS = 28;
export const MAX_STREAK_MULTIPLIER = 2;

/**
 * how much the nth sitting of the day is worth, first session first.
 *
 * replaces an answers-per-day cap. the cap halved answers mid-session once a
 * daily total was crossed, which punished exactly the long sittings worth
 * encouraging - a 50-card session was docked halfway through. this instead
 * leaves every session internally whole and lets the SESSION be worth less,
 * so grinding still pays, just less per sitting.
 *
 * it also keeps one long session ahead of the same work split up: 50 answers
 * in one sitting beats 25+25, so there is nothing to game.
 */
export const SESSION_VALUE = [1, 0.7, 0.55, 0.45] as const;
/** every sitting beyond the fourth */
export const SESSION_VALUE_FLOOR = 0.4;

export function sessionValue(indexToday: number): number {
  return SESSION_VALUE[indexToday] ?? SESSION_VALUE_FLOOR;
}

/**
 * daily missions: one per deck, plus a bonus for clearing all four.
 *
 * derived from the sessions store like everything else - a mission is "did any
 * sitting today use this deck", so nothing extra has to be stored or kept in
 * sync. rewards variety without becoming the main income: four missions pay up
 * to 120 a day against roughly 180 from the sessions themselves.
 */
export const MISSION_DECKS = ['vocabulary', 'hiragana', 'katakana', 'kanji'] as const;
export type MissionDeck = (typeof MISSION_DECKS)[number];
export const MISSION_XP = 20;
export const ALL_MISSIONS_XP = 40;

/** decks studied on a given day, from that day's sittings */
export function decksStudied(sessions: SessionRecord[]): Set<string> {
  const decks = new Set<string>();
  for (const s of sessions) {
    if ((MISSION_DECKS as readonly string[]).includes(s.deck)) decks.add(s.deck);
  }
  return decks;
}

/** mission xp for one day, given the decks it touched */
export function missionXpFor(decks: Set<string>): number {
  const complete = MISSION_DECKS.every((d) => decks.has(d));
  return decks.size * MISSION_XP + (complete ? ALL_MISSIONS_XP : 0);
}

/**
 * Missed days forgiven per rolling week.
 *
 * A streak that resets to zero over one busy Tuesday is how these systems make
 * people quit; one grace day absorbs ordinary life without making the streak
 * meaningless.
 */
export const GRACE_DAYS_PER_WEEK = 1;
const GRACE_WINDOW_DAYS = 7;

/** Multiplier for a streak of `streakDays`, ramping 1.0 -> 2.0 over four weeks. */
export function streakMultiplier(streakDays: number): number {
  const clamped = Math.max(0, Math.min(streakDays, STREAK_RAMP_DAYS));
  return 1 + (clamped / STREAK_RAMP_DAYS) * (MAX_STREAK_MULTIPLIER - 1);
}

/**
 * Streak length on `asOf`, given the days that saw study, allowing one forgiven
 * gap per rolling week.
 *
 * Walks backwards from the current day. A one-day hole is stepped over and
 * charged against the grace budget; a hole of two or more days, or a second
 * hole inside the same seven-day window, ends the streak.
 */
export function streakOn(studyDays: Set<string>, asOf: string): number {
  if (studyDays.size === 0) return 0;

  // A streak is still alive on a rest day, but only counts days actually
  // studied - so start the walk from the most recent studied day at or before
  // `asOf`, and bail if that is already too far back to be forgiven.
  let cursor = asOf;
  if (!studyDays.has(cursor)) {
    const previous = shiftDay(cursor, -1);
    if (!studyDays.has(previous)) return 0;
    cursor = previous;
  }

  let streak = 0;
  let graceUsed: string[] = [];

  for (;;) {
    if (studyDays.has(cursor)) {
      streak++;
      cursor = shiftDay(cursor, -1);
      continue;
    }

    // A gap. It can only be forgiven if it is a single day and the grace
    // budget for the surrounding week is not already spent.
    const beforeGap = shiftDay(cursor, -1);
    if (!studyDays.has(beforeGap)) break;

    // Absolute distance: the walk runs backwards, so every recorded grace day
    // is LATER than the cursor and a signed comparison is always negative -
    // which quietly kept spent grace on the books forever and meant a second
    // gap could never be forgiven, however many weeks had passed.
    graceUsed = graceUsed.filter((day) => Math.abs(daysBetween(day, cursor)) < GRACE_WINDOW_DAYS);
    if (graceUsed.length >= GRACE_DAYS_PER_WEEK) break;

    graceUsed.push(cursor);
    cursor = beforeGap;
  }

  return streak;
}

function shiftDay(key: string, delta: number): string {
  // from the day's own start, not local midnight - midnight belongs to the
  // previous day now that the day turns at 6am
  const d = new Date(dayStart(key));
  d.setDate(d.getDate() + delta);
  return dateKey(d.getTime());
}

/**
 * Ranks, in ascending order.
 *
 * A school sports club, not one sport: the old ladder had 'Sixth Man' in it,
 * which is basketball jargon with no badminton equivalent, and the app has a
 * theme for each.
 *
 * The first five are about you - arriving, earning a place, becoming the one
 * the team leans on, leading it. The last two stop being about you and become
 * how far the team gets, which is the same ladder in both sports and gives the
 * long final stretch somewhere bigger to arrive.
 *
 * thresholds are fractions of the 66,500 xp journey, so promotions land at
 * real milestones for a two-decks-a-day habit: ~day 10, 33, 76, 148, 238, 329.
 */
export const RANKS: readonly { name: string; at: number; bonus: number }[] = [
  { name: 'First Year', at: 0, bonus: COMPLETION_BONUS_BY_RANK[0] },
  { name: 'Bench', at: 1330, bonus: COMPLETION_BONUS_BY_RANK[1] },
  { name: 'Regular', at: 5320, bonus: COMPLETION_BONUS_BY_RANK[2] },
  { name: 'Ace', at: 13300, bonus: COMPLETION_BONUS_BY_RANK[3] },
  { name: 'Captain', at: 26600, bonus: COMPLETION_BONUS_BY_RANK[4] },
  { name: 'Regionals', at: 43225, bonus: COMPLETION_BONUS_BY_RANK[5] },
  { name: 'Nationals', at: 59850, bonus: COMPLETION_BONUS_BY_RANK[6] },
] as const;

/**
 * How a promotion into this rank reads in the session summary.
 *
 * "now Captain" is right for a role, but "now Nationals" is not - the last two
 * ranks are places the team reaches, not titles you hold.
 */
export function promotionLabel(rank: { name: string; index: number }): string {
  return rank.index >= RANKS.length - 2 ? `${rank.name} reached` : `now ${rank.name}`;
}

export interface Rank {
  name: string;
  /** 0-based index into RANKS. */
  index: number;
  at: number;
  /** finishing bonus rate this rank grants */
  bonus: number;
  /** Points needed for the next rank, or null at the top. */
  nextAt: number | null;
  nextName: string | null;
  /** Progress towards the next rank, 0-1. 1 at the top rank. */
  progress: number;
}

export function rankFor(total: number): Rank {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (total >= RANKS[i]!.at) index = i;
  }
  const current = RANKS[index]!;
  const next = RANKS[index + 1] ?? null;
  const span = next ? next.at - current.at : 0;
  return {
    name: current.name,
    index,
    at: current.at,
    bonus: current.bonus,
    nextAt: next?.at ?? null,
    nextName: next?.name ?? null,
    progress: next && span > 0 ? Math.min(1, (total - current.at) / span) : 1,
  };
}

export interface SessionAward {
  startedAt: number;
  /** streak length on the day of this session, as it was then */
  streak: number;
  multiplier: number;
  /** which sitting of that day this was, 0-based */
  sessionIndex: number;
  /** what that position was worth */
  sessionValue: number;
  /** finishing bonus rate at the rank held when this was earned */
  bonusRate: number;
  points: number;
}

export interface PointsSummary {
  total: number;
  /** xp from daily missions, part of `total` */
  missionTotal: number;
  /** Current streak, as of `now`. */
  streak: number;
  /** What the next session's answers would be multiplied by. */
  multiplier: number;
  sessionsCounted: number;
  /** Per-session breakdown, oldest first. */
  awards: SessionAward[];
}

/**
 * Replays every session in order and returns the running total.
 *
 * Chronological replay is the whole design: it is what lets each sitting keep
 * the multiplier it was earned under, and it means the answer never depends on
 * when the function happens to be called.
 */
export function computePoints(sessions: SessionRecord[], now: Date = new Date()): PointsSummary {
  const ordered = [...sessions].sort((a, b) => a.startedAt - b.startedAt);

  const studyDays = new Set<string>();
  for (const s of ordered) studyDays.add(dateKey(s.startedAt));

  const sessionsByDay = new Map<string, number>();
  // decks seen per day, so mission xp can be paid once the day is complete
  const decksByDay = new Map<string, Set<string>>();
  const awards: SessionAward[] = [];
  // The streak is evaluated against the days studied UP TO the session being
  // scored. Using the full set would let an early session borrow credit from
  // days that had not happened yet. Accumulated as we go, since `ordered` is
  // already chronological.
  const daysSoFar = new Set<string>();
  let total = 0;

  for (const session of ordered) {
    const day = dateKey(session.startedAt);
    daysSoFar.add(day);

    const streak = streakOn(daysSoFar, day);
    const multiplier = streakMultiplier(streak);

    const sessionIndex = sessionsByDay.get(day) ?? 0;
    sessionsByDay.set(day, sessionIndex + 1);
    if (!decksByDay.has(day)) decksByDay.set(day, new Set());
    decksByDay.get(day)!.add(session.deck);
    const value = sessionValue(sessionIndex);

    // rank is read from the total EARNED SO FAR, so a session is scored at the
    // rank held when it happened - the same replay property as the streak
    const bonusRate = rankFor(total).bonus;
    const answers = Math.max(0, session.answers) * POINTS_PER_ANSWER;
    const base = answers + (session.completed ? answers * bonusRate : 0);
    const points = Math.round(base * multiplier * value);

    total += points;
    awards.push({
      startedAt: session.startedAt,
      streak,
      multiplier,
      sessionIndex,
      sessionValue: value,
      bonusRate,
      points,
    });
  }

  // mission xp is a property of the DAY, not of any one sitting, so it is
  // added after the sittings are scored rather than inside the loop
  let missionTotal = 0;
  for (const decks of decksByDay.values()) missionTotal += missionXpFor(decks);
  total += missionTotal;

  const currentStreak = streakOn(studyDays, dateKey(now.getTime()));
  return {
    total,
    missionTotal,
    streak: currentStreak,
    multiplier: streakMultiplier(currentStreak),
    sessionsCounted: ordered.length,
    awards,
  };
}

/**
 * What a session worth `answers` would pay right now.
 *
 * Used to show the reward before it is earned. Deliberately runs the same
 * replay as computePoints with the prospective session appended, rather than
 * reimplementing the formula - a second implementation is a second thing to
 * get wrong.
 */
export function previewAward(
  sessions: SessionRecord[],
  answers: number,
  completed: boolean,
  now: Date = new Date()
): number {
  const hypothetical: SessionRecord = {
    startedAt: now.getTime(),
    endedAt: now.getTime(),
    deck: 'preview',
    answers,
    completed,
  };
  const withIt = computePoints([...sessions, hypothetical], now);
  return withIt.awards[withIt.awards.length - 1]?.points ?? 0;
}
