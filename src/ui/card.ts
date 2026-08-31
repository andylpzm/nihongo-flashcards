import { loadVocab, loadKana, loadKanji } from '../data/loader';
import { readingRow } from './kanjiReadings';
import { isVocabCard, isKanjiCard } from '../data/types';
import type { Pos } from '../data/types';
import { FeedbackAudio } from '../audio/feedback';
import { speakJapanese } from '../audio/tts';
import { state } from '../state/store';
import type { ActiveDeck, Card, FilterMode, LevelFilter, StudyMode } from '../state/types';
import { saveFilters } from '../state/persistence';
import {
  ensureReviewsLoaded,
  getReviewsSnapshot,
  getReview,
  recordGrade,
} from '../state/reviews';
import { Rating, newFsrsCard, previewIntervals } from '../srs/scheduler';
import type { RecordLogItem } from 'ts-fsrs';
import { buildQueue, buildRandomQueue, type QueueItem, type QueueBuildResult } from '../srs/queue';
import { StudySession } from '../srs/session';
import { loadSettings, saveSettings, SESSION_SIZES, type StudySettings } from '../srs/settings';
import { saveActiveSession, loadActiveSession, clearActiveSession } from '../srs/sessionStore';
import { renderSessionBar, clearSessionBar, type SessionBarState } from './sessionBar';
import type { Grade, SessionRecord } from '../srs/types';
import { computeStreak } from '../srs/stats';
import { dateKey } from '../srs/dates';
import { recordSession } from '../state/profile';
import { loadGallery } from '../data/loader';
import { announceSessionReward } from './galleryView';
import { refreshMissionDot } from './statsView';
import { refreshBinderTab } from './binderTab';
import { isKnown, toggleKnown, countKnownIn } from '../state/known';
import { promotionLabel } from '../srs/points';
import { markGalleryUnread } from './galleryBadge';

// DOM Elements - Card Workspace
export const cardViewport = document.getElementById('card-viewport')!;
const cardFront = document.getElementById('card-front')!;
const cardBack = document.getElementById('card-back')!;

export const prevBtn = document.getElementById('btn-prev') as HTMLButtonElement;
export const nextBtn = document.getElementById('btn-next') as HTMLButtonElement;
const navButtons = document.getElementById('nav-buttons')!;

// Study Mode + Session Bar
export const modeSessionBtn = document.getElementById('mode-session')!;
export const modeBrowseBtn = document.getElementById('mode-browse')!;
export const btnStartSession = document.getElementById('btn-start-session') as HTMLButtonElement;
export const btnEndSession = document.getElementById('btn-end-session') as HTMLButtonElement;
const sessionLengthGroup = document.getElementById('session-length-group');

// Grade Buttons
const gradeButtonsEl = document.getElementById('grade-buttons')!;
export const btnGradeAgain = document.getElementById('btn-grade-again')!;
export const btnGradeHard = document.getElementById('btn-grade-hard')!;
export const btnGradeGood = document.getElementById('btn-grade-good')!;
export const btnGradeEasy = document.getElementById('btn-grade-easy')!;
// Proposal Progress Counters
const proposalRemainingEl = document.getElementById('proposal-remaining');
const proposalBarFillEl = document.getElementById('proposal-bar-fill') as HTMLElement | null;
const countLearnedEl = document.getElementById('count-learned');
const countTotalEl = document.getElementById('count-total');
const countStreakEl = document.getElementById('count-streak');
export const btnMarkKnown = document.getElementById('btn-mark-known') as HTMLButtonElement | null;
const markKnownLabel = document.getElementById('mark-known-label');

// Filter toggles
// Deck bar: the filtered-deck summary line that replaced the old options-row
// pill wall. It is the only trigger for the filter sheet.
const deckBar = document.getElementById('btn-open-filters');
const deckBarCount = document.getElementById('deck-bar-count');
const deckBarSummary = document.getElementById('deck-bar-summary');
const deckBarBadge = document.getElementById('deck-bar-badge');

// Filter sheet sections, shown/hidden per deck and study mode
const filterSectionProgress = document.getElementById('filter-section-progress');
const filterSectionLevel = document.getElementById('filter-section-level');
const filterSectionTypes = document.getElementById('filter-section-types');
const filterSectionTopics = document.getElementById('filter-section-topics');

// Totals are read off the sheet's own chips so the "is this filter narrowed?"
// check can't drift out of sync with the markup.
const totalTypeChips = document.querySelectorAll('.types-grid .filter-chip-btn').length;
const totalTopicChips = document.querySelectorAll('.topics-grid .filter-chip-btn').length;


// Active study session (Study Session mode only) - null when not running one.
let activeSession: StudySession | null = null;
let cardShownAt = Date.now();

// Most recent queue-build result for the active deck/filters, kept for the
// idle session-bar states and for renderEmptyState() (D3): the card face
// must never claim "All caught up!" while unlearned cards remain.
let lastBuild: QueueBuildResult | null = null;

// Set once a session finishes (naturally or via "End session"); cleared the
// next time the user does something that supersedes it (starts a session,
// switches mode/deck, or the idle bar determines nothing is left to start
// another with).
let sessionComplete: { answers: number; elapsedMs: number; endedEarly: boolean } | null = null;

// The preview computed when the card was flipped (D5/D10/D11): grading
// commits exactly this object rather than rescheduling, so the interval a
// button advertises is guaranteed to be the interval written to IndexedDB.
let pendingPreview: Record<Grade, RecordLogItem> | null = null;

