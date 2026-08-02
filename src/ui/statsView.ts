import { loadVocab } from '../data/loader';
import { ensureReviewsLoaded, getReviewsSnapshot } from '../state/reviews';
import {
  computeRetention,
  computeReviewsPerDay,
  computeStateCounts,
  computeWeakestTopics,
  computeStreak,
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

export async function renderStatsView(): Promise<void> {
  if (!statsGrid) return;

  await ensureReviewsLoaded();
  const vocab = await loadVocab();
  const reviews = Array.from(getReviewsSnapshot().values());

  const cardsById = new Map<CardId, Card>(vocab.map((c) => [c.id, c]));

  const retention = computeRetention(reviews);
  const perDay = computeReviewsPerDay(reviews, new Date(), 30);
  const stateCounts = computeStateCounts(reviews, vocab.length);
  const weakestTopics = computeWeakestTopics(reviews, cardsById);
  const streak = computeStreak(reviews);

  const maxCount = Math.max(1, ...perDay.map((d) => d.count));
  const chartBars = perDay
    .map((d) => {
      const heightPct = Math.round((d.count / maxCount) * 100);
      return `<div class="reviews-chart-bar" style="height: ${Math.max(3, heightPct)}%" title="${d.date}: ${d.count} review${d.count === 1 ? '' : 's'}"></div>`;
    })
    .join('');

  const topicRows = weakestTopics.length
    ? weakestTopics
        .map(
          (t) =>
            `<div class="topic-lapse-row"><span>${TOPIC_LABELS[t.topic] ?? t.topic}</span><span>${t.lapses} lapse${t.lapses === 1 ? '' : 's'}</span></div>`
        )
        .join('')
    : `<p style="color: var(--text-secondary); font-size: 0.9rem;">No lapses yet - nice work!</p>`;

  statsGrid.innerHTML = `
    <div class="stat-tile">
      <h4>🔥 Streak</h4>
      <div class="stat-value">${streak} day${streak === 1 ? '' : 's'}</div>
    </div>
    <div class="stat-tile">
      <h4>Retention (30d)</h4>
      <div class="stat-value">${Math.round(retention.retention * 100)}%</div>
    </div>
    <div class="stat-tile">
      <h4>Cards by Status</h4>
      <div style="font-size: 0.9rem; line-height: 1.8;">
        <div>New: <strong>${stateCounts.new}</strong></div>
        <div>Learning: <strong>${stateCounts.learning}</strong></div>
        <div>Review: <strong>${stateCounts.review}</strong></div>
        <div>Relearning: <strong>${stateCounts.relearning}</strong></div>
      </div>
    </div>
    <div class="stat-tile stat-tile-full">
      <h4>Reviews - Last 30 Days</h4>
      <div class="reviews-chart">${chartBars}</div>
    </div>
    <div class="stat-tile stat-tile-full">
      <h4>Weakest Topics (by lapses)</h4>
      ${topicRows}
    </div>
  `;
}
