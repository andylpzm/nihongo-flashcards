// The per-answer economy, kept only to be read once.
//
// Points are a replay of the sessions store, so replacing the formula rescores
// every sitting ever recorded. That is fine for a fresh install and unusable
// for anyone already studying: gallery unlocks are keyed to the total, so a
// total that moves down takes back a picture that was already earned.
//
// So the old total is computed once with the old maths, frozen into the
// profile, and everything after the freeze is scored the new way on top of it.
// Nothing here is called again once that has happened - see
// state/profile.ts freezeLegacyPoints().

import type { SessionRecord } from './types';
import { dateKey } from './dates';
import { streakMultiplier, streakOn, sessionValue, missionXpFor, RANKS } from './points';

/** what rank paid under the old economy: a share of the sitting's answers */
const LEGACY_BONUS = [1 / 3, 0.4, 0.5, 0.6, 0.75, 0.9, 1] as const;

function legacyBonusFor(total: number): number {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) if (total >= RANKS[i]!.at) index = i;
  return LEGACY_BONUS[index] ?? LEGACY_BONUS[0];
}

/**
 * The total these sessions were worth under per-answer scoring.
 *
 * A faithful copy of the old computePoints - deliberately a copy rather than a
 * shared helper, because it must keep answering the old question after the
 * live engine has moved on.
 */
export function legacyTotal(sessions: SessionRecord[]): number {
  const ordered = [...sessions].sort((a, b) => a.startedAt - b.startedAt);

  const sessionsByDay = new Map<string, number>();
  const decksByDay = new Map<string, Set<string>>();
  const daysSoFar = new Set<string>();
  let total = 0;

  for (const session of ordered) {
    const day = dateKey(session.startedAt);
    daysSoFar.add(day);

    const multiplier = streakMultiplier(streakOn(daysSoFar, day));
    const index = sessionsByDay.get(day) ?? 0;
    sessionsByDay.set(day, index + 1);
    if (!decksByDay.has(day)) decksByDay.set(day, new Set());
    decksByDay.get(day)!.add(session.deck);

    const bonusRate = legacyBonusFor(total);
    const answers = Math.max(0, session.answers);
    const base = answers + (session.completed ? answers * bonusRate : 0);
    total += Math.round(base * multiplier * sessionValue(index));
  }

  for (const decks of decksByDay.values()) total += missionXpFor(decks);
  return total;
}
