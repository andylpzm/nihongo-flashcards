// End-to-end simulation of the scheduler.
//
// Unit tests check one call at a time; they cannot tell you whether the thing
// actually teaches. This drives the real scheduleReview / buildQueue /
// StudySession over four months of simulated study with a virtual clock and a
// learner who genuinely forgets, then asserts the properties that have to hold
// for the system to be working at all:
//
//   1. a card is never shown before it is due
//   2. a card that comes due is not lost
//   3. answering well pushes intervals out; failing pulls them in
//   4. failing a mature card demotes it and records a lapse
//   5. the workload per day settles instead of growing without bound
//   6. the deck actually gets learned

import { describe, it, expect } from 'vitest';
import { scheduleReview, newFsrsCard, Rating, State } from './scheduler';
import { buildQueue } from './queue';
import { StudySession } from './session';
import type { ReviewRecord, Grade } from './types';
import type { Card, CardId } from '../state/types';

const DAY = 24 * 60 * 60 * 1000;

function deck(size: number): Card[] {
  return Array.from({ length: size }, (_, i) => ({
    id: i + 1,
    kana: `か${i}`,
    romaji: `ka${i}`,
    meanings: ['x'],
    level: 'N5' as const,
    pos: 'other' as const,
    topics: ['other'],
  }));
}

/**
 * A learner who forgets on a curve. Recall probability decays with the time
 * since the last sight of a card, relative to how well established it is - so
 * a long interval on a weak card fails, which is what makes the scheduler's
 * job real rather than decorative.
 */
function makeLearner(seed: number, onScheduleRecall = 0.9) {
  let s = seed;
  const rnd = () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296;
  return (elapsedDays: number, stability: number): Grade => {
    // Calibrated to what FSRS is actually aiming at: ~90% recall when a card
    // is reviewed at its scheduled interval. The first version used exp(-0.9t/S),
    // which recalls only 41% on schedule - a learner forgetting more than twice
    // as often as the scheduler assumes, which starved the simulation of new
    // cards and made the scheduler look broken when the model was mine.
    const retrievability = Math.pow(onScheduleRecall, elapsedDays / Math.max(stability, 0.1));
    const roll = rnd();
    if (roll > retrievability) return Rating.Again;
    if (roll > retrievability * 0.75) return Rating.Hard;
    if (roll > retrievability * 0.25) return Rating.Good;
    return Rating.Easy;
  };
}

interface SimResult {
  shownBeforeDue: { id: CardId; earlyByMs: number }[];
  answers: number;
  daysStudied: number;
  reviews: Map<CardId, ReviewRecord>;
  dailyLoad: number[];
  lapses: number;
  intervalGrowth: { first: number; last: number };
}

