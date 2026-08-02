import { loadVocab, loadKana } from '../data/loader';
import { isVocabCard } from '../data/types';
import type { Pos } from '../data/types';
import { FeedbackAudio } from '../audio/feedback';
import { speakJapanese } from '../audio/tts';
import { state } from '../state/store';
import type { Card, FilterMode, LevelFilter, StudyMode } from '../state/types';
import { saveFilters, saveStoryUnlockedChapter } from '../state/persistence';
import {
  ensureReviewsLoaded,
  getReviewsSnapshot,
  recordGrade,
  isCardMastered,
  getRemainingNewBudget,
} from '../state/reviews';
import { Rating, newFsrsCard, previewIntervals, formatInterval } from '../srs/scheduler';
import { buildQueue, StudySession, defaultSessionSettings, type QueueItem } from '../srs/queue';
import type { Grade } from '../srs/types';
import { computeStreak, countLearned, countDueToday, countNewAvailable } from '../srs/stats';
import { btnBackToStory } from './nav';
import { showStoryDialogue } from './story';

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
const sessionInfoEl = document.getElementById('session-info')!;
export const btnStartSession = document.getElementById('btn-start-session')!;
export const btnSessionEndAction = document.getElementById('btn-session-end-action')!;

// Grade Buttons
const gradeButtonsEl = document.getElementById('grade-buttons')!;
export const btnGradeAgain = document.getElementById('btn-grade-again')!;
export const btnGradeHard = document.getElementById('btn-grade-hard')!;
export const btnGradeGood = document.getElementById('btn-grade-good')!;
export const btnGradeEasy = document.getElementById('btn-grade-easy')!;
const intervalEls: Record<Grade, HTMLElement> = {
  [Rating.Again]: document.getElementById('interval-again')!,
  [Rating.Hard]: document.getElementById('interval-hard')!,
  [Rating.Good]: document.getElementById('interval-good')!,
  [Rating.Easy]: document.getElementById('interval-easy')!,
};

// Proposal Progress Counters
const proposalRemainingEl = document.getElementById('proposal-remaining');
const proposalBarFillEl = document.getElementById('proposal-bar-fill') as HTMLElement | null;
const countDueEl = document.getElementById('count-due');
const countNewEl = document.getElementById('count-new');
const countLearnedEl = document.getElementById('count-learned');
const countTotalEl = document.getElementById('count-total');
const countStreakEl = document.getElementById('count-streak');

// Filter toggles
export const filterAllBtn = document.getElementById('filter-all')!;
export const filterLearningBtn = document.getElementById('filter-learning')!;
export const filterMasteredBtn = document.getElementById('filter-mastered')!;

// JLPT Level filter toggles
export const levelFilterGroup = document.getElementById('level-filter-group');
export const vocabDropdownFilters = document.getElementById('vocab-dropdown-filters');
export const filterLevelAllBtn = document.getElementById('filter-level-all');
export const filterLevelN5Btn = document.getElementById('filter-level-n5');
export const filterLevelN4Btn = document.getElementById('filter-level-n4');

// Typing Mode elements
const typingContainer = document.getElementById('typing-container')!;
export const typingInput = document.getElementById('typing-input') as HTMLInputElement;
export const submitBtn = document.getElementById('btn-submit-answer') as HTMLButtonElement;
const feedbackText = document.getElementById('feedback-text')!;
export const modeFlashcardBtn = document.getElementById('toggle-mode-flashcard')!;
export const modeTypingBtn = document.getElementById('toggle-mode-typing')!;

// Active study session (Study Session mode only) - null when not running one.
let activeSession: StudySession | null = null;
let cardShownAt = Date.now();

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
  return state.cards.filter((card) => {
    if (applyProgressFilter) {
      const mastered = isCardMastered(card.id);
      const matchesProgress =
        state.filterMode === 'all' ||
        (state.filterMode === 'learning' && !mastered) ||
        (state.filterMode === 'mastered' && mastered);
      if (!matchesProgress) return false;
    }

    const cardLevel = isVocabCard(card) ? card.level : '';
    if (state.levelFilter !== 'all' && cardLevel !== state.levelFilter) return false;

    if (state.activeDeck === 'vocabulary' && !state.isStoryModeActive && isVocabCard(card)) {
      if (!state.selectedVocabTypes.includes(posToTypeBucket(card.pos))) return false;
      if (!card.topics.some((t) => state.selectedVocabTopics.includes(t))) return false;
    }

    return true;
  });
}

