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
import {
  loadProfile,
  saveProfile,
  displayName,
  getPointsState,
  getTodayMissions,
  claimDailyBonus,
  photoToAvatar,
  type TodayMissions,
} from '../state/profile';
import { placement, DEFAULT_POS, type ImagePos } from '../state/imagePos';
import { openImagePicker } from './imagePicker';
import { syncDailyRing, syncPendingXp } from './progressTab';
import { createModal, type ModalController } from './modal';
import { RANKS, rankFor, type Rank } from '../srs/points';
import { unlockedImages } from '../srs/gallery';
import { effectivePoints } from '../state/preview';
import { loadGallery } from '../data/loader';
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
  computeDaysStudied,
  computeBestStreak,
  MIN_PACE_SAMPLE,
} from '../srs/stats';
import type { Card, CardId } from '../state/types';

const statsGrid = document.getElementById('stats-grid');

const BASE = import.meta.env.BASE_URL;

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

/**
 * the tab-bar cues, kept right without opening Progress.
 *
 * the day's ring stays up while the bonus is still there to collect, so a
 * finished-but-unclaimed day does not look like a finished one.
 */
export async function refreshMissionDot(): Promise<void> {
  const missions = await getTodayMissions();
  syncDailyRing(missions.doneCount, missions.missions.length, !missions.bonusClaimed);
  const { summary } = await getPointsState();
  const profile = await loadProfile();
  if (profile.seenPoints < 0) {
    // first run on a profile that predates this: take the current total as the
    // baseline now, at startup. doing it on the first Progress visit instead
    // meant that visit silently swallowed the first reveal.
    await saveProfile({ seenPoints: summary.total });
    syncPendingXp(0);
    return;
  }
  syncPendingXp(summary.total - profile.seenPoints);
}

/**
 * the mission track: four deck nodes on a rail, then the day's bonus.
 *
 * the bonus is not a fifth task - it sits past a divider, has no circle of its
 * own, and fills like a vessel as the four are cleared, so the fill states the
 * condition and no "all 4" label is needed.
 */
function missionTrack(today: TodayMissions): string {
  const total = today.missions.length;
  const fraction = total ? today.doneCount / total : 0;

  const nodes = today.missions
    .map((m, i) => {
      // no "next" marker here, unlike the rank road: these four have no order,
      // so singling one out was picking the first undone in list order and
      // calling it next, which is arbitrary and read as a stray ring.
      // the decks can be done in any order, so a link lights only when both of
      // the nodes it joins are done. a single bar filling from the left implied
      // an order that does not exist - doing kanji first lit the run up to
      // vocabulary, which had not been touched.
      const linked = i > 0 && m.done && today.missions[i - 1]!.done;
      return `<div class="m-node${m.done ? ' is-done' : ''}${linked ? ' is-linked' : ''}">
        <div class="m-dot${m.done ? ' is-done' : ''}" lang="ja"
             title="${m.label}">${m.glyph}${m.done ? '<span class="m-tick">&#10003;</span>' : ''}</div>
        <small>+${m.xp}</small>
      </div>`;
    })
    .join('');

  // basketball for Chii, shuttlecock for Taiki - each theme's own decoration.
  // both are rendered; css shows the one belonging to the active theme.
  const ballFill = 92 - fraction * 84;
  const shuttleFill = 78 - fraction * 58;

  return `<div class="m-track">
    <div class="m-tasks">
      <div class="m-rail"></div>
      ${nodes}
    </div>
    <div class="m-rule"></div>
    <div class="m-node m-bonus${today.bonusClaimed ? ' is-claimed' : today.bonusReady ? ' is-ready' : ''}">
      <button class="m-prize" id="btn-claim-bonus"${today.bonusReady ? '' : ' disabled'}
              aria-label="${today.bonusReady ? 'Collect the completion bonus' : 'Completion bonus'}">
        <svg class="m-ball" viewBox="0 0 100 100" aria-hidden="true">
          <defs><clipPath id="m-ball-clip"><circle cx="50" cy="50" r="40"/></clipPath></defs>
          <g clip-path="url(#m-ball-clip)">
            <rect class="m-liquid" x="0" y="${ballFill}" width="100" height="100" fill="currentColor" opacity=".42"/>
          </g>
          <g fill="none" stroke="currentColor" stroke-width="7">
            <circle cx="50" cy="50" r="40"/>
            <path d="M10 50h80M50 10v80M22 20c15 11 15 49 0 60M78 20c-15 11-15 49 0 60"/>
          </g>
        </svg>
        <span class="m-shuttle-wrap"><span class="m-shuttle-bob">
          <svg class="m-shuttle" viewBox="0 0 100 100" aria-hidden="true">
            <defs>
              <pattern id="m-net" width="9" height="100" patternUnits="userSpaceOnUse">
                <path d="M4.5,0 L4.5,100" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>
                <!-- the netting is always drawn; only its turning is earned, so the
                     spin waits for the claim to start it -->
                <animateTransform class="m-netspin" attributeName="patternTransform" type="translate"
                                  from="0 0" to="9 0" dur="1.1s" repeatCount="indefinite" begin="indefinite"/>
              </pattern>
              <clipPath id="m-skirt"><path d="M30,30 L45,75 L55,75 L70,30 Z"/><circle cx="50" cy="78" r="6"/></clipPath>
            </defs>
            <g transform="rotate(35 50 52)">
              <g clip-path="url(#m-skirt)">
                <rect class="m-liquid" x="0" y="${shuttleFill}" width="100" height="100" fill="currentColor" opacity=".38"/>
                <rect class="m-spin" width="100" height="100" fill="url(#m-net)"/>
              </g>
              <g fill="none" stroke="currentColor" stroke-linecap="round">
                <path d="M45,75 C45,82 55,82 55,75 Z" stroke-width="4"/><path d="M45,75 L55,75" stroke-width="4"/>
                <path d="M30,30 L45,75 L55,75 L70,30 Z" stroke-width="4"/>
                <path d="M36,45 L64,45" stroke-width="2.8"/><path d="M41,60 L59,60" stroke-width="2.8"/>
              </g>
            </g>
          </svg>
        </span></span>
        <span class="m-bang" aria-hidden="true">!</span>
      </button>
      <small>+${today.allBonus}</small>
    </div>
  </div>`;
}