// which day a half-finished session belongs to. the same 6am boundary as the
// streak and the missions (srs/dates.ts): bucketing this by UTC instead meant
// that somewhere around 2am local the app decided last night's session was
// stale and threw it away, on a screen still calling it the same day.
const todayKey = (now: Date): string => dateKey(now.getTime());

export function persistFilters(): void {
  saveFilters({
    filterMode: state.filterMode,
    levelFilter: state.levelFilter,
    selectedVocabTypes: state.selectedVocabTypes,
    selectedVocabTopics: state.selectedVocabTopics,
  });
}

// Maps the new 8-value Pos schema onto the filter drawer's 4 legacy buckets
// (Nouns / Verbs / Adjectives / Miscellaneous), so the existing UI keeps
// working without needing a redesign in this phase.
function posToTypeBucket(pos: Pos): string {
  if (pos === 'noun') return 'nouns';
  if (pos === 'verb') return 'verbs';
  if (pos === 'i-adj' || pos === 'na-adj') return 'adjectives';
  return 'misc'; // adverb, expression, counter, other
}

// Cards passing the level/type/topic filters (progress filter is Browse-mode
// only - Study Session mode uses due/new instead of all/learning/mastered).
function getFilteredCards(applyProgressFilter: boolean): Card[] {
  // Level/type/topic only exist on the vocabulary deck. Kana cards carry no
  // `level`, so applying a leftover N5/N4 choice to them rejects every card
  // and empties the deck - guard the whole block, not just the type/topic
  // half.
  const vocabScope = state.activeDeck === 'vocabulary';

  return state.cards.filter((card) => {
    // Browse-only. "Learned" here is the user's own mark (state/known.ts),
    // not FSRS mastery - which is why marking a word cannot alter a session:
    // session queues are built with applyProgressFilter = false.
    if (applyProgressFilter) {
      const mastered = isKnown(card.id);
      const matchesProgress =
        state.filterMode === 'all' ||
        (state.filterMode === 'learning' && !mastered) ||
        (state.filterMode === 'mastered' && mastered);
      if (!matchesProgress) return false;
    }

    if (vocabScope && isVocabCard(card)) {
      if (state.levelFilter !== 'all' && card.level !== state.levelFilter) return false;
      if (!state.selectedVocabTypes.includes(posToTypeBucket(card.pos))) return false;
      if (!card.topics.some((t) => state.selectedVocabTopics.includes(t))) return false;
    }

    return true;
  });
}

/** hiragana and katakana are scheduled at random rather than by due date -
 * see buildRandomQueue(). one tab is 25-46 cards, which fsrs runs dry. */
const isKanaDeck = (deck: ActiveDeck): boolean => deck === 'hiragana' || deck === 'katakana';

// Build the queue for a sitting. Session length is the only limit - there are
// no daily budgets, which used to shrink a session below the chosen preset.
function buildTodayQueueResult(candidates: Card[], settings: StudySettings, now: Date = new Date()): QueueBuildResult {
  const size = SESSION_SIZES[settings.sessionLength];
  // the kana tab is whatever loadDeck() put in state.cards, so drawing from
  // `candidates` keeps basic, voiced and combos as three separate pools
  if (isKanaDeck(state.activeDeck)) {
    return buildRandomQueue(candidates, getReviewsSnapshot(), size);
  }
  return buildQueue(candidates, getReviewsSnapshot(), size, now);
}

// Get the Active Card Object: from the running session's queue in Study
// Session mode, or from the shuffled displayOrder in Browse mode.
export function getActiveCard(): Card | null {
  if (state.studyMode === 'session') {
    return activeSession?.current?.card ?? null;
  }
  if (state.displayOrder.length === 0) return null;
  const originalIndex = state.displayOrder[state.currentIndex];
  if (originalIndex === undefined) return null;
  return state.cards[originalIndex] ?? null;
}

// Eye Open icon SVG
function getEyeOpenSVG(): string {
  return `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
}

// Eye Closed icon SVG
function getEyeClosedSVG(): string {
  return `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.82l2.92 2.92C21.18 15.39 22.5 13.85 23 12c-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;
}

// Build the small "Kanji: X | Level: NX" style sub-info line for vocab cards.
// Kana cards carry no such metadata, so they render nothing here.
function getCardSubInfo(card: Card): string {
  if (!isVocabCard(card)) return '';
  const parts: string[] = [];
  if (card.kanji) parts.push(`Kanji: ${card.kanji}`);
  parts.push(`Level: ${card.level}`);
  return parts.join(' | ');
}

