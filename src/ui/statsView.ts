// Progress page.
//
// Ordered by how often it is worth looking at: today first, then the calendar
// that gives the streak a shape, then the slower-moving measures.
//
// The deck breakdown counts the vocabulary deck only - kana and kanji share
// the review store but are their own decks, and folding them in overstated
// vocabulary progress.
//
// The deck breakdown is two buckets, not three. With learning steps removed
// (scheduler.ts) a card is scheduled the moment it is answered, so there is no
// intermediate state to report - it is either in rotation or untouched.
//
// Everything is counted in "answers" - one press of a grade button - which is
// the same unit the session bar reports. Note this is not the same as cards:
// a new card graded Normal comes back inside the same sitting, so 13 answers
// can be 9 cards. Retention used to live here too and was removed: it was a
// rate off a handful of answers, which is noise in the costume of precision.

import { loadVocab } from '../data/loader';
import { ensureReviewsLoaded, getReviewsSnapshot } from '../state/reviews';
import {
  computeStateCounts,
  computeWeakestTopics,
  computeStreak,
  computeToday,
  computePace,
  computePaceTrend,
  computeGradeMix,
  computeCalendar,
  MIN_PACE_SAMPLE,
} from '../srs/stats';
import type { Card, CardId } from '../state/types';

const statsGrid = document.getElementById('stats-grid');

const TOPIC_LABELS: Record<string, string> = {
  numbers: 'Numbers & Counters',
  calendar: 'Calendar & Dates',
  time: 'Time & Hours',
  body: 'Body & Health',
  food: 'Food & Dining',
  family: 'Family & Social',
  school: 'School & Study',
  travel: 'Travel & Places',
  weather: 'Weather & Seasons',
  other: 'General / Others',
};

/** "Not enough data yet" beats a confident-looking number built on nothing. */
function needMore(done: number, target: number): string {
  const left = target - done;
  return `<div class="stat-pending">Keep going &mdash; ${left} more answer${
    left === 1 ? '' : 's'
  } to go</div>`;
}

function minutes(ms: number): string {
  const m = Math.round(ms / 60000);
  if (m >= 1) return `${m} min`;
  return `${Math.max(0, Math.round(ms / 1000))}s`;
}