function simulate(
  days: number,
  deckSize: number,
  sessionSize: number,
  seed: number,
  onScheduleRecall = 0.9
): SimResult {
  const cards = deck(deckSize);
  const reviews = new Map<CardId, ReviewRecord>();
  const recall = makeLearner(seed, onScheduleRecall);
  const shownBeforeDue: { id: CardId; earlyByMs: number }[] = [];
  const dailyLoad: number[] = [];
  const firstIntervals: number[] = [];
  const lastIntervals = new Map<CardId, number>();
  let answers = 0;
  let daysStudied = 0;

  const start = new Date('2026-01-05T09:00:00Z').getTime();

  for (let day = 0; day < days; day++) {
    const now = new Date(start + day * DAY);
    const build = buildQueue(cards, reviews, sessionSize, now);
    if (build.items.length === 0) {
      dailyLoad.push(0);
      continue;
    }
    daysStudied++;
    dailyLoad.push(build.items.length);

    // Invariant 1: nothing in the queue may be scheduled for the future.
    for (const item of build.items) {
      const rec = reviews.get(item.card.id);
      if (rec && rec.card.due.getTime() > now.getTime()) {
        shownBeforeDue.push({ id: item.card.id, earlyByMs: rec.card.due.getTime() - now.getTime() });
      }
    }

    const session = new StudySession(build.items, now);
    let guard = 0;
    while (!session.isComplete && guard++ < sessionSize * 5) {
      const item = session.current!;
      const existing = reviews.get(item.card.id);
      const fsrsCard = existing?.card ?? newFsrsCard(now);
      const elapsedDays = existing
        ? (now.getTime() - (existing.card.last_review?.getTime() ?? now.getTime())) / DAY
        : 0;

      const grade = existing ? recall(elapsedDays, existing.card.stability) : Rating.Good;
      const next = scheduleReview(fsrsCard, grade, now).card;

      const intervalDays = (next.due.getTime() - now.getTime()) / DAY;
      if (!existing) firstIntervals.push(intervalDays);
      lastIntervals.set(item.card.id, intervalDays);

      reviews.set(item.card.id, {
        cardId: item.card.id,
        card: next,
        log: [
          ...(existing?.log ?? []),
          { ts: now.getTime(), rating: grade, elapsedMs: 3000 },
        ],
      });
      answers++;
      session.advance(grade);
    }
  }

  const lapses = [...reviews.values()].reduce((n, r) => n + r.card.lapses, 0);
  const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length);
  return {
    shownBeforeDue,
    answers,
    daysStudied,
    reviews,
    dailyLoad,
    lapses,
    intervalGrowth: { first: avg(firstIntervals), last: avg([...lastIntervals.values()]) },
  };
}

describe('scheduler simulation: 120 days, 200 cards', () => {
  const sim = simulate(120, 200, 25, 42);

  it('never shows a card before it is due', () => {
    expect(sim.shownBeforeDue).toEqual([]);
  });

  it('actually gets through the deck', () => {
    expect(sim.reviews.size).toBe(200);
    expect(sim.answers).toBeGreaterThan(500);
  });

  it('pushes intervals out as cards are learned', () => {
    // Average first interval is days; average latest interval should be much
    // longer, or the scheduler is not spacing anything.
    expect(sim.intervalGrowth.last).toBeGreaterThan(sim.intervalGrowth.first * 3);
  });

  it('settles the daily workload instead of growing without bound', () => {
    const lastMonth = sim.dailyLoad.slice(-30);
    const firstMonth = sim.dailyLoad.slice(0, 30);
    const avg = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
    expect(avg(lastMonth)).toBeLessThanOrEqual(avg(firstMonth));
  });

  it('leaves most of the deck in long-term rotation', () => {
    const mature = [...sim.reviews.values()].filter(
      (r) => r.card.state === State.Review && r.card.stability > 21
    );
    expect(mature.length).toBeGreaterThan(100);
  });

  it('records lapses when the simulated learner forgets', () => {
    expect(sim.lapses).toBeGreaterThan(0);
  });

  it('reports the run (diagnostic, always passes)', () => {
    const mature = [...sim.reviews.values()].filter(
      (r) => r.card.state === State.Review && r.card.stability > 21
    ).length;
    const load = sim.dailyLoad;
    const avg = (xs: number[]) => Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
    const intervals = [...sim.reviews.values()].map((r) => r.card.stability).sort((a, b) => a - b);
    console.log('\nSIMULATION: 120 days, 200-card deck, 25-card sessions');
    console.log('  cards introduced      :', sim.reviews.size, '/ 200');
    console.log('  total answers         :', sim.answers);
    console.log('  days with study       :', sim.daysStudied, '/ 120');
    console.log('  shown before due      :', sim.shownBeforeDue.length);
    console.log('  lapses recorded       :', sim.lapses);
    console.log('  mature (>21d stability):', mature);
    console.log('  median stability (d)  :', Math.round(intervals[Math.floor(intervals.length / 2)]! * 10) / 10);
    console.log('  daily load  first 30  :', avg(load.slice(0, 30)));
    console.log('  daily load  last 30   :', avg(load.slice(-30)));
    console.log('  first interval avg (d):', Math.round(sim.intervalGrowth.first * 100) / 100);
    console.log('  latest interval avg(d):', Math.round(sim.intervalGrowth.last * 10) / 10);
  });
});

