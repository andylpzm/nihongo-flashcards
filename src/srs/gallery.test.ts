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

/* ---- inserted cards ----------------------------------------------------
   the requirements are numbers chris has been looking at, so inserting a card
   must not move one of them. the curve keeps the shape it was fitted to; the
   new card takes the slot it lands in, everything behind it moves up a slot and
   takes that slot's price, and the collection grows one slot PAST the
   twelve-month target - a little more to earn at the end, which is what an
   extra card should cost.

   the accepted consequence, pinned here so it stays a decision rather than a
   surprise: chris's points do not move with the cards, so a picture already
   given can go back behind glass until he earns the difference. */
describe('a card inserted by hand', () => {
  const arc = (pieces: { id: string; inserted?: boolean }[]) => ({
    id: 'arc-1', arc: 'Arc 1', payoff: null,
    pieces: pieces.map((p, i) => ({
      id: p.id, kind: 'chapter', chapter: i + 1, volume: 1, image: '', thumb: '',
      ...(p.inserted ? { inserted: true } : {}),
    })),
  });
  const gallery = (pieces: { id: string; inserted?: boolean }[]): GallerySaga[] =>
    [{ id: 'first', saga: 'First', arcs: [arc(pieces)] }];

  const ten = Array.from({ length: 10 }, (_, i) => ({ id: `ch-${i + 1}` }));
  /** the same ten, with a new card sitting behind the sixth */
  const inserted = [...ten.slice(0, 6), { id: 'ins-001', inserted: true }, ...ten.slice(6)];

  const entries = (pieces: { id: string; inserted?: boolean }[], points = 0) =>
    buildGallery(gallery(pieces), points)[0]!.arcs[0]!.entries;
  const priceOf = (pieces: { id: string; inserted?: boolean }[], id: string) =>
    entries(pieces).find((e) => e.id === id)!.threshold;

  it('does not move a single existing requirement', () => {
    const before = entries(ten).map((e) => e.threshold);
    const after = entries(inserted).map((e) => e.threshold);
    // eleven slots now, but the first eleven prices of the ten-card curve
    expect(after.slice(0, 10)).toEqual(before);
  });

  it('gives the new card the price of the slot it lands in', () => {
    expect(priceOf(inserted, 'ins-001')).toBe(priceOf(ten, 'ch-7'));
  });

  it('moves the cards behind it up a slot, into that slot\'s price', () => {
    expect(priceOf(inserted, 'ch-7')).toBe(priceOf(ten, 'ch-8'));
    expect(priceOf(inserted, 'ch-8')).toBe(priceOf(ten, 'ch-9'));
    expect(priceOf(inserted, 'ch-9')).toBe(priceOf(ten, 'ch-10'));
  });

  it('adds a slot past the target, priced by carrying the curve on', () => {
    // ch-10 used to be the last card and cost the twelve-month target. it is
    // the eleventh card that is last now, and it costs more than that.
    expect(priceOf(ten, 'ch-10')).toBe(TOTAL_TARGET);
    expect(priceOf(inserted, 'ch-10')).toBeGreaterThan(TOTAL_TARGET);
    expect(priceOf(inserted, 'ch-10')).toBe(thresholdFor(10, 10));
  });

  it('costs a picture already given, until the difference is earned', () => {
    // seven cards' worth of points, and a card added behind the sixth
    const points = priceOf(ten, 'ch-7');
    const open = (pieces: { id: string; inserted?: boolean }[]) =>
      entries(pieces, points).filter((e) => e.unlocked).map((e) => e.id);

    expect(open(ten)).toEqual(['ch-1', 'ch-2', 'ch-3', 'ch-4', 'ch-5', 'ch-6', 'ch-7']);
    // still seven pictures, and the new one is among them - it costs exactly
    // what ch-7 did. ch-7 itself has moved into slot eight and is behind glass.
    expect(open(inserted)).toEqual(['ch-1', 'ch-2', 'ch-3', 'ch-4', 'ch-5', 'ch-6', 'ins-001']);
  });

  it('makes the arc reward wait for it', () => {
    // the reward comes out when every piece in the arc is open, so a card added
    // to the arc is one more thing it waits on
    const withReward = (pieces: { id: string; inserted?: boolean }[]): GallerySaga[] => {
      const g = gallery(pieces);
      g[0]!.arcs[0]!.payoff = { kind: 'spread', image: '', thumb: '', width: null, height: null };
      return g;
    };
    // the new card goes at the END of the arc, so it is the last thing standing
    // between the collection and the reward
    const last = [...ten, { id: 'ins-001', inserted: true }];
    const view = (pieces: { id: string; inserted?: boolean }[], points: number) =>
      buildGallery(withReward(pieces), points)[0]!.arcs[0]!;

    const tenthPrice = priceOf(ten, 'ch-10');
    // every original piece open, the added one not - the reward stays shut
    const nearly = view(last, tenthPrice);
    expect(nearly.entries.filter((e) => e.unlocked).map((e) => e.id)).toEqual(ten.map((p) => p.id));
    expect(nearly.complete).toBe(false);
    expect(nearly.payoff!.unlocked).toBe(false);

    // and it opens once the added card does, priced at the slot it took
    const eleventh = nearly.entries.at(-1)!.threshold;
    expect(eleventh).toBeGreaterThan(tenthPrice);
    const done = view(last, eleventh);
    expect(done.complete).toBe(true);
    expect(done.payoff!.unlocked).toBe(true);
    expect(done.payoff!.threshold).toBe(eleventh);
    expect(done.total).toBe(11);
  });

  it('numbers by the same slots it prices by', () => {
    const all = entries(inserted);
    expect(all.map((e) => e.index)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    expect(all[6]!.id).toBe('ins-001');
  });
});
