import { describe, it, expect } from 'vitest';
import { dateKey, dayStart, daysBetween, DAY_STARTS_AT_HOUR } from './dates';

// the day turns at 6am, not midnight. chris studies at night, and under the old
// rule a session at 1am started a fresh day: it broke the streak he was
// extending, reset the missions he was halfway through, and counted as the
// first sitting of a day he had not slept into. every "which day is this"
// question in the app comes through here, so these pin the boundary itself.

/** a local-time timestamp, so the tests do not depend on the runner's zone */
const at = (y: number, m: number, d: number, h: number, min = 0): number =>
  new Date(y, m - 1, d, h, min, 0, 0).getTime();

describe('the day boundary', () => {
  it('turns at 6am, not midnight', () => {
    expect(DAY_STARTS_AT_HOUR).toBe(6);
    expect(dateKey(at(2026, 3, 10, 5, 59))).toBe('2026-03-09');
    expect(dateKey(at(2026, 3, 10, 6, 0))).toBe('2026-03-10');
  });

  it('keeps a night owl inside one day either side of midnight', () => {
    const evening = dateKey(at(2026, 3, 10, 23, 30));
    const afterMidnight = dateKey(at(2026, 3, 11, 1, 15));
    expect(afterMidnight).toBe(evening);
  });

  it('still separates one night from the next', () => {
    expect(daysBetween(dateKey(at(2026, 3, 11, 1, 0)), dateKey(at(2026, 3, 12, 1, 0)))).toBe(1);
  });

  it('a morning session belongs to the day it is in', () => {
    expect(dateKey(at(2026, 3, 10, 9, 0))).toBe('2026-03-10');
  });

  it('round-trips: a key taken back to a timestamp lands in its own day', () => {
    // the trap this exists for: local midnight now belongs to the PREVIOUS key,
    // so anything turning a key back into a time has to use dayStart or it
    // silently walks a day backwards
    for (const key of ['2026-01-01', '2026-03-29', '2026-10-25', '2026-12-31']) {
      expect(dateKey(dayStart(key))).toBe(key);
    }
  });

  it('counts whole days across the spring DST change', () => {
    // 2026-03-29 is when European clocks go forward; a 23-hour day must still
    // be one day apart, or a streak breaks itself once a year
    expect(daysBetween('2026-03-28', '2026-03-29')).toBe(1);
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
  });

  it('counts whole days across the autumn DST change', () => {
    expect(daysBetween('2026-10-24', '2026-10-25')).toBe(1);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });
});
