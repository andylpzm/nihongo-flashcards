import { describe, it, expect } from 'vitest';
import { computePoints, MISSION_DECKS } from './points';
import { thresholdFor, TOTAL_TARGET } from './gallery';
import type { SessionRecord } from './types';

// how long the collection actually takes.
//
// the pacing test next door asks one clean question - two decks a day, every
// day, for a year. nobody studies like that. this simulates the way chris
// actually uses it: most days but not all, some nights he grinds four decks
// and some he does ten cards in bed, streaks that build and break, and the
// rank bonus and streak multiplier compounding as he goes.
//
// the numbers this prints are the point of the file. the assertions only pin
// the two ends: it must not be finishable in a few months, and a real habit
// must not leave him a third of the way through after a year.

const TOTAL_CARDS = 302;
const DAY = 24 * 60 * 60 * 1000;

/** a deterministic shuffle-free random, so a run is reproducible */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

interface Habit {
  name: string;
  /** chance he opens the app at all on a given day */
  showsUp: number;
  /** chance that, having shown up, he does all four decks */
  grinds: number;
}

/**
 * a year of sittings.
 *
 * a normal night is one or two decks of 25. a grind night is all four, and
 * one of them long. a tired night is ten cards before sleep. answers are the
 * unit points are paid in, so this is where the whole economy comes from.
 */
function simulate(habit: Habit, days: number, seed = 7): SessionRecord[] {
  const rand = rng(seed);
  const out: SessionRecord[] = [];
  const start = new Date('2026-01-05T20:00:00').getTime();

  for (let d = 0; d < days; d++) {
    if (rand() > habit.showsUp) continue;
    const grind = rand() < habit.grinds;
    const tired = !grind && rand() < 0.25;

    const decks = grind ? [...MISSION_DECKS] : MISSION_DECKS.slice(0, 1 + Math.floor(rand() * 2));
    decks.forEach((deck, i) => {
      const answers = tired ? 10 : grind && i === 0 ? 50 : 25;
      // evening study, sittings an hour apart
      const at = start + d * DAY + i * 60 * 60 * 1000;
      out.push({
        startedAt: at,
        endedAt: at + answers * 6000,
        deck,
        answers,
        // a tired ten-card sitting is usually abandoned rather than emptied
        completed: !tired,
      });
    });
  }
  return out;
}

/** how many cards that many points has opened */
const cardsAt = (points: number): number => {
  let n = 0;
  while (n < TOTAL_CARDS && points >= thresholdFor(n, TOTAL_CARDS)) n++;
  return n;
};

function report(habit: Habit, days = 730): { cards: number[]; total: number } {
  const sessions = simulate(habit, days);
  const cards: number[] = [];
  for (const month of [1, 2, 3, 6, 9, 12, 18, 24]) {
    const cutoff = new Date('2026-01-05T20:00:00').getTime() + month * 30.44 * DAY;
    const upto = sessions.filter((s) => s.startedAt <= cutoff);
    cards.push(cardsAt(computePoints(upto, new Date(cutoff)).total));
  }
  return { cards, total: computePoints(sessions, new Date(Date.now())).total };
}

const HABITS: Habit[] = [
  { name: 'most nights, rarely all four', showsUp: 0.75, grinds: 0.15 },
  { name: 'steady, often all four', showsUp: 0.85, grinds: 0.4 },
  { name: 'keen: nearly every night, usually all four', showsUp: 0.95, grinds: 0.7 },
];

describe('how long the collection takes', () => {
  it('prints the curve for realistic habits', () => {
    const lines = ['', 'cards opened after N months (of 302)', ''.padEnd(46, '-')];
    lines.push('habit'.padEnd(30) + ['1m', '2m', '3m', '6m', '9m', '12m', '18m', '24m'].map((h) => h.padStart(5)).join(''));
    for (const habit of HABITS) {
      const { cards } = report(habit);
      lines.push(habit.name.padEnd(30) + cards.map((c) => String(c).padStart(5)).join(''));
    }
    console.log(lines.join('\n'));
    expect(true).toBe(true);
  });

  it('prints where the time actually goes', () => {
    const lines = ['', 'xp per active day, and when milestones land', ''.padEnd(64, '-')];
    for (const habit of HABITS) {
      const sessions = simulate(habit, 730);
      const days = new Set(sessions.map((x) => new Date(x.startedAt).toDateString())).size;
      const pts = computePoints(sessions, new Date(sessions.at(-1)!.startedAt));
      const perActiveDay = Math.round(pts.total / days);
      const answers = sessions.reduce((n, x) => n + x.answers, 0);
      // when did card N open? binary search - walking day by day re-sums two
      // years of sittings 730 times per milestone and takes 12 seconds
      const totalOn = (d: number): number => {
        const cutoff = sessions[0]!.startedAt + d * DAY;
        return computePoints(
          sessions.filter((x) => x.startedAt <= cutoff),
          new Date(cutoff),
        ).total;
      };
      const dayOf = (card: number): string => {
        const want = thresholdFor(card - 1, TOTAL_CARDS);
        if (totalOn(730) < want) return '>24m';
        let lo = 1;
        let hi = 730;
        while (lo < hi) {
          const mid = Math.floor((lo + hi) / 2);
          if (totalOn(mid) >= want) hi = mid;
          else lo = mid + 1;
        }
        return `${(lo / 30.44).toFixed(1)}m`;
      };
      lines.push(
        habit.name.padEnd(30) +
          `${days} active days, ${answers} answers, ${perActiveDay} xp/active day, missions ${Math.round((pts.missionTotal / pts.total) * 100)}% of xp`,
      );
      lines.push(
        ''.padEnd(30) + ['1', '10', '50', '150', '277', '302'].map((c) => `#${c}:${dayOf(Number(c))}`).join('  '),
      );
    }
    console.log(lines.join('\n'));
    expect(true).toBe(true);
  });

  it('cannot be rushed: three months of keen study is nowhere near done', () => {
    const { cards } = report(HABITS[2]!);
    const atThreeMonths = cards[2]!;
    expect(atThreeMonths).toBeLessThan(TOTAL_CARDS * 0.45);
  });

  it('rewards a real habit: a year of steady study is well past halfway', () => {
    const { cards } = report(HABITS[1]!);
    const atTwelve = cards[5]!;
    expect(atTwelve).toBeGreaterThan(TOTAL_CARDS * 0.5);
  });

  it('the last card really costs the advertised total', () => {
    expect(thresholdFor(TOTAL_CARDS - 1, TOTAL_CARDS)).toBe(TOTAL_TARGET);
  });
});