// Today's effective session settings: newPerDay is reduced by however many
// new cards have already been introduced today, across any earlier session
// (not just capped within a single queue build).
function getTodaySessionSettings(): typeof defaultSessionSettings {
  return {
    ...defaultSessionSettings,
    newPerDay: getRemainingNewBudget(defaultSessionSettings.newPerDay),
  };
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
// Kana/story cards carry no such metadata, so they render nothing here.
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

  // Reset Flipped Class and answer glow classes
  cardViewport.classList.remove('flipped', 'correct-answer', 'incorrect-answer');
  state.isFlipped = false;
  state.hasSubmittedAnswer = false;
  hideGradeButtons();

  if (state.practiceMode === 'typing') {
    typingInput.value = '';
    typingInput.className = '';
    submitBtn.textContent = 'Check';
    submitBtn.disabled = false;
    feedbackText.className = 'feedback-text';
    feedbackText.textContent = '';
    setTimeout(() => {
      typingInput.focus();
    }, 50);
  }

  // Handle empty state (e.g. no cards in filter, or an active session with
  // nothing left to show - see endSession()).
  if (!currentCard) {
    renderEmptyState();
    return;
  }

  // Extract JLPT level or Story Chapter label
  let level = '';
  if (state.isStoryModeActive && state.activeStoryChapterId !== null) {
    level = `Ch. ${state.activeStoryChapterId}`;
  } else if (isVocabCard(currentCard)) {
    level = currentCard.level;
  }

  // Homophone disambiguation hint, e.g. "あつい (hot weather)"
  const hint =
    isVocabCard(currentCard) && currentCard.homophoneGroup && currentCard.hint
      ? currentCard.hint
      : '';

  // FRONT: Japanese
  cardFront.innerHTML = `
    <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-start;">
      <span class="card-indicator">Japanese ${level ? `<span class="level-badge">${level}</span>` : ''}</span>
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
      <div class="hiragana-text" lang="ja">${currentCard.kana}</div>
      ${state.activeDeck === 'vocabulary' ? `<div class="romaji-text">${currentCard.romaji}</div>` : ''}
      ${hint ? `<div class="romaji-text" style="opacity: 0.7;">(${hint})</div>` : ''}
    </div>
    <span style="font-size: 0.85rem; color: var(--text-muted); opacity: 0.6;">Click or Press [Space] to flip</span>
  `;

  // BACK: English
  cardBack.innerHTML = `
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

  updateNavAndModeVisibility();
}

// Render empty state (no cards in filter, or a Study Session with nothing due)
function renderEmptyState(): void {
  const message =
    state.studyMode === 'session' && !activeSession
      ? { title: 'All caught up!', body: 'No cards are due right now. Come back later, or Browse to review anyway.' }
      : { title: 'Empty', body: 'No cards found in this category. Try changing your filter settings below.' };

  cardFront.innerHTML = `
    <span class="card-indicator">${message.title}</span>
    <div class="card-main-text" style="font-size: 1.5rem; color: var(--text-muted);">${message.title === 'Empty' ? 'No cards found in this category' : message.title}</div>
    <span style="font-size: 0.85rem; color: var(--text-muted); opacity: 0.5;">${message.body}</span>
  `;
  cardBack.innerHTML = cardFront.innerHTML;

  hideGradeButtons();
  prevBtn.disabled = true;
  nextBtn.disabled = true;
}

function updateNavAndModeVisibility(): void {
  const inSession = state.studyMode === 'session' && !!activeSession && !activeSession.isComplete;
  navButtons.classList.toggle('hidden', state.studyMode === 'session');
  if (state.studyMode === 'browse') {
    const total = state.displayOrder.length;
    prevBtn.disabled = total === 0;
    nextBtn.disabled = total === 0;
  }
  void inSession;
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
  // A brand-new card (no review record yet) previews against a fresh FSRS card.
  const baseFsrsCard = item.review?.card ?? newFsrsCard(now);
  const preview = previewIntervals(baseFsrsCard, now);

  for (const [gradeStr, recordItem] of Object.entries(preview)) {
    const grade = Number(gradeStr) as Grade;
    const el = intervalEls[grade];
    if (el) el.textContent = formatInterval(recordItem.card.due, now);
  }

  gradeButtonsEl.classList.remove('hidden');
}

function hideGradeButtons(): void {
  gradeButtonsEl.classList.add('hidden');
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
export function changeFilter(filter: FilterMode): void {
  state.filterMode = filter;
  filterAllBtn.classList.toggle('active', filter === 'all');
  filterLearningBtn.classList.toggle('active', filter === 'learning');
  filterMasteredBtn.classList.toggle('active', filter === 'mastered');

  state.currentIndex = 0;
  applyFiltersAndShuffle();
  renderCard();
  persistFilters();
}

// Change JLPT level filter (All, N5, N4)
export function changeLevelFilter(level: LevelFilter): void {
  state.levelFilter = level;
  filterLevelAllBtn?.classList.toggle('active', level === 'all');
  filterLevelN5Btn?.classList.toggle('active', level === 'N5');
  filterLevelN4Btn?.classList.toggle('active', level === 'N4');

  state.currentIndex = 0;
  applyFiltersAndShuffle();
  renderCard();
  persistFilters();
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

export async function startSession(): Promise<void> {
  await ensureReviewsLoaded();
  const candidates = getFilteredCards(false);
  const queue = buildQueue(candidates, getReviewsSnapshot(), getTodaySessionSettings(), new Date());

  if (queue.length === 0) {
    activeSession = null;
    btnStartSession.classList.add('hidden');
    updateSessionInfo();
    renderCard();
    return;
  }

  activeSession = new StudySession(queue);
  btnStartSession.classList.add('hidden');
  btnSessionEndAction.classList.add('hidden');
  updateSessionInfo();
  renderCard();
}

function updateSessionInfo(): void {
  if (state.studyMode !== 'session') {
    sessionInfoEl.textContent = '';
    return;
  }
  if (activeSession && !activeSession.isComplete) {
    const { reviewed, total } = activeSession.progress;
    sessionInfoEl.textContent = `Card ${reviewed + 1} / ${total}`;
  } else {
    sessionInfoEl.textContent = '';
  }
}

export async function gradeCurrentCard(grade: Grade): Promise<void> {
  // Defense in depth: the grade buttons are CSS-hidden until the card is
  // flipped, but that alone doesn't stop a click handler from firing on a
  // hidden element, so guard the actual grading path too - grading must
  // never be reachable while the answer is still hidden.
  if (state.studyMode !== 'session' || !state.isFlipped || !activeSession || !activeSession.current) {
    return;
  }

  const item = activeSession.current;
  const elapsedMs = Date.now() - cardShownAt;
  await recordGrade(item.card, grade, new Date(), elapsedMs);

  if (grade === Rating.Good || grade === Rating.Easy) {
    FeedbackAudio.playCorrect();
  }

  activeSession.advance(grade);
  updateStats();

  if (activeSession.isComplete) {
    endSession();
  } else {
    updateSessionInfo();
    renderCard();
  }
}

function endSession(): void {
  if (!activeSession) return;
  const { reviewed, correct } = activeSession.progress;
  const accuracy = reviewed > 0 ? Math.round((correct / reviewed) * 100) : 0;
  const elapsedSec = Math.round(activeSession.elapsedMs / 1000);
  const minutes = Math.floor(elapsedSec / 60);
  const seconds = elapsedSec % 60;

  cardFront.innerHTML = `
    <span class="card-indicator">Session Complete! 🎉</span>
    <div class="card-main-text" style="font-size: 1.6rem;">${reviewed} card${reviewed === 1 ? '' : 's'} reviewed</div>
    <div class="card-sub-info">${accuracy}% accuracy · ${minutes}m ${seconds}s</div>
  `;
  cardBack.innerHTML = cardFront.innerHTML;

  hideGradeButtons();
  prevBtn.disabled = true;
  nextBtn.disabled = true;
  sessionInfoEl.textContent = '';
  btnSessionEndAction.classList.remove('hidden');
  btnStartSession.classList.add('hidden');

  activeSession = null;
  updateStats();
}

// Called by the "Back to Deck" button after a session ends, or to bail out
// of an empty-queue state back to a neutral view.
export function acknowledgeSessionEnd(): void {
  btnSessionEndAction.classList.add('hidden');
  updateStats();
  renderCard();
}

export async function setStudyMode(mode: StudyMode): Promise<void> {
  state.studyMode = mode;
  modeSessionBtn.classList.toggle('active', mode === 'session');
  modeBrowseBtn.classList.toggle('active', mode === 'browse');
  activeSession = null;
  btnSessionEndAction.classList.add('hidden');

  if (mode === 'browse') {
    btnStartSession.classList.add('hidden');
    state.currentIndex = 0;
    applyFiltersAndShuffle();
    renderCard();
  } else {
    await ensureReviewsLoaded();
    const candidates = getFilteredCards(false);
    const queue = buildQueue(candidates, getReviewsSnapshot(), getTodaySessionSettings(), new Date());
    btnStartSession.classList.toggle('hidden', queue.length === 0);
    renderCard();
  }
  updateSessionInfo();
  updateStats();
}

// ==================== PROGRESS HEADER ====================

// Update Proposal Progress
export function updateStats(): void {
  if (state.isStoryModeActive && state.activeStoryChapterId !== null) {
    // Story Mode: per-chapter completion (unaffected by the global SRS header)
    const total = state.cards.length;
    const mastered = state.cards.filter((card) => isCardMastered(card.id)).length;
    const remaining = total - mastered;
    const percent = total > 0 ? (mastered / total) * 100 : 0;

    if (countTotalEl) countTotalEl.textContent = String(total);
    if (countLearnedEl) countLearnedEl.textContent = String(mastered);
    if (countDueEl) countDueEl.textContent = '-';
    if (countNewEl) countNewEl.textContent = '-';

    if (proposalRemainingEl) {
      if (remaining === 0) {
        proposalRemainingEl.innerHTML = `<strong>Chapter Cleared! Ready to read the Dialogue with Chiyo-chan! 💍❤️</strong>`;

        if (state.activeStoryChapterId === state.storyUnlockedChapter) {
          state.storyUnlockedChapter = state.activeStoryChapterId + 1;
          saveStoryUnlockedChapter(state.storyUnlockedChapter);
          void showStoryDialogue(state.activeStoryChapterId);
        }
      } else {
        proposalRemainingEl.innerHTML = `<strong>${remaining}</strong> card${remaining > 1 ? 's' : ''} remaining in Chapter ${state.activeStoryChapterId} before unlocking the story dialogue!`;
      }
    }

    if (proposalBarFillEl) {
      proposalBarFillEl.style.width = `${percent}%`;
    }
    return;
  }

  // Normal deck stats: real SRS numbers instead of a boolean "mastered" set.
  const reviews = getReviewsSnapshot();
  const total = state.cards.length;
  const due = countDueToday(Array.from(reviews.values()));
  const fresh = countNewAvailable(state.cards, Array.from(reviews.values()));
  const learned = countLearned(Array.from(reviews.values()).filter((r) => state.cards.some((c) => c.id === r.cardId)));
  const streak = computeStreak(Array.from(reviews.values()));

  if (countTotalEl) countTotalEl.textContent = String(total);
  if (countDueEl) countDueEl.textContent = String(due);
  if (countNewEl) countNewEl.textContent = String(fresh);
  if (countLearnedEl) countLearnedEl.textContent = String(learned);
  if (countStreakEl) countStreakEl.textContent = String(streak);

  if (proposalRemainingEl) {
    if (due === 0 && fresh === 0) {
      proposalRemainingEl.innerHTML = `<strong>All caught up! Ready to propose, Chris-kun? 💍❤️</strong>`;
    } else {
      proposalRemainingEl.innerHTML = `<strong>${due}</strong> due, <strong>${fresh}</strong> new — study today before proposing to Chiyo-chan!`;
    }
  }

  if (proposalBarFillEl) {
    const percent = total > 0 ? Math.min(100, (learned / total) * 100) : 0;
    proposalBarFillEl.style.width = `${percent}%`;
  }
}

// Change practice mode (Flashcard vs Typing)
export function setPracticeMode(mode: 'flashcard' | 'typing'): void {
  state.practiceMode = mode;
  modeFlashcardBtn.classList.toggle('active', mode === 'flashcard');
  modeTypingBtn.classList.toggle('active', mode === 'typing');

  if (mode === 'typing') {
    typingContainer.classList.remove('hidden');
  } else {
    typingContainer.classList.add('hidden');
  }

  // Refresh card to apply mode states
  renderCard();
}

// Compare user input to any of the card's accepted meanings
function isAnswerCorrect(userAnswer: string, meanings: string[]): boolean {
  // Normalize strings by converting to lowercase and stripping punctuation/extra whitespace
  const clean = (str: string) =>
    str
      .toLowerCase()
      .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, '')
      .trim()
      .replace(/\s+/g, ' ');
  const cleanUser = clean(userAnswer);

  return meanings.map(clean).includes(cleanUser);
}

// Submit answer checked logic
export function submitAnswer(): void {
  const currentCard = getActiveCard();
  if (!currentCard) return;

  if (!state.hasSubmittedAnswer) {
    const userAns = typingInput.value;
    const correct = isAnswerCorrect(userAns, currentCard.meanings);
    state.hasSubmittedAnswer = true;

    if (correct) {
      typingInput.classList.add('correct');
      feedbackText.className = 'feedback-text feedback-correct';
      feedbackText.innerHTML = `Correct! 🎉`;
      cardViewport.classList.add('correct-answer');
      FeedbackAudio.playCorrect();
    } else {
      typingInput.classList.add('incorrect');
      feedbackText.className = 'feedback-text feedback-incorrect';
      feedbackText.innerHTML = `Incorrect. Correct answer: <strong>${currentCard.meanings.join(' / ')}</strong>`;
      cardViewport.classList.add('incorrect-answer');
    }

    // Automatically flip card to reveal English back face
    if (!state.isFlipped) {
      flipCard(true); // silent flip to prevent sound overlap
    }

    if (state.studyMode === 'session') {
      submitBtn.textContent = 'Grade below ↓';
      submitBtn.disabled = true;
    } else {
      submitBtn.textContent = 'Next Card';
    }
  } else if (state.studyMode === 'browse') {
    // If already checked, click on submit acts as "Next Card" navigation
    nextCard();
  }
}

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
export async function loadDeck(deckName: 'vocabulary' | 'hiragana' | 'katakana'): Promise<void> {
  state.activeDeck = deckName;
  activeSession = null;
  btnSessionEndAction.classList.add('hidden');

  if (deckName === 'vocabulary') {
    state.cards = await loadVocab();
    if (levelFilterGroup) levelFilterGroup.classList.remove('hidden');
    if (vocabDropdownFilters) vocabDropdownFilters.classList.remove('hidden');
    if (btnBackToStory) btnBackToStory.classList.add('hidden');
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
    // Hide level and category filters for non-vocabulary decks and reset filters
    if (levelFilterGroup) levelFilterGroup.classList.add('hidden');
    if (vocabDropdownFilters) vocabDropdownFilters.classList.add('hidden');
    state.levelFilter = 'all';
    filterLevelAllBtn?.classList.add('active');
    filterLevelN5Btn?.classList.remove('active');
    filterLevelN4Btn?.classList.remove('active');
    if (btnBackToStory) btnBackToStory.classList.add('hidden');
  }

  await ensureReviewsLoaded();

  if (state.studyMode === 'browse') {
    state.currentIndex = 0;
    applyFiltersAndShuffle();
  } else {
    const candidates = getFilteredCards(false);
    const queue = buildQueue(candidates, getReviewsSnapshot(), getTodaySessionSettings(), new Date());
    btnStartSession.classList.toggle('hidden', queue.length === 0);
  }

  updateStats();
  renderCard();
}