describe('forgetting a mature card', () => {
  it('shortens its interval and counts a lapse', () => {
    const now = new Date('2026-03-01T09:00:00Z');
    let card = newFsrsCard(now);
    let t = now;
    let lastReviewedAt = now;
    // Build a genuinely mature card by answering well over time.
    for (let i = 0; i < 6; i++) {
      lastReviewedAt = t;
      card = scheduleReview(card, Rating.Good, t).card;
      t = new Date(card.due);
    }
    const matureInterval = (card.due.getTime() - lastReviewedAt.getTime()) / DAY;
    const beforeLapses = card.lapses;
    expect(card.state).toBe(State.Review);
    expect(matureInterval).toBeGreaterThan(30);

    const after = scheduleReview(card, Rating.Again, t).card;
    const afterInterval = (after.due.getTime() - t.getTime()) / DAY;

    expect(after.lapses).toBe(beforeLapses + 1);
    expect(afterInterval).toBeLessThan(matureInterval);
    expect(after.stability).toBeLessThan(card.stability);
  });

  it('brings a forgotten card back within days, not months', () => {
    const now = new Date('2026-03-01T09:00:00Z');
    let card = newFsrsCard(now);
    let t = now;
    for (let i = 0; i < 6; i++) {
      card = scheduleReview(card, Rating.Good, t).card;
      t = new Date(card.due);
    }
    const after = scheduleReview(card, Rating.Again, t).card;
    const days = (after.due.getTime() - t.getTime()) / DAY;
    expect(days).toBeGreaterThan(0);
    expect(days).toBeLessThan(30);
  });
});

describe('grades are ordered', () => {
  it('Again < Hard < Good < Easy in the interval they buy', () => {
    const now = new Date('2026-03-01T09:00:00Z');
    let card = newFsrsCard(now);
    let t = now;
    for (let i = 0; i < 3; i++) {
      card = scheduleReview(card, Rating.Good, t).card;
      t = new Date(card.due);
    }
    const d = (g: Grade) => scheduleReview(card, g, t).card.due.getTime() - t.getTime();
    expect(d(Rating.Again)).toBeLessThan(d(Rating.Hard));
    expect(d(Rating.Hard)).toBeLessThan(d(Rating.Good));
    expect(d(Rating.Good)).toBeLessThan(d(Rating.Easy));
  });
});

// The realistic configuration: the full vocabulary deck, medium sessions, and
// a learner who is worse than FSRS assumes. Reviews claim the sitting before
// new cards do (queue.ts), so the thing to check is whether a backlog can
// permanently starve new material.
describe('full deck, struggling learner', () => {
  const sim = simulate(180, 1294, 25, 7, 0.72);

  it('still introduces new cards despite reviews taking priority', () => {
    expect(sim.reviews.size).toBeGreaterThan(200);
  });

  it('never shows a card early, even under backlog', () => {
    expect(sim.shownBeforeDue).toEqual([]);
  });

  it('reports the run (diagnostic, always passes)', () => {
    const avg = (xs: number[]) => Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10;
    console.log('\nSIMULATION: 180 days, 1294-card deck, 25-card sessions, weak learner');
    console.log('  cards introduced :', sim.reviews.size, '/ 1294');
    console.log('  total answers    :', sim.answers);
    console.log('  lapses           :', sim.lapses);
    console.log('  shown before due :', sim.shownBeforeDue.length);
    console.log('  daily load first30:', avg(sim.dailyLoad.slice(0, 30)));
    console.log('  daily load last30 :', avg(sim.dailyLoad.slice(-30)));
  });
});