// Render UI for Card
export function renderCard(): void {
  const currentCard = getActiveCard();
  cardShownAt = Date.now();

  // Reset Flipped Class and answer glow classes.
  //
  // Both faces are rewritten below, so the back is about to hold the NEXT
  // card's answer - and if the un-flip is allowed to animate, that answer is
  // what faces the user for the first half of the turn. Suppress the
  // transition for this one frame so the new card is just there, face-down.
  // The reflow is what makes it take effect before the class comes back off.
  cardViewport.classList.add('no-flip-anim');
  cardViewport.classList.remove('flipped');
  void cardViewport.offsetWidth;
  requestAnimationFrame(() => cardViewport.classList.remove('no-flip-anim'));
  state.isFlipped = false;
  hideGradeButtons();


  // Chrome visibility depends on the mode, not on there being a card, so it
  // has to be settled before the empty-state early return below - otherwise
  // the idle "Ready when you are" screen keeps whatever Browse last left on
  // screen, stranding "Mark as learned" in Study Session mode.
  updateNavAndModeVisibility();
  syncMarkKnownButton();

  // Handle empty state (e.g. no cards in filter, or an idle Study Session).
  if (!currentCard) {
    renderEmptyState();
    return;
  }

  // JLPT level, where the deck has one.
  let level = '';
  if (isVocabCard(currentCard) || isKanjiCard(currentCard)) {
    level = currentCard.level;
  }

  // Homophones (あつい = hot / thick) need something on the front to say which
  // sense is being asked, or you can't fairly grade yourself. That used to be
  // an English hint in parentheses - which for 58 of 81 cards simply *was* the
  // answer ("はし (chopsticks)"). The kanji disambiguates without leaking the
  // English, and is the distinguishing feature worth learning anyway.
  const disambiguator =
    isVocabCard(currentCard) && currentCard.homophoneGroup && currentCard.kanji
      ? currentCard.kanji
      : '';

  // FRONT: Japanese
  cardFront.innerHTML = `
    <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-start;">
      <span class="card-indicator">${isKanjiCard(currentCard) ? 'Kanji' : 'Japanese'} ${level ? `<span class="level-badge">${level}</span>` : ''}</span>
      <div style="display: flex; gap: 0.5rem;">
        ${state.activeDeck === 'vocabulary' ? `
          <button class="speak-button" id="btn-toggle-romaji" title="${state.showRomaji ? 'Hide Romaji [R]' : 'Show Romaji [R]'}" aria-label="Toggle Romaji">
            ${state.showRomaji ? getEyeOpenSVG() : getEyeClosedSVG()}
          </button>
        ` : ''}
        <button class="speak-button" id="btn-speak" title="Listen Pronunciation [A]" aria-label="Listen Pronunciation">
          <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
        </button>
      </div>
    </div>
    <div class="japanese-container">
      <div class="${isKanjiCard(currentCard) ? 'kanji-glyph' : 'hiragana-text'}" lang="ja">${currentCard.kana}</div>
      ${state.activeDeck === 'vocabulary' ? `<div class="romaji-text">${currentCard.romaji}</div>` : ''}
      ${disambiguator ? `<div class="card-disambiguator" lang="ja">${disambiguator}</div>` : ''}
    </div>
    <span style="font-size: 0.85rem; color: var(--text-muted); opacity: 0.6;">Click or Press [Space] to flip</span>
  `;

  // BACK: English
  cardBack.innerHTML = isKanjiCard(currentCard)
    ? `
    <span class="card-indicator">Meaning</span>
    <div class="card-main-text">${currentCard.meanings.join(', ')}</div>
    <div class="kanji-readings">
      ${readingRow('On', currentCard.on)}
      ${readingRow('Kun', currentCard.kun)}
    </div>
    ${
      currentCard.examples.length
        ? `<div class="kanji-examples">${currentCard.examples
            .map(
              (e) =>
                `<div class="kanji-example"><span class="kanji-example-word" lang="ja">${e.word}</span><span class="kanji-example-reading" lang="ja">${e.reading}</span><span class="kanji-example-meaning">${e.meaning}</span></div>`
            )
            .join('')}</div>`
        : ''
    }
    <span class="kanji-strokes">${currentCard.strokes} stroke${currentCard.strokes === 1 ? '' : 's'}</span>
  `
    : `
    <span class="card-indicator">English</span>
    <div class="card-main-text">${currentCard.meanings.join(' / ')}</div>
    <div class="card-sub-info">${getCardSubInfo(currentCard)}</div>
  `;

  // Attach dynamic listener for speech icon (since cards are re-rendered)
  const speakBtn = document.getElementById('btn-speak');
  if (speakBtn) {
    speakBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Avoid re-flipping card
      speakJapanese(currentCard.kana);
    });
  }

  // Attach dynamic listener for Romaji toggle icon
  const romajiToggleBtn = document.getElementById('btn-toggle-romaji');
  if (romajiToggleBtn) {
    romajiToggleBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Avoid re-flipping card
      toggleRomajiVisibility();
    });
  }

}

// Render empty state (no cards in filter, or an idle/exhausted Study Session)
function renderEmptyState(): void {
  // The idle card used to print the same sentence twice - once as the
  // indicator, once as the headline - and carry no information at all. It now
  // reports what is waiting, which is the one thing worth knowing before you
  // press Start, and lets the session bar drop its duplicate count.
  const build = lastBuild;

  if (state.studyMode === 'session' && build && build.items.length > 0) {
    const total = build.items.length;
    cardFront.innerHTML = `
      <div class="ready-hero">
        <div class="ready-count">${total}</div>
        <div class="ready-label">card${total === 1 ? '' : 's'} ready</div>
      </div>
    `;
    cardBack.innerHTML = cardFront.innerHTML;
    hideGradeButtons();
    prevBtn.disabled = true;
    nextBtn.disabled = true;
    return;
  }

  // Never claim "all caught up" while unlearned cards remain in the deck (D3).
  const message =
    state.studyMode === 'session'
      ? build && build.newHeldBack > 0
        ? {
            title: 'Nothing scheduled right now',
            body: `${build.newHeldBack} cards are still unlearned - press "Learn more" to pull some in.`,
          }
        : { title: 'All caught up', body: 'No cards are due right now. Come back later, or Browse to review anyway.' }
      : { title: 'Nothing here', body: 'No cards match this filter. Try changing your filters.' };

  cardFront.innerHTML = `
    <div class="ready-hero">
      <div class="ready-title">${message.title}</div>
      <div class="ready-body">${message.body}</div>
    </div>
  `;
  cardBack.innerHTML = cardFront.innerHTML;

  hideGradeButtons();
  prevBtn.disabled = true;
  nextBtn.disabled = true;
}