export async function renderStatsView(): Promise<void> {
  if (!statsGrid) return;

  await ensureReviewsLoaded();
  const vocab = await loadVocab();
  const reviews = Array.from(getReviewsSnapshot().values());
  const cardsById = new Map<CardId, Card>(vocab.map((c) => [c.id, c]));

  const profile = await loadProfile();
  const { summary: pointsSummary, rank } = await getPointsState();
  const missions = await getTodayMissions();
  const daysStudied = computeDaysStudied(reviews);
  const bestStreak = computeBestStreak(reviews);

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

  // profile: rank and total xp live here rather than in the gallery. they are
  // statements about the user, not about the collection.
  // xp earned while away is counted up on arrival rather than already being
  // there. the total itself is untouched - everything else still reads it -
  // this only defers what the card shows.
  const shownTotal = profile.seenPoints >= 0 ? Math.min(profile.seenPoints, pointsSummary.total) : pointsSummary.total;
  const pendingXp = pointsSummary.total - shownTotal;
  const shownRank = rankFor(shownTotal);
  const rankPct = Math.round(shownRank.progress * 100);
  const toNextRank =
    shownRank.nextAt !== null ? `${(shownRank.nextAt - shownTotal).toLocaleString()} xp to ${shownRank.nextName}` : 'Top rank';

  statsGrid.innerHTML = `
    <div class="player-card">
      <div class="pc-art">
        ${profile.banner ? `<img id="pc-art-img" src="${BASE}${profile.banner}" alt="">` : ''}
      </div>
      <button class="pc-banner-btn" id="btn-pick-banner">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 3H3a2 2 0 00-2 2v14a2 2 0 002 2h18a2 2 0 002-2V5a2 2 0 00-2-2zm0 16H3V5h18v14zM8.5 12.5l2.5 3 3.5-4.5 4.5 6H5l3.5-4.5z"/></svg>
        Banner
      </button>
      <div class="pc-inner">
        <button class="pc-avatar" id="btn-pick-avatar" aria-label="Change profile picture">
          ${
            profile.avatar
              ? `<span class="pc-avatar-clip"><img id="pc-avatar-img" src="${profile.avatar}" alt=""></span>`
              : `<span class="pc-silhouette"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-5 0-9 2.5-9 5.5V22h18v-2.5c0-3-4-5.5-9-5.5z"/></svg></span>`
          }
          <span class="pc-pen"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 000-1.41l-2.34-2.34a1 1 0 00-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg></span>
        </button>
        <div class="pc-name">
          <div class="pc-id"><h3>${displayName(profile)}</h3><button class="pc-rank" id="btn-rank" aria-label="What ${shownRank.name} earns you">${shownRank.name}</button></div>
          <div class="pc-xp"><b id="pc-total">${shownTotal.toLocaleString()}</b><span>xp</span></div>
        </div>
        <div class="pc-bar"><i id="pc-fill" style="width:${rankPct}%"></i><span class="pc-edge" id="pc-edge"></span></div>
        <div class="pc-next" id="pc-next">${toNextRank}</div>
        <div class="pc-pills">
          <div class="pc-pill"><b>${started.toLocaleString()}</b><span>words known</span></div>
          <div class="pc-pill"><b>${daysStudied}</b><span>days studied</span></div>
          <div class="pc-pill"><b>${bestStreak}</b><span>best streak</span></div>
        </div>
      </div>
    </div>

    <div class="stat-tile stat-tile-full stat-missions">
      <div class="missions-head">
        <h4>Daily workout</h4>
        <span class="missions-count${missions.allDone ? ' is-done' : ''}">${missions.doneCount}/${missions.missions.length}</span>
      </div>
      ${missionTrack(missions)}
      <p class="missions-foot${missions.bonusClaimed ? ' is-done' : ''}">
        <strong id="missions-xp">${missions.earned - (missions.bonusReady ? missions.allBonus : 0)}</strong> / ${missions.earned + missions.remaining} xp today
      </p>
    </div>

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

  syncDailyRing(missions.doneCount, missions.missions.length, !missions.bonusClaimed);
  syncPendingXp(0);
  wireBonusClaim(missions);
  applyStoredPositions(profile.bannerPos, profile.avatarPos);
  wireRankSheet(rank, pointsSummary.total);
  if (pendingXp > 0) void countUpXp(shownTotal, pointsSummary.total);
  else if (profile.seenPoints !== pointsSummary.total) void saveProfile({ seenPoints: pointsSummary.total });
  wirePickers(profile.banner, profile.bannerPos, profile.avatar, profile.avatarPos);
}

