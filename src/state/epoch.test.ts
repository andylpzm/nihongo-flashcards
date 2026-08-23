import { describe, it, expect } from 'vitest';
import { coerce } from './profile';

// chris studied for weeks before the binder existed. points are derived from
// the whole sessions store, so on the day he updated, that back catalogue
// silently bought him the first seven cards - a collection meant to be earned
// arriving a quarter open. the epoch draws a line under it.

describe('the points epoch', () => {
  it('defaults to unstamped, so a fresh install counts everything', () => {
    expect(coerce({}).pointsEpoch).toBe(0);
  });

  it('is carried across from a stored profile', () => {
    expect(coerce({ pointsEpoch: 1_700_000_000_000 }).pointsEpoch).toBe(1_700_000_000_000);
  });

  it('survives a profile written before it existed', () => {
    // the shape chris's phone actually has: no epoch, no binder fields
    const old = { name: 'Chris', cachedPoints: 644, seenUnlocks: 0 };
    const p = coerce(old);
    expect(p.pointsEpoch).toBe(0);
    expect(p.binderRevealed).toBe(false);
  });
});