/** Browse-only "Mark as learned" toggle. Lives inside .nav-buttons, which is
 * hidden in Study Session mode, so it can never be reached mid-session. */
function syncMarkKnownButton(): void {
  if (!btnMarkKnown || !markKnownLabel) return;
  const card = getActiveCard();
  if (!card || state.studyMode !== 'browse') {
    btnMarkKnown.disabled = true;
    btnMarkKnown.setAttribute('aria-pressed', 'false');
    markKnownLabel.textContent = 'Mark as learned';
    btnMarkKnown.classList.remove('is-known');
    return;
  }
  const known = isKnown(card.id);
  btnMarkKnown.disabled = false;
  btnMarkKnown.setAttribute('aria-pressed', String(known));
  btnMarkKnown.classList.toggle('is-known', known);
  markKnownLabel.textContent = known ? '\u2713 Learned' : 'Mark as learned';
}

/** Toggle the current Browse card's learned mark. Updates the counter and, if
 * the progress filter is narrowing the deck, drops the card out of view. */
export function toggleCurrentCardKnown(): void {
  if (state.studyMode !== 'browse') return;
  const card = getActiveCard();
  if (!card) return;
  toggleKnown(card.id);
  syncMarkKnownButton();
  updateStats();

  // With "Not learned" or "Learned" selected the card no longer belongs in the
  // current view, so rebuild the browse order and show the next one.
  if (state.filterMode !== 'all') {
    applyFiltersAndShuffle();
    if (state.currentIndex >= state.displayOrder.length) state.currentIndex = 0;
    renderCard();
  }
}

function updateNavAndModeVisibility(): void {
  navButtons.classList.toggle('hidden', state.studyMode === 'session');
  if (state.studyMode === 'browse') {
    const total = state.displayOrder.length;
    prevBtn.disabled = total === 0;
    nextBtn.disabled = total === 0;
  }
}

// Flip Card 3D Toggle
export function flipCard(silent = false): void {
  const hasCard = state.studyMode === 'session' ? !!activeSession?.current : state.displayOrder.length > 0;
  if (!hasCard) return;
  state.isFlipped = !state.isFlipped;
  cardViewport.classList.toggle('flipped', state.isFlipped);
  if (silent !== true) {
    FeedbackAudio.playFlip();
  }

  if (state.isFlipped && state.studyMode === 'session' && activeSession?.current) {
    showGradeButtons(activeSession.current);
  } else {
    hideGradeButtons();
  }
}

function showGradeButtons(item: QueueItem): void {
  const now = new Date();
  // Look the record up live. Reading a snapshot captured at queue-build time
  // is what made a re-queued card preview as though it were brand new (D5).
  const base = getReview(item.card.id)?.card ?? newFsrsCard(now);
  pendingPreview = previewIntervals(base, now);

  // No interval labels. They described an internal loop the user never
  // experiences: on a new card, Forgot/Hard/Normal all schedule minutes out
  // but the learn-ahead window pulls the card straight back into the sitting,
  // so "10m" actually meant "about 10 seconds". The one remaining honest
  // label (Easy) visibly jittered between 6d and 10d because FSRS fuzz
  // scatters due dates. When the work comes back is reported once, truthfully,
  // in the end-of-session summary instead.
  gradeButtonsEl.classList.remove('hidden');
}

function hideGradeButtons(): void {
  gradeButtonsEl.classList.add('hidden');
  pendingPreview = null;
}

// Next Card (Browse mode only)
export function nextCard(): void {
  if (state.studyMode !== 'browse') return;
  const total = state.displayOrder.length;
  if (total === 0) return;

  if (state.currentIndex < total - 1) {
    state.currentIndex++;
  } else {
    state.currentIndex = 0;
  }
  renderCard();
}

// Previous Card (Browse mode only, loops endlessly)
export function prevCard(): void {
  if (state.studyMode !== 'browse') return;
  const total = state.displayOrder.length;
  if (total === 0) return;

  if (state.currentIndex > 0) {
    state.currentIndex--;
  } else {
    state.currentIndex = total - 1;
  }
  renderCard();
}

// Change study filter (All, Learning, Mastered) - Browse mode
/** Commit every deck filter at once. The filter sheet stages its chips
 * locally and calls this on Apply, so a multi-filter change re-renders the
 * deck a single time instead of once per toggled control. */
export function applyDeckFilters(patch: {
  filterMode: FilterMode;
  levelFilter: LevelFilter;
  selectedVocabTypes: string[];
  selectedVocabTopics: string[];
}): void {
  state.filterMode = patch.filterMode;
  state.levelFilter = patch.levelFilter;
  state.selectedVocabTypes = patch.selectedVocabTypes;
  state.selectedVocabTopics = patch.selectedVocabTopics;

  state.currentIndex = 0;
  applyFiltersAndShuffle();
  persistFilters();
  updateDeckBar();
  refreshSessionBar();
  renderCard();
}