export async function renderStatsView(): Promise<void> {
  if (!statsGrid) return;

  await ensureReviewsLoaded();
  const vocab = await loadVocab();
  const reviews = Array.from(getReviewsSnapshot().values());
  const cardsById = new Map<CardId, Card>(vocab.map((c) => [c.id, c]));

  const totalReviews = reviews.reduce((n, r) => n + r.log.length, 0);
  const today = computeToday(reviews);
  const streak = computeStreak(reviews);
  const pace = computePace(reviews);
  const paceTrend = computePaceTrend(reviews);
  const mix = computeGradeMix(reviews);
  const calendar = computeCalendar(reviews);
  // Scoped to the vocabulary deck. Kana and kanji reviews live in the same
  // store, so counting every record against vocab.length made studying kana
  // advance the vocabulary bar: 8 kana/kanji answers reported 62 vocabulary
  // cards in rotation when only 54 were vocabulary. It stayed internally
  // consistent (the two numbers still summed to 1294) which is exactly why it
  // was easy to miss.
  const vocabReviews = reviews.filter((r) => cardsById.has(r.cardId));
  const stateCounts = computeStateCounts(vocabReviews, vocab.length);
  const weakestTopics = computeWeakestTopics(reviews, cardsById);
  // Every answered card is scheduled, so "started" is simply everything that
  // is not new. Summed rather than read off one state so a card mid-flight
  // during a session is never dropped from the count.
  const started = stateCounts.review + stateCounts.learning + stateCounts.relearning;

  // Four intensity steps rather than a continuous scale: on a chart this
  // small, a smooth ramp is indistinguishable from noise.
  //
  // Ranked against the other study days, not against the busiest one. Scaling
  // by max looks reasonable but breaks for anyone consistent: with days
  // ranging 19-43 answers, the lightest shade needed <= 10 and could never be
  // reached, so a quarter of the legend was dead and every day looked equally
  // busy. Quartiles guarantee the whole scale is used whatever the range.
  const activeCounts = calendar.filter((d) => d.count > 0).map((d) => d.count).sort((a, b) => a - b);
  const quantile = (p: number): number =>
    activeCounts.length === 0
      ? 0
      : activeCounts[Math.min(activeCounts.length - 1, Math.floor(activeCounts.length * p))]!;
  const q1 = quantile(0.25);
  const q2 = quantile(0.5);
  const q3 = quantile(0.75);
  const cells = calendar
    .map((d) => {
      const level = d.count === 0 ? 0 : d.count <= q1 ? 1 : d.count <= q2 ? 2 : d.count <= q3 ? 3 : 4;
      return `<span class="cal-cell" data-level="${level}" title="${d.date}: ${d.count} answer${
        d.count === 1 ? '' : 's'
      }"></span>`;
    })
    .join('');

  const mixTotal = mix.again + mix.hard + mix.good + mix.easy;
  const mixBar = mixTotal
    ? (['again', 'hard', 'good', 'easy'] as const)
        .map((k) => {
          const pct = (mix[k] / mixTotal) * 100;
          return pct > 0
            ? `<span class="mix-seg mix-${k}" style="width:${pct}%" title="${k}: ${mix[k]}"></span>`
            : '';
        })
        .join('')
    : '';

  const paceDelta =
    pace.previousSec !== null && pace.medianSec > 0
      ? (() => {
          const diff = Math.round((pace.previousSec - pace.medianSec) * 10) / 10;
          if (Math.abs(diff) < 0.2) return `<span class="stat-delta">holding steady</span>`;
          return diff > 0
            ? `<span class="stat-delta is-better">${diff}s faster than before</span>`
            : `<span class="stat-delta is-worse">${Math.abs(diff)}s slower than before</span>`;
        })()
      : '';

  // Weeks with no answers are drawn as an empty slot rather than skipped, so
  // a gap in studying reads as a gap instead of silently compressing away.
  // Labelled by distance, not by date: bare day-of-month numbers ran "26, 2"
  // across a month boundary and looked like they went backwards, and on a
  // six-week trend what you want to know is how long ago, not which date.
  const slowestWeek = Math.max(0.1, ...paceTrend.map((w) => w.medianSec));
  const trendBars = paceTrend
    .map((w, i) => {
      const weeksAgo = paceTrend.length - 1 - i;
      const label = weeksAgo === 0 ? 'now' : `${weeksAgo}w`;
      const when =
        weeksAgo === 0
          ? 'this week'
          : `${weeksAgo} week${weeksAgo === 1 ? '' : 's'} ago (from ${new Date(
              w.weekStart
            ).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })})`;
      if (w.answers === 0) {
        return `<span class="pace-week is-empty" title="${when}: no answers"><i></i><small>${label}</small></span>`;
      }
      const h = Math.max(12, Math.round((w.medianSec / slowestWeek) * 100));
      return `<span class="pace-week" title="${when}: ${w.medianSec}s over ${w.answers} answer${w.answers === 1 ? '' : 's'}"><i style="height:${h}%"></i><small>${label}</small></span>`;
    })
    .join('');

  const topicRows = weakestTopics.length
    ? weakestTopics
        .map(
          (t) =>
            `<div class="topic-lapse-row"><span>${TOPIC_LABELS[t.topic] ?? t.topic}</span><span>${t.lapses} lapse${t.lapses === 1 ? '' : 's'}</span></div>`
        )
        .join('')
    : '';

  statsGrid.innerHTML = `
    <div class="stat-tile stat-tile-full stat-today">
      <h4>Today</h4>
      <div class="today-row">
        <div><div class="stat-value">${today.reviews}</div><span>answers</span></div>
        <div><div class="stat-value">${minutes(today.msSpent)}</div><span>studying</span></div>
        <div><div class="stat-value">${streak}</div><span>day streak</span></div>
      </div>
    </div>

    <div class="stat-tile stat-tile-full">
      <h4>Last 12 weeks</h4>
      <div class="cal-grid">${cells}</div>
      <div class="cal-legend"><span>Less</span>
        <span class="cal-cell" data-level="0"></span>
        <span class="cal-cell" data-level="1"></span>
        <span class="cal-cell" data-level="2"></span>
        <span class="cal-cell" data-level="3"></span>
        <span class="cal-cell" data-level="4"></span>
        <span>More</span>
      </div>
    </div>

    <div class="stat-tile stat-tile-full">
      <h4>Seconds per card</h4>
      ${
        pace.sampleSize >= MIN_PACE_SAMPLE
          ? `<div class="pace-head">
               <div class="stat-value">${pace.medianSec}s</div>
               ${paceDelta}
             </div>
             <p class="stat-note">Typical time to answer a card. Lower is better.</p>
             <div class="pace-trend">${trendBars}</div>`
          : needMore(pace.sampleSize, MIN_PACE_SAMPLE)
      }
    </div>

    <div class="stat-tile stat-tile-full">
      <h4>How it's going</h4>
      ${
        mixTotal
          ? `<div class="mix-bar">${mixBar}</div>
             <div class="mix-key">
               <span><i class="mix-again"></i>Forgot ${mix.again}</span>
               <span><i class="mix-hard"></i>Hard ${mix.hard}</span>
               <span><i class="mix-good"></i>Normal ${mix.good}</span>
               <span><i class="mix-easy"></i>Easy ${mix.easy}</span>
             </div>`
          : `<div class="stat-pending">No answers recorded yet</div>`
      }
    </div>

    <div class="stat-tile stat-tile-full">
      <h4>Vocabulary</h4>
      <div class="deck-bar-viz">
        <span class="deck-seg deck-rotation" style="width:${(started / vocab.length) * 100}%"></span>
      </div>
      <div class="deck-rows">
        <div><i class="deck-rotation"></i><strong>${started}</strong> in rotation<em>answered at least once, now coming back on a schedule</em></div>
        <div><i class="deck-new"></i><strong>${stateCounts.new}</strong> not started<em>never shown to you in a session</em></div>
      </div>
    </div>

    ${
      topicRows
        ? `<div class="stat-tile stat-tile-full">
             <h4>Hardest topics</h4>${topicRows}
           </div>`
        : ''
    }
  `;

  // Nothing above is meaningful on an untouched deck, so say so plainly
  // rather than showing five empty panels.
  statsGrid.classList.toggle('is-empty', totalReviews === 0);
}
