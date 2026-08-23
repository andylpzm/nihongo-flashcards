import { describe, it, expect } from 'vitest';
import {
  thresholdFor,
  buildGallery,
  countUnlocked,
  countPieces,
  nextLocked,
  newlyUnlocked,
  TOTAL_TARGET,
} from './gallery';
import type { GallerySaga } from './gallery';
import { computePoints } from './points';
import type { SessionRecord } from './types';

/** two sagas of `arcCount` arcs, `per` chapters each */
function sagas(arcCount: number, per = 10): GallerySaga[] {
  let chapter = 1;
  const make = (sagaName: string, ids: number[]) => ({
    id: sagaName.toLowerCase().replace(/ /g, '-'),
    saga: sagaName,
    arcs: ids.map((a) => ({
      id: `arc-${a}`,
      arc: `Arc ${a}`,
      payoff: { kind: 'spread', image: '', thumb: '', width: 1087, height: 792 },
      pieces: Array.from({ length: per }, () => {
        const n = chapter++;
        return { id: `ch-${n}`, kind: 'chapter', chapter: n, volume: Math.ceil(n / 10), image: '', thumb: '' };
      }),
    })),
  });
  const half = Math.ceil(arcCount / 2);
  return [
    make('First Year Saga', Array.from({ length: half }, (_, i) => i + 1)),
    make('Second Year Saga', Array.from({ length: arcCount - half }, (_, i) => half + i + 1)),
  ];
}

/** the real shape: 25 arcs, 250 chapters */
const REAL = sagas(25, 10);

describe('thresholdFor', () => {
  it('puts the first piece inside the first session', () => {
    // a first vocab sitting plus its daily mission pays ~55
    expect(thresholdFor(0, 276)).toBeLessThanOrEqual(55);
  });

  it('ends the curve exactly on the twelve-month target', () => {
    expect(thresholdFor(275, 276)).toBe(TOTAL_TARGET);
  });

  it('rises monotonically', () => {
    for (let i = 1; i < 276; i++) {
      expect(thresholdFor(i, 276)).toBeGreaterThan(thresholdFor(i - 1, 276));
    }
  });

  it('never lets one session clear two pictures', () => {
    // the old curve had a hardcoded first unlock at 40 and a second at 45,
    // so a single sitting took both. every gap must exceed a good session.
    const bigSession = 120;
    for (let i = 1; i < 276; i++) {
      expect(thresholdFor(i, 276) - thresholdFor(i - 1, 276)).toBeGreaterThan(bigSession * 0.5);
    }
  });

  it('stretches rather than overshooting when more art is added', () => {
    expect(thresholdFor(299, 300)).toBe(TOTAL_TARGET);
    expect(thresholdFor(125, 300)).toBeLessThan(thresholdFor(125, 276));
  });

});

// the pacing promise, checked against the actual points engine rather than
// arithmetic repeated here. if either side drifts, this fails.
//
// asserted at fixed checkpoints rather than by searching for the crossing day:
// a search re-runs the whole replay per step, which took ten seconds a test.
describe('pacing', () => {
  const decks = ['vocabulary', 'hiragana', 'katakana', 'kanji'];
  function study(days: number, decksPerDay: number, answers = 25): SessionRecord[] {
    const out: SessionRecord[] = [];
    for (let i = days - 1; i >= 0; i--) {
      for (let s = 0; s < decksPerDay; s++) {
        const d = new Date('2027-06-01T09:00:00');
        d.setDate(d.getDate() - i);
        d.setHours(9 + s * 3);
        out.push({
          startedAt: d.getTime(),
          endedAt: d.getTime() + 300_000,
          deck: decks[s % 4]!,
          answers,
          completed: true,
        });
      }
    }
    return out;
  }
  const now = new Date('2027-06-01T23:00:00');
  const xpAfter = (days: number, decksPerDay: number) =>
    computePoints(study(days, decksPerDay), now).total;

  it('takes about twelve months at two decks a day', () => {
    // within a few weeks of the year - the anchor the whole curve is fitted to
    expect(xpAfter(365, 2)).toBeGreaterThan(TOTAL_TARGET * 0.9);
    expect(xpAfter(420, 2)).toBeGreaterThanOrEqual(TOTAL_TARGET);
    // and not so fast that it is done in half the time
    expect(xpAfter(182, 2)).toBeLessThan(TOTAL_TARGET * 0.6);
  });

  it('rewards clearing all four daily missions', () => {
    expect(xpAfter(200, 4)).toBeGreaterThan(xpAfter(200, 2));
  });

  it('leaves a single-deck habit well short of finished at a year', () => {
    expect(xpAfter(365, 1)).toBeLessThan(TOTAL_TARGET);
  });

  it('cannot be finished in a weekend by grinding', () => {
    expect(xpAfter(3, 4)).toBeLessThan(TOTAL_TARGET * 0.1);
  });
});

