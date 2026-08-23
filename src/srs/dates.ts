// One definition of "which day did this happen on", shared by the stats and
// the points engine.
//
// Local time, not UTC. The old helper used toISOString(), which buckets by UTC
// day: for anyone east of Greenwich a session after local midnight lands on the
// previous day, so a late-night sitting could silently fail to extend a streak
// or, worse, appear to break one. That was tolerable when this only shaded a
// calendar cell; with a streak multiplier riding on it, it is not.

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * when a new day begins, in hours past local midnight.
 *
 * chris studies at night. with the day turning at midnight, a session at 1am
 * started a new day: it broke the streak he was in the middle of extending,
 * reset the daily missions he was halfway through, and counted as the first
 * sitting of a day he had not slept into yet. 6am is after any plausible
 * bedtime and before any plausible morning, so a night's studying stays in
 * one day whichever side of midnight it lands on.
 */
export const DAY_STARTS_AT_HOUR = 6;

/**
 * YYYY-MM-DD in the user's own timezone, with the day turning at 6am.
 *
 * The step back is CALENDAR arithmetic, not six hours of milliseconds:
 * on the morning the clocks go forward the day is only 23 hours long, so
 * subtracting 6h from 06:00 lands at 23:00 the night before and everything
 * between 6 and 7am gets filed under yesterday. setDate has no such problem.
 */
export function dateKey(ts: number): string {
  const d = new Date(ts);
  if (d.getHours() < DAY_STARTS_AT_HOUR) d.setDate(d.getDate() - 1);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

/**
 * the moment a day-key's day begins.
 *
 * anything that turns a key back into a timestamp has to land INSIDE that day,
 * or dateKey sends it back one: local midnight now belongs to the key before.
 */
export function dayStart(key: string): number {
  const d = new Date(`${key}T00:00:00`);
  d.setHours(DAY_STARTS_AT_HOUR, 0, 0, 0);
  return d.getTime();
}

/** Whole days between two day-keys. Both are taken at their own start, so DST
 * transitions cannot make an adjacent pair round to 0 or 2. */
export function daysBetween(earlier: string, later: string): number {
  return Math.round((dayStart(later) - dayStart(earlier)) / DAY_MS);
}
