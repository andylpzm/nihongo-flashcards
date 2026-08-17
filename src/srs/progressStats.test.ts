// The maths behind the Progress page. These exist mainly to pin the two
// judgement calls that are easy to regress: outlier trimming and median.

import { describe, it, expect } from 'vitest';
import {
  computeToday,
  computePace,
  computeGradeMix,
  computeCalendar,
  computePaceTrend,
} from './stats';
import type { ReviewRecord } from './types';
import { Rating } from './scheduler';
import { newFsrsCard } from './scheduler';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-08-17T12:00:00Z');

function rec(
  entries: { ts: number; rating?: number; elapsedMs?: number }[],
  cardId = 'c1'
): ReviewRecord {
  return {
    cardId,
    card: newFsrsCard(),
    log: entries.map((e) => ({
      ts: e.ts,
      rating: (e.rating ?? Rating.Good) as ReviewRecord['log'][number]['rating'],
      elapsedMs: e.elapsedMs ?? 2000,
    })),
  };
}

describe('computeToday', () => {
  it('counts only today, and ignores absurd answer times', () => {
    const t = computeToday(
      [rec([
        { ts: NOW.getTime(), elapsedMs: 3000 },
        { ts: NOW.getTime(), elapsedMs: 90_000 }, // walked away
        { ts: NOW.getTime() - 2 * DAY, elapsedMs: 3000 }, // not today
      ])],
      NOW
    );
    expect(t.reviews).toBe(2);
    expect(t.msSpent).toBe(3000);
    expect(t.activeDays).toBe(2);
  });
});

describe('computePace', () => {
  it('reports the median, so one long pause cannot skew it', () => {
    const entries = Array.from({ length: 9 }, () => ({ ts: NOW.getTime(), elapsedMs: 2000 }));
    entries.push({ ts: NOW.getTime(), elapsedMs: 59_000 });
    const p = computePace([rec(entries)], NOW);
    expect(p.medianSec).toBe(2);
    expect(p.sampleSize).toBe(10);
  });

  it('withholds a previous-window figure until the sample is big enough', () => {
    const p = computePace([rec([{ ts: NOW.getTime() - 30 * DAY }])], NOW);
    expect(p.previousSec).toBeNull();
  });
});

describe('computeGradeMix', () => {
  it('tallies each grade across cards', () => {
    // One answer per card, which is what a sitting looks like now.
    const mix = computeGradeMix([
      rec([{ ts: NOW.getTime(), rating: Rating.Again }], 'a'),
      rec([{ ts: NOW.getTime(), rating: Rating.Good }], 'b'),
      rec([{ ts: NOW.getTime(), rating: Rating.Good }], 'c'),
      rec([{ ts: NOW.getTime(), rating: Rating.Easy }], 'd'),
    ]);
    expect(mix).toEqual({ again: 1, hard: 0, good: 2, easy: 1 });
  });
});

describe('computeCalendar', () => {
  it('returns a dense run of days, oldest first, with counts landing on the right one', () => {
    const cal = computeCalendar([rec([{ ts: NOW.getTime() }, { ts: NOW.getTime() }])], NOW, 2);
    expect(cal).toHaveLength(14);
    expect(cal[cal.length - 1]!.count).toBe(2);
    expect(cal[0]!.count).toBe(0);
    expect(new Date(cal[0]!.date).getTime()).toBeLessThan(new Date(cal[13]!.date).getTime());
  });
});

describe('computePaceTrend', () => {
  it('returns one bucket per week, oldest first, with weekly medians', () => {
    const t = computePaceTrend(
      [rec([
        { ts: NOW.getTime(), elapsedMs: 2000 },
        { ts: NOW.getTime(), elapsedMs: 4000 },
        { ts: NOW.getTime() - 14 * DAY, elapsedMs: 8000 },
      ])],
      NOW,
      4
    );
    expect(t).toHaveLength(4);
    expect(t[3]!.medianSec).toBe(3);
    expect(t[3]!.answers).toBe(2);
    expect(t[1]!.medianSec).toBe(8);
  });

  it('marks weeks with no answers rather than dropping them', () => {
    const t = computePaceTrend([rec([{ ts: NOW.getTime() }])], NOW, 3);
    expect(t.filter((w) => w.answers === 0)).toHaveLength(2);
  });
});

describe('calendar intensity banding', () => {
  // Regression: intensity used to be count/busiest, so on a consistent
  // schedule (19-43 answers a day) the lightest band needed <= 10 and could
  // never be reached - a quarter of the legend was unusable.
  it('uses every band when the daily range is narrow and high', () => {
    const counts = [19, 22, 26, 28, 30, 32, 34, 35, 38, 40, 41, 43];
    const logs = counts.flatMap((n, day) =>
      Array.from({ length: n }, () => ({ ts: NOW.getTime() - day * DAY }))
    );
    const cal = computeCalendar([rec(logs)], NOW, 4);
    const active = cal.filter((d) => d.count > 0).map((d) => d.count).sort((a, b) => a - b);
    const q = (p: number) => active[Math.min(active.length - 1, Math.floor(active.length * p))]!;
    const level = (c: number) => (c === 0 ? 0 : c <= q(0.25) ? 1 : c <= q(0.5) ? 2 : c <= q(0.75) ? 3 : 4);
    const used = new Set(cal.filter((d) => d.count > 0).map((d) => level(d.count)));
    expect([...used].sort()).toEqual([1, 2, 3, 4]);
  });
});

describe('computeGradeMix ignores in-sitting retries', () => {
  it('counts only the first answer when a failed card comes back', () => {
    // Forgot, then Easy two minutes later when it was re-queued: the card was
    // forgotten, and that is what the mix should say.
    const mix = computeGradeMix([
      rec([
        { ts: NOW.getTime(), rating: Rating.Again },
        { ts: NOW.getTime() + 2 * 60_000, rating: Rating.Easy },
      ]),
    ]);
    expect(mix).toEqual({ again: 1, hard: 0, good: 0, easy: 0 });
  });

  it('counts a genuine later session separately', () => {
    const mix = computeGradeMix([
      rec([
        { ts: NOW.getTime() - 2 * DAY, rating: Rating.Again },
        { ts: NOW.getTime(), rating: Rating.Good },
      ]),
    ]);
    expect(mix).toEqual({ again: 1, hard: 0, good: 1, easy: 0 });
  });
});