/** Which filter controls actually apply to what's on screen: progress is a
 * Browse-mode concept (a session is scheduled by due date), and level/type/
 * topic only exist on the vocabulary deck. */
function deckFilterScope(): { progress: boolean; vocab: boolean } {
  return {
    progress: state.studyMode === 'browse',
    vocab: state.activeDeck === 'vocabulary',
  };
}

/** Refresh the deck bar: how many cards the current filters select, a
 * human-readable summary of which filters are narrowing them, and a badge
 * counting the non-default ones. */
export function updateDeckBar(): void {
  if (!deckBar) return;
  const scope = deckFilterScope();

  deckBar.classList.remove('hidden');
  filterSectionProgress?.classList.toggle('hidden', !scope.progress);
  filterSectionLevel?.classList.toggle('hidden', !scope.vocab);
  filterSectionTypes?.classList.toggle('hidden', !scope.vocab);
  filterSectionTopics?.classList.toggle('hidden', !scope.vocab);

  const count = getFilteredCards(scope.progress).length;
  if (deckBarCount) deckBarCount.textContent = `${count} card${count === 1 ? '' : 's'}`;

  // Study Session mode: the queue is built from what's due, so filters can't
  // change it - offering them is a control that does nothing. Collapse the bar
  // to a plain count of what's in the deck.
  const staticCount = state.studyMode === 'session';
  deckBar.classList.toggle('is-static', staticCount);
  deckBar.toggleAttribute('disabled', staticCount);
  if (staticCount) {
    deckBar.removeAttribute('aria-haspopup');
    deckBar.setAttribute('aria-label', `${count} cards in this deck`);
  } else {
    deckBar.setAttribute('aria-haspopup', 'dialog');
    deckBar.setAttribute('aria-label', 'Deck filters');
  }

  const parts: string[] = [];
  if (scope.progress && state.filterMode !== 'all') parts.push(state.filterMode);
  if (scope.vocab) {
    if (state.levelFilter !== 'all') parts.push(state.levelFilter);
    if (state.selectedVocabTypes.length < totalTypeChips) {
      parts.push(`${state.selectedVocabTypes.length} of ${totalTypeChips} types`);
    }
    if (state.selectedVocabTopics.length < totalTopicChips) {
      parts.push(`${state.selectedVocabTopics.length} of ${totalTopicChips} topics`);
    }
  }

  if (deckBarSummary) {
    deckBarSummary.textContent = parts.length > 0 ? parts.join(' · ') : 'No filters';
  }
  if (deckBarBadge) {
    deckBarBadge.textContent = String(parts.length);
    deckBarBadge.classList.toggle('hidden', parts.length === 0);
  }
}

// Update the Browse-mode list order: filtered + shuffled
export function applyFiltersAndShuffle(): void {
  const filtered = getFilteredCards(true);
  const activeIndices = filtered.map((card) => state.cards.indexOf(card));

  // Fisher-Yates Shuffle
  for (let i = activeIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [activeIndices[i], activeIndices[j]] = [activeIndices[j]!, activeIndices[i]!];
  }

  state.displayOrder = activeIndices;
}

// ==================== STUDY SESSION LIFECYCLE ====================

/** Try to restore an in-flight session for `deckName` from localStorage
 * (Step 4 / D9). Only resumes when the persisted date is today and the deck
 * matches - a stale or cross-deck session is discarded instead. */
function tryResumeSession(deckName: string): boolean {
  const persisted = loadActiveSession();
  if (!persisted) return false;

  const today = todayKey(new Date());
  if (persisted.date !== today || persisted.deck !== deckName) {
    clearActiveSession();
    return false;
  }

  const cardsById = new Map(state.cards.map((c) => [c.id, c] as const));
  const items: QueueItem[] = [];
  for (const id of persisted.remainingCardIds) {
    const card = cardsById.get(id);
    if (card) items.push({ card, isNew: !getReview(id) });
  }

  if (items.length === 0) {
    clearActiveSession();
    return false;
  }

  activeSession = new StudySession(items, new Date(), {
    totalCards: persisted.totalCards,
    graduatedCount: Math.max(0, persisted.totalCards - persisted.remainingCardIds.length),
    answers: persisted.answers,
    correct: persisted.correct,
    startedAt: persisted.startedAt,
  });
  sessionComplete = null;
  return true;
}

function persistActiveSession(): void {
  if (!activeSession) return;
  const p = activeSession.progress;
  saveActiveSession({
    date: todayKey(new Date()),
    deck: state.activeDeck,
    remainingCardIds: activeSession.remainingCardIds,
    totalCards: p.total,
    startedAt: Date.now() - activeSession.elapsedMs,
    answers: p.answers,
    correct: p.correct,
  });
}

export async function startSession(): Promise<void> {
  await ensureReviewsLoaded();
  sessionComplete = null;
  const settings = loadSettings();
  const candidates = getFilteredCards(false);
  const build = buildTodayQueueResult(candidates, settings);
  lastBuild = build;

  if (build.items.length === 0) {
    activeSession = null;
    clearActiveSession();
    refreshSessionBar();
    renderCard();
    return;
  }

  activeSession = new StudySession(build.items, new Date());
  persistActiveSession();
  refreshSessionBar();
  renderCard();
}