/**
 * puts the banner and avatar where the user left them.
 *
 * the avatar's 3px ring is not part of its frame, so the frame comes from
 * clientWidth rather than the border box - measuring the wrong one shifts the
 * crop away from what the editor showed.
 */
function applyStoredPositions(bannerPos: ImagePos, avatarPos: ImagePos): void {
  const place = (img: HTMLImageElement | null, pos: ImagePos): void => {
    if (!img) return;
    const frame = img.parentElement;
    if (!frame) return;
    const draw = (): void => {
      if (!img.naturalWidth) return;
      const p = placement(pos, img.naturalWidth, img.naturalHeight, frame.clientWidth, frame.clientHeight);
      img.style.position = 'absolute';
      img.style.left = '50%';
      img.style.top = '50%';
      img.style.maxWidth = 'none';
      img.style.width = `${p.width}px`;
      img.style.height = `${p.height}px`;
      img.style.objectFit = 'fill';
      img.style.transform = `translate(calc(-50% + ${p.x}px), calc(-50% + ${p.y}px))`;
    };
    if (img.complete && img.naturalWidth) draw();
    else img.addEventListener('load', draw, { once: true });
  };
  place(document.querySelector<HTMLImageElement>('#pc-art-img'), bannerPos);
  place(document.querySelector<HTMLImageElement>('#pc-avatar-img'), avatarPos);
}

const TICK_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>';
const STAR_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2l3.1 6.3 7 1-5 4.9 1.2 6.9L12 17.8 5.7 21.1 6.9 14.2l-5-4.9 7-1z"/></svg>';

/** the same padlock the gallery seals its unseen pieces with */
const LOCK_SVG =
  '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-9h-1V6A5 5 0 007 6v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM9 6a3 3 0 016 0v2H9V6z"/></svg>';

/**
 * counts the waiting xp up in front of the user.
 *
 * the number climbs with a ghost of the gain rising off it, and the bar fills
 * behind a bright leading edge. the rank chip and the "to next" line are
 * repainted from the animating value, so crossing a rank happens on screen
 * rather than having already happened.
 */