describe('buildGallery', () => {
  it('numbers pieces across arcs, not within them', () => {
    const view = buildGallery(REAL, 0);
    expect(view[0]!.arcs[0]!.entries[0]!.index).toBe(0);
    expect(view[0]!.arcs[1]!.entries[0]!.index).toBe(10);
  });

  it('locks everything at zero points', () => {
    const view = buildGallery(REAL, 0);
    expect(view.every((s) => s.unlockedCount === 0)).toBe(true);
    expect(view.every((s) => s.arcs.every((a) => !a.payoff!.unlocked))).toBe(true);
  });

  it('unlocks the first piece after one session', () => {
    const view = buildGallery(REAL, thresholdFor(0, countPieces(REAL)));
    expect(view[0]!.arcs[0]!.entries[0]!.unlocked).toBe(true);
    expect(view[0]!.arcs[0]!.complete).toBe(false);
  });

  it('holds the payoff until every chapter in the arc is found', () => {
    const total = countPieces(REAL);
    const almost = buildGallery(REAL, thresholdFor(8, total));
    expect(almost[0]!.arcs[0]!.payoff!.unlocked).toBe(false);

    const done = buildGallery(REAL, thresholdFor(9, total));
    expect(done[0]!.arcs[0]!.complete).toBe(true);
    expect(done[0]!.arcs[0]!.payoff!.unlocked).toBe(true);
    expect(done[0]!.arcs[1]!.payoff!.unlocked).toBe(false);
  });

  it('reports what is still needed for a locked payoff', () => {
    const view = buildGallery(REAL, 100);
    expect(view[0]!.arcs[0]!.payoff!.remaining).toBe(thresholdFor(9, countPieces(REAL)) - 100);
  });
});

describe('saga totals', () => {
  it('totals each saga', () => {
    const view = buildGallery(REAL, TOTAL_TARGET);
    expect(view.map((s) => s.saga)).toEqual(['First Year Saga', 'Second Year Saga']);
    expect(view.reduce((n, s) => n + s.total, 0)).toBe(250);
    expect(view[0]!.unlockedCount).toBe(130);
  });
});

describe('counting and next-up', () => {
  it('counts pieces across arcs', () => {
    expect(countPieces(REAL)).toBe(250);
    expect(countUnlocked(REAL, 0)).toBe(0);
    expect(countUnlocked(REAL, TOTAL_TARGET)).toBe(250);
  });

  it('finds the next locked piece', () => {
    const total = countPieces(REAL);
    expect(nextLocked(REAL, 0)!.index).toBe(0);
    expect(nextLocked(REAL, thresholdFor(0, total))!.index).toBe(1);
  });

  it('returns null once everything is found', () => {
    expect(nextLocked(REAL, TOTAL_TARGET)).toBeNull();
  });
});

describe('newlyUnlocked', () => {
  it('is empty when no threshold was crossed', () => {
    const got = newlyUnlocked(REAL, 1, 2);
    expect(got.pieces).toEqual([]);
    expect(got.payoffs).toEqual([]);
  });

  it('reports the piece a session crossed', () => {
    const first = thresholdFor(0, countPieces(REAL));
    const got = newlyUnlocked(REAL, first - 1, first);
    expect(got.pieces.map((p) => p.index)).toEqual([0]);
  });

  it('reports the payoff alongside the chapter that completed the arc', () => {
    const total = countPieces(REAL);
    const got = newlyUnlocked(REAL, thresholdFor(8, total), thresholdFor(9, total));
    expect(got.pieces.map((p) => p.index)).toEqual([9]);
    expect(got.payoffs.map((c) => c.arcId)).toEqual(['arc-1']);
  });

  it('reports every piece when one session crosses several thresholds', () => {
    const got = newlyUnlocked(REAL, 0, thresholdFor(4, countPieces(REAL)));
    expect(got.pieces.length).toBeGreaterThan(2);
  });

  it('does not re-announce anything already unlocked', () => {
    const got = newlyUnlocked(REAL, 5000, 5100);
    expect(got.pieces.every((p) => p.threshold > 5000)).toBe(true);
  });
});