export async function gradeCurrentCard(grade: Grade): Promise<void> {
  // Defense in depth: the grade buttons are CSS-hidden until the card is
  // flipped, but that alone doesn't stop a click handler from firing on a
  // hidden element, so guard the actual grading path too - grading must
  // never be reachable while the answer is still hidden.
  if (state.studyMode !== 'session' || !state.isFlipped || !activeSession?.current) {
    return;
  }
  const chosen = pendingPreview?.[grade];
  if (!chosen) return; // preview must exist - the buttons are only reachable when flipped

  const item = activeSession.current;
  const elapsedMs = Date.now() - cardShownAt;
  // taken BEFORE the await, not after it. recordGrade yields, and nothing about
  // the card changes while it does - so a second tap landing in that gap passed
  // every guard above and graded the same card twice: two log entries, two
  // steps through the queue, and an fsrs interval computed from a review that
  // never happened. dropping the preview first makes the second tap fall out at
  // the check above.
  pendingPreview = null;
  await recordGrade(item.card, grade, chosen.card, new Date(), elapsedMs);

  // Every grade gets audio confirmation. The three "I recalled it" grades share
  // one tone - they differ in scheduling, not in whether you got it - while
  // Forgot gets its own miss cue. Previously Hard was silent alongside Forgot,
  // which implied Hard was a failure rather than a successful recall.
  if (grade === Rating.Again) {
    FeedbackAudio.playMiss();
  } else {
    FeedbackAudio.playCorrect();
  }

  activeSession.advance(grade);
  updateStats();

  if (activeSession.isComplete) {
    finishSession(false);
  } else {
    persistActiveSession();
    refreshSessionBar();
    renderCard();
  }
}

/** @param endedEarly true when the user pressed "End session" rather than
 * working the queue down to empty. The two are different events and must
 * not both be reported as "complete". */
/* a sitting has ended, however it ended.
 *
 * a kana or kanji sitting is started from the Kana section but runs on the
 * study screen, and when it ends the study chrome comes back - so whoever
 * sent the user here needs to know to take them back. finishSession is the
 * single funnel for both endings, the natural one and endSessionEarly. */
/** @param showedRecap false when the sitting ended with nothing to report, so
 * the study screen is sitting on its idle state rather than on a summary. */
type SessionEndListener = (showedRecap: boolean) => void;
const sessionEndListeners: SessionEndListener[] = [];
export function onSessionEnd(fn: SessionEndListener): void {
  sessionEndListeners.push(fn);
}
function notifySessionEnd(showedRecap: boolean): void {
  for (const fn of sessionEndListeners) fn(showedRecap);
}

function finishSession(endedEarly: boolean): void {
  if (!activeSession) return;
  const p = activeSession.progress;
  const elapsedMs = activeSession.elapsedMs;
  const endedAt = Date.now();
  const elapsedSec = Math.round(elapsedMs / 1000);
  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;

  activeSession = null;
  clearActiveSession();

  // Nothing was graded, so there is no sitting to report on. Showing
  // "Session complete! 0 cards learned · 0 answers · 0% correct" for a
  // session the user opened and immediately left reads as a failure notice
  // and a 0% score - go quietly back to idle instead.
  if (p.answers === 0) {
    sessionComplete = null;
    hideGradeButtons();
    updateStats();
    refreshSessionBar();
    renderCard();
    notifySessionEnd(false);
    return;
  }

  sessionComplete = { answers: p.answers, elapsedMs, endedEarly };

  hideGradeButtons();
  prevBtn.disabled = true;
  nextBtn.disabled = true;

  updateStats();
  // Rebuild first so lastBuild.nextDueAt reflects the reviews just written -
  // "when do these come back?" is the one thing worth reporting.
  refreshSessionBar();

  // "Learned" means graduated out of the learning steps. Ending a sitting
  // early usually leaves everything mid-step, so reporting "0 cards learned"
  // next to a real answer count reads as though the work didn't count - lead
  // with what the user actually did instead.
  const headline =
    p.done > 0
      ? `${p.done} card${p.done === 1 ? '' : 's'} learned`
      : `${p.answers} card${p.answers === 1 ? '' : 's'} reviewed`;
  const title = endedEarly ? 'Session ended' : 'Session complete';

  // No accuracy figure: grades are self-reported, nothing is marked right or
  // wrong, and the old percentage counted Hard as an error - so pressing Hard
  // honestly lowered your "score" despite being a successful recall.
  const timeStr = minutes > 0 ? `${minutes}m ${seconds}s` : `${seconds}s`;
  // when the soonest card comes round again - "back" alone did not say what
  const back = lastBuild?.nextDueAt ? ` · next review ${formatWhen(lastBuild.nextDueAt)}` : '';

  cardFront.innerHTML = `
    <span class="card-indicator">${title}</span>
    <div class="card-main-text" style="font-size: 1.6rem;">${headline}</div>
    <div class="card-sub-info">${timeStr}${back}</div>
    <div class="card-xp" id="session-xp"></div>
  `;
  cardBack.innerHTML = cardFront.innerHTML;

  // the sitting is now a record: xp, ranks and gallery unlocks are all derived
  // from this store, so this is the single point where progress is earned.
  void awardSession({
    startedAt: endedAt - elapsedMs,
    endedAt,
    deck: state.activeDeck,
    answers: p.answers,
    // what the sitting pays is now a property of the sitting, not of how many
    // times a button was pressed inside it
    length: loadSettings().sessionLength,
    completed: !endedEarly,
  });

  notifySessionEnd(true);
}