async function countUpXp(from: number, to: number): Promise<void> {
  const total = document.getElementById('pc-total');
  const fill = document.getElementById('pc-fill');
  const edge = document.getElementById('pc-edge');
  const chip = document.getElementById('btn-rank');
  const next = document.getElementById('pc-next');
  await saveProfile({ seenPoints: to });
  if (!total || !fill) return;

  const paint = (value: number): void => {
    total.textContent = Math.round(value).toLocaleString();
    const r = rankFor(value);
    const pct = Math.round(r.progress * 100);
    fill.style.width = `${pct}%`;
    if (edge) edge.style.left = `calc(${pct}% - 16px)`;
    if (chip && chip.textContent !== r.name) {
      chip.textContent = r.name;
      chip.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.35)' }, { transform: 'scale(1)' }], {
        duration: 520,
        easing: 'cubic-bezier(.3,.9,.4,1)',
      });
    }
    if (next) {
      next.textContent =
        r.nextAt !== null
          ? `${Math.round(r.nextAt - value).toLocaleString()} xp to ${r.nextName}`
          : 'Top rank';
    }
  };

  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    paint(to);
    return;
  }

  // the gain rises off the number as it climbs
  const ghost = document.createElement('span');
  ghost.className = 'pc-ghost';
  ghost.textContent = `+${(to - from).toLocaleString()} xp`;
  total.parentElement?.appendChild(ghost);
  ghost.animate(
    [
      { transform: 'translateY(6px)', opacity: 0 },
      { transform: 'translateY(-8px)', opacity: 1, offset: 0.3 },
      { transform: 'translateY(-34px)', opacity: 0 },
    ],
    { duration: 1200, easing: 'cubic-bezier(.2,.8,.3,1)' }
  ).onfinish = () => ghost.remove();

  edge?.animate([{ opacity: 0 }, { opacity: 0.9, offset: 0.12 }, { opacity: 0.9, offset: 0.82 }, { opacity: 0 }], {
    duration: 1200,
  });

  const start = performance.now();
  await new Promise<void>((done) => {
    const step = (now: number): void => {
      const p = Math.min(1, (now - start) / 1200);
      paint(from + (to - from) * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
      else done();
    };
    requestAnimationFrame(step);
  });
}

/**
 * the completion bonus is collected by hand.
 *
 * anticipation, then the pop: squashing first is what stops the pop reading as
 * a glitch. the counter ticks rather than jumping - an instant jump is
 * invisible, and the tick is the part that feels like being paid.
 */
function wireBonusClaim(missions: TodayMissions): void {
  const button = document.getElementById('btn-claim-bonus');
  const bonus = button?.closest<HTMLElement>('.m-bonus');
  if (!button || !bonus) return;

  // a day already collected picks its net back up on load
  if (missions.bonusClaimed) startNet(bonus);
  if (!missions.bonusReady) return;

  button.addEventListener(
    'click',
    () => {
      bonus.classList.remove('is-ready');
      // the tab ring is up only while the day still owes something, so it has
      // to be told the moment the prize is taken
      void claimDailyBonus().then(() => refreshMissionDot());

      const art = bonus.querySelector<SVGElement>('.m-ball, .m-shuttle');
      button.animate(
        [
          { transform: 'scale(1) rotate(0deg)' },
          { transform: 'scale(.8, 1.14) rotate(-6deg)', offset: 0.18 },
          { transform: 'scale(1.32, .84) rotate(4deg)', offset: 0.44 },
          { transform: 'scale(1) rotate(0deg)' },
        ],
        { duration: 560, easing: 'cubic-bezier(.3,.9,.4,1)' }
      );
      // the prize colours in, so collecting reads as it becoming yours
      art?.animate([{ opacity: 0.5 }, { opacity: 1 }], {
        duration: 560,
        easing: 'cubic-bezier(.3,.9,.4,1)',
        fill: 'forwards',
      });
      bonus
        .querySelector('.m-bang')
        ?.animate([{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(1.6)', opacity: 0 }], {
          duration: 260,
          easing: 'ease-out',
          fill: 'forwards',
        });

      burstFrom(bonus);
      floatReward(bonus, missions.allBonus);
      tickTo('missions-xp', missions.earned - missions.allBonus, missions.earned);

      window.setTimeout(() => {
        bonus.classList.add('is-claimed');
        startNet(bonus);
      }, 560);
      navigator.vibrate?.([12, 45, 20]);
    },
    { once: true }
  );
}

const startNet = (bonus: HTMLElement): void => {
  const spin = bonus.querySelector('.m-netspin');
  (spin as unknown as { beginElement?: () => void })?.beginElement?.();
};

function burstFrom(bonus: HTMLElement): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const host = document.createElement('span');
  host.className = 'm-burst';
  bonus.appendChild(host);
  const colours = ['var(--accent-primary)', '#ffd166', '#ffffff', '#ff9d5c'];
  for (let i = 0; i < 14; i++) {
    const spark = document.createElement('i');
    spark.style.background = colours[i % colours.length]!;
    host.appendChild(spark);
    const angle = (Math.PI * 2 * i) / 14 + Math.random() * 0.45;
    const distance = 32 + Math.random() * 28;
    spark.animate(
      [
        { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: 1 },
        {
          transform: `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance + 16}px) scale(.35) rotate(${Math.random() * 420}deg)`,
          opacity: 0,
        },
      ],
      { duration: 640 + Math.random() * 240, easing: 'cubic-bezier(.15,.8,.4,1)' }
    ).onfinish = () => spark.remove();
  }
  window.setTimeout(() => host.remove(), 1000);
}

function floatReward(bonus: HTMLElement, amount: number): void {
  const label = document.createElement('span');
  label.className = 'm-flyxp';
  label.textContent = `+${amount}`;
  bonus.appendChild(label);
  label.animate(
    [
      { transform: 'translateX(-50%) scale(.4)', opacity: 0 },
      { transform: 'translateX(-50%) translateY(-8px) scale(1.3)', opacity: 1, offset: 0.3 },
      { transform: 'translateX(-50%) translateY(-38px) scale(1)', opacity: 0 },
    ],
    { duration: 920, easing: 'cubic-bezier(.2,.8,.3,1)' }
  ).onfinish = () => label.remove();
}

function tickTo(id: string, from: number, to: number): void {
  const el = document.getElementById(id);
  if (!el) return;
  const start = performance.now();
  const step = (now: number): void => {
    const p = Math.min(1, (now - start) / 700);
    el.textContent = String(Math.round(from + (to - from) * (1 - Math.pow(1 - p, 3))));
    if (p < 1) requestAnimationFrame(step);
  };
  window.setTimeout(() => requestAnimationFrame(step), 250);
}

/** an example sitting, so the bonus is shown as xp rather than as a percentage */
const EXAMPLE_ANSWERS = 40;

/** created once - createModal wires drag-to-dismiss on every call */
let rankModal: ModalController | null = null;

/**
 * the rank chip explains what the rank is actually worth.
 *
 * the bonus is the only mechanical difference between ranks, and nothing on
 * the card said so - the chip read as decoration.
 */
function wireRankSheet(rank: Rank, total: number): void {
  const overlay = document.getElementById('rank-modal-overlay');
  const button = document.getElementById('btn-rank');
  if (!overlay || !button) return;
  const body = overlay.querySelector<HTMLElement>('.rank-body');
  if (!body) return;

  button.addEventListener('click', () => {
    const pct = Math.round(rank.bonus * 100);
    const bonusXp = Math.round(EXAMPLE_ANSWERS * rank.bonus);

    body.innerHTML = `
      <h3 id="rank-sheet-title" class="rk-title">${rank.name}</h3>
      <p class="rk-lead">Finishing a session pays back
        <b>${pct}%</b> of its answers again.</p>

      <div class="rk-sum">
        <span>${EXAMPLE_ANSWERS} answers</span>
        <span class="rk-plus">+ ${bonusXp} finish bonus</span>
        <b>${EXAMPLE_ANSWERS + bonusXp} xp</b>
      </div>
      <p class="rk-note">A full session, first of the day. Later sittings are worth less,
        and leaving one unfinished pays the answers without the bonus.</p>

      <ol class="rk-road">
        ${RANKS.map((r, i) => {
          // the next rank stays named - the card already says "x xp to Captain"
          // right above this, so sealing it would contradict what is on screen.
          // past that the name and the bonus are the surprise; the cost is not,
          // since a visible goal motivates and a blank row does not.
          const sealed = i > rank.index + 1;
          const done = i < rank.index;
          const now = i === rank.index;
          const cls = sealed ? 'is-sealed' : now ? 'is-now' : done ? 'is-done' : 'is-next';
          const mark = sealed ? LOCK_SVG : done ? TICK_SVG : now ? STAR_SVG : String(i + 1);
          // the run you are standing on fills as you earn, so the distance to
          // the next rank is drawn rather than only written
          const run = now ? `<span class="rk-run" style="height:${Math.round(rank.progress * 100)}%"></span>` : '';
          return `<li class="rk-stop ${cls}">
            ${run}
            <span class="rk-node">${mark}</span>
            <span class="rk-name">${sealed ? 'Locked' : r.name}${
              i === rank.index + 1 ? '<span class="rk-tag">NEXT</span>' : ''
            }</span>
            <span class="rk-at">${i === 0 ? '&mdash;' : r.at.toLocaleString()}</span>
            <span class="rk-bonus">${sealed ? '?' : `${Math.round(r.bonus * 100)}%`}</span>
          </li>`;
        }).join('')}
      </ol>

      <p class="rk-next">${
        rank.nextAt !== null
          ? `${(rank.nextAt - total).toLocaleString()} xp to ${rank.nextName}`
          : 'Top rank &mdash; every finished session pays double'
      }</p>`;

    rankModal ??= createModal(overlay);
    rankModal.open();
  });
}