/** writes the sitting, then reports what it earned on the finished card. */
async function awardSession(record: SessionRecord): Promise<void> {
  try {
    const sagas = await loadGallery();
    const outcome = await recordSession(record, sagas);

    const slot = document.getElementById('session-xp');
    if (slot) {
      // itemised: one lump sum hid the fact that a deck's daily had landed,
      // which is the part worth coming back tomorrow for
      const rows = [`<span><i>Session</i><b>+${outcome.sessionPoints}<em>xp</em></b></span>`];
      if (outcome.missionPoints > 0) {
        rows.push(`<span><i>Daily workout</i><b>+${outcome.missionPoints}<em>xp</em></b></span>`);
      }
      if (outcome.promoted) {
        rows.push(`<span class="xp-rank"><i>${promotionLabel(outcome.rank)}</i><b></b></span>`);
      }
      slot.innerHTML = rows.join('');
      slot.classList.add('is-shown');
      cardBack.innerHTML = cardFront.innerHTML;
    }

    // the gallery gets told, not the session card - a picture is worth walking
    // over to look at, and a line of text here is easy to miss
    if (outcome.unlocked.pieces.length > 0) markGalleryUnread(outcome.unlocked.pieces.length);

    announceSessionReward(outcome);
    // the very first picture turns the padlock on the binder tab into
    // something worth tapping, without waiting for a reload
    void refreshBinderTab();
    void refreshMissionDot();
  } catch (e) {
    // never let a rewards failure eat the session summary the user is reading
    console.warn('could not record session', e);
  }
}

/** "in 2 days" / "in 3 hours" - for telling the user when work returns. */
function formatWhen(at: Date): string {
  const ms = at.getTime() - Date.now();
  if (ms <= 0) return 'now';
  const mins = Math.round(ms / 60000);
  if (mins < 60) return `in ${mins} min`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours} hour${hours === 1 ? '' : 's'}`;
  const days = Math.round(hours / 24);
  return `in ${days} day${days === 1 ? '' : 's'}`;
}

/** "End session" - always available while a session is active, ends it
 * early (remaining cards are simply not graded this sitting; nothing is
 * lost, they stay due/new for next time). */
export function endSessionEarly(): void {
  if (!activeSession) return;
  finishSession(true);
}

// ==================== SESSION BAR ====================

function computeIdleSessionBarState(build: QueueBuildResult): SessionBarState {
  if (build.items.length > 0) {
    return { kind: 'available', dueCount: build.dueCount, newCount: build.newCount };
  }
  if (build.nextDueAt) {
    return { kind: 'waiting', nextDueAt: build.nextDueAt };
  }
  return { kind: 'deck-empty' };
}

function syncSessionLengthPicker(settings: StudySettings): void {
  sessionLengthGroup?.querySelectorAll<HTMLElement>('.btn-toggle').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.length === settings.sessionLength);
  });
}

/** The single place that decides what the session bar shows. Called after
 * every session-lifecycle transition so no path can leave it in the D2 dead
 * end (every button hidden with no active session). */
function refreshSessionBar(): void {
  // Focus mode: one class drives every rule in styles/components/focus.css.
  // Stamped here because this is the single function that already knows
  // whether a session is running - adding per-element `hidden` toggles
  // elsewhere is exactly how the old session bar drifted into its
  // all-buttons-hidden dead end.
  const inSession = state.studyMode === 'session' && activeSession !== null && !activeSession.isComplete;
  document.body.classList.toggle('session-active', inSession);
  // Proposal Progress is a Browse-mode concept; this gates it in CSS.
  document.body.classList.toggle('mode-browse', state.studyMode === 'browse');

  if (state.studyMode !== 'session') {
    clearSessionBar();
    return;
  }

  if (activeSession && !activeSession.isComplete) {
    const p = activeSession.progress;
    renderSessionBar(
      { kind: 'active', remaining: p.remaining, total: p.total, answers: p.answers, learned: p.done },
      () => {}
    );
    return;
  }

  const settings = loadSettings();
  syncSessionLengthPicker(settings);
  const candidates = getFilteredCards(false);
  const build = buildTodayQueueResult(candidates, settings);
  lastBuild = build;

  if (sessionComplete && build.items.length > 0) {
    renderSessionBar(
      {
        kind: 'complete',
        answers: sessionComplete.answers,
        elapsedMs: sessionComplete.elapsedMs,
        endedEarly: sessionComplete.endedEarly,
        canStartAnother: true,
      },
      () => {}
    );
    return;
  }
  // Either no session just finished, or one did but nothing is left to start
  // another with - fall through to the ordinary idle state (countdown /
  // waiting / deck-empty) instead of a dead-end "complete" screen.
  sessionComplete = null;
  renderSessionBar(computeIdleSessionBarState(build), () => {
    refreshSessionBar();
    renderCard();
  });
}

sessionLengthGroup?.querySelectorAll<HTMLElement>('.btn-toggle').forEach((btn) => {
  btn.addEventListener('click', () => {
    const length = btn.dataset.length;
    if (length !== 'short' && length !== 'long') return;
    const settings = loadSettings();
    settings.sessionLength = length;
    saveSettings(settings);
    // Picking a length is a statement about the *next* sitting, so retire the
    // previous session's summary - otherwise the bar keeps reporting the old
    // result and the choice appears to do nothing.
    sessionComplete = null;
    refreshSessionBar();
    renderCard();
  });
});

export async function setStudyMode(mode: StudyMode): Promise<void> {
  state.studyMode = mode;
  modeSessionBtn.classList.toggle('active', mode === 'session');
  modeBrowseBtn.classList.toggle('active', mode === 'browse');

  if (mode === 'browse') {
    activeSession = null;
    sessionComplete = null;
    state.currentIndex = 0;
    applyFiltersAndShuffle();
    refreshSessionBar();
    renderCard();
  } else {
    sessionComplete = null;
    await ensureReviewsLoaded();
    if (!activeSession) tryResumeSession(state.activeDeck);
    // refreshSessionBar() computes lastBuild, which renderCard()'s empty
    // state depends on (D3) - it must run first or the card face falls back
    // to a stale/null build and can misreport "All caught up!".
    refreshSessionBar();
    renderCard();
  }
  updateStats();
}

// ==================== PROGRESS HEADER ====================

// Update Proposal Progress
export function updateStats(): void {
  updateDeckBar();

  // Proposal Progress is a Browse-mode journey counter driven by the words
  // you hand-mark as learned. It deliberately does NOT read FSRS state: the
  // old version showed "Learned 0/1294" for weeks, because FSRS only counts a
  // card learned at 21 days of stability, so the bar never moved. Marking a
  // word here has no effect on scheduling (see state/known.ts).
  const total = state.cards.length;
  const known = countKnownIn(state.cards.map((c) => c.id));
  const streak = computeStreak(Array.from(getReviewsSnapshot().values()));

  if (countTotalEl) countTotalEl.textContent = String(total);
  if (countLearnedEl) countLearnedEl.textContent = String(known);
  if (countStreakEl) countStreakEl.textContent = String(streak);

  if (proposalRemainingEl) {
    const left = total - known;
    proposalRemainingEl.innerHTML =
      left === 0
        ? `<strong>Every word learned! Ready to propose, Chris-kun? 💍❤️</strong>`
        : `<strong>${left}</strong> word${left === 1 ? '' : 's'} still to learn before proposing to Chiyo-chan!`;
  }

  if (proposalBarFillEl) {
    proposalBarFillEl.style.width = `${total > 0 ? Math.min(100, (known / total) * 100) : 0}%`;
  }

  // The deck bar's card count depends on mastery state, so it has to refresh
  // alongside the header rather than only when a filter changes.
  updateDeckBar();
}


// Compare user input to any of the card's accepted meanings

// Submit answer checked logic

// Toggle Romaji Visibility State
export function toggleRomajiVisibility(): void {
  state.showRomaji = !state.showRomaji;

  // Toggle class on cardViewport to trigger CSS display none rules
  cardViewport.classList.toggle('romaji-hidden', !state.showRomaji);

  // Update button SVG and tooltip directly on the DOM to maintain flipping state
  const btn = document.getElementById('btn-toggle-romaji');
  if (btn) {
    btn.innerHTML = state.showRomaji ? getEyeOpenSVG() : getEyeClosedSVG();
    btn.title = state.showRomaji ? 'Hide Romaji [R]' : 'Show Romaji [R]';
  }
}

// Load a specific Deck (Vocabulary, Hiragana, Katakana) into active study scope
export async function loadDeck(deckName: 'vocabulary' | 'hiragana' | 'katakana' | 'kanji'): Promise<void> {
  state.activeDeck = deckName;
  activeSession = null;
  sessionComplete = null;

  if (deckName === 'vocabulary') {
    state.cards = await loadVocab();
  } else if (deckName === 'kanji') {
    // The JLPT level is chosen by the section's own N5/N4 tabs, not the filter
    // sheet, so slice here rather than going through the level filter.
    const all = await loadKanji();
    state.cards = all.filter((c) => c.level === state.activeKanjiLevel);
    state.levelFilter = 'all';
  } else {
    const kana = await loadKana();
    if (deckName === 'hiragana') {
      if (state.activeHiraganaTab === 'basic') {
        state.cards = kana.hiraganaAlphabet;
      } else if (state.activeHiraganaTab === 'voiced') {
        state.cards = kana.hiraganaVoiced;
      } else {
        state.cards = kana.hiraganaCombos;
      }
    } else if (deckName === 'katakana') {
      if (state.activeKatakanaTab === 'basic') {
        state.cards = kana.katakanaAlphabet;
      } else if (state.activeKatakanaTab === 'voiced') {
        state.cards = kana.katakanaVoiced;
      } else {
        state.cards = kana.katakanaCombos;
      }
    }
    // Level/type/topic filters don't apply to kana decks - updateDeckBar()
    // hides those sheet sections; reset the level so a leftover N5/N4 choice
    // can't silently empty a kana deck.
    state.levelFilter = 'all';
  }

  await ensureReviewsLoaded();

  if (state.studyMode === 'browse') {
    state.currentIndex = 0;
    applyFiltersAndShuffle();
  } else {
    tryResumeSession(deckName);
  }

  updateStats();
  // refreshSessionBar() computes lastBuild, which renderCard()'s empty state
  // depends on (D3) - it must run first, see the same note in setStudyMode().
  refreshSessionBar();
  renderCard();
}