/** a clone of the live profile card, for positioning the banner inside it */
function cardPreview(): { node: HTMLElement; frameSelector: string; width: number } | null {
  const card = document.querySelector<HTMLElement>('.player-card');
  if (!card || card.clientWidth <= 0) return null;
  // the border box: the card is border-box sized, so measuring the content box
  // would rebuild the clone a border narrower and shift the art's aspect
  const width = card.getBoundingClientRect().width;
  const node = card.cloneNode(true) as HTMLElement;
  // the editor supplies its own picture and must not inherit the placement
  // that was computed for the card on the page
  node.querySelector('.pc-art img')?.remove();
  node.querySelector('.pc-banner-btn')?.remove();
  return { node, frameSelector: '.pc-art', width };
}

/** the profile card's art area as it is right now, falling back to the design size */
function liveArtAspect(): number {
  const art = document.querySelector<HTMLElement>('.pc-art');
  if (art && art.clientWidth > 0 && art.clientHeight > 0) {
    return art.clientWidth / art.clientHeight;
  }
  return 359 / 270;
}

function wirePickers(
  banner: string,
  bannerPos: ImagePos,
  avatar: string,
  avatarPos: ImagePos
): void {
  const overlay = document.getElementById('picker-modal-overlay');
  if (!overlay) return;

  const open = async (target: 'avatar' | 'banner'): Promise<void> => {
    const { summary } = await getPointsState();
    const sagas = await loadGallery();
    const pictures = unlockedImages(sagas, effectivePoints(summary.total)).map((p) => ({
      ...p,
      image: `${BASE}${p.image}`,
      thumb: p.thumb ? `${BASE}${p.thumb}` : '',
    }));

    openImagePicker(overlay, {
      target,
      title: target === 'avatar' ? 'Profile picture' : 'Banner',
      // measured, never assumed: the card is as wide as the viewport allows, so
      // its art is a different shape on every phone and a constant here would
      // crop to something the card never shows
      frameAspect: target === 'avatar' ? 1 : liveArtAspect(),
      round: target === 'avatar',
      tileAspect: target === 'avatar' ? '1' : '3 / 2',
      columns: target === 'avatar' ? 4 : 2,
      allowPhoto: target === 'avatar',
      // the banner is positioned on a live clone of the card itself, so what
      // you drag against is the real avatar, name and fade
      preview: target === 'banner' ? cardPreview() : null,
      clearLabel: target === 'avatar' ? 'Remove picture' : 'No banner',
      pictures,
      current: {
        image: target === 'avatar' ? avatar : banner ? `${BASE}${banner}` : '',
        pos: target === 'avatar' ? avatarPos : bannerPos,
      },
      async onSave(image, pos, file) {
        if (target === 'avatar') {
          // a phone photo is baked down to 256px here; a gallery picture is
          // already small, so it is stored by path and positioned on render
          const value = file ? await photoToAvatar(file, pos) : image;
          await saveProfile({ avatar: value, avatarPos: file ? { ...DEFAULT_POS } : pos });
        } else {
          await saveProfile({ banner: image.replace(BASE, ''), bannerPos: pos });
        }
        await renderStatsView();
      },
      async onClear() {
        if (target === 'avatar') await saveProfile({ avatar: '', avatarPos: { ...DEFAULT_POS } });
        else await saveProfile({ banner: '', bannerPos: { ...DEFAULT_POS } });
        await renderStatsView();
      },
    });
  };

  document.getElementById('btn-pick-avatar')?.addEventListener('click', () => void open('avatar'));
  document.getElementById('btn-pick-banner')?.addEventListener('click', () => void open('banner'));
}
