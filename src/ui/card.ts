import { loadVocab, loadKana } from '../data/loader';
import { isVocabCard } from '../data/types';
import type { Pos } from '../data/types';
import { FeedbackAudio } from '../audio/feedback';
import { speakJapanese } from '../audio/tts';
import { state } from '../state/store';
import type { Card, CardId, FilterMode, LevelFilter } from '../state/types';
import {
  saveMasteredIds,
  saveStoryMasteredIds,
  saveStoryUnlockedChapter,
  saveFilters,
} from '../state/persistence';
import { btnBackToStory } from './nav';
import { showStoryDialogue } from './story';

// DOM Elements - Card Workspace
export const cardViewport = document.getElementById('card-viewport')!;
const cardFront = document.getElementById('card-front')!;
const cardBack = document.getElementById('card-back')!;

export const prevBtn = document.getElementById('btn-prev') as HTMLButtonElement;
export const nextBtn = document.getElementById('btn-next') as HTMLButtonElement;
export const masteredToggleBtn = document.getElementById('btn-mastered')!;

// Proposal Progress Counters
const proposalRemainingEl = document.getElementById('proposal-remaining');
const proposalBarFillEl = document.getElementById('proposal-bar-fill') as HTMLElement | null;
const countTotalEl = document.getElementById('count-total');
const countLearningEl = document.getElementById('count-learning');

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
export const submitBtn = document.getElementById('btn-submit-answer')!;
const feedbackText = document.getElementById('feedback-text')!;
export const modeFlashcardBtn = document.getElementById('toggle-mode-flashcard')!;
export const modeTypingBtn = document.getElementById('toggle-mode-typing')!;

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

// Get the Active Card Object based on current display index
export function getActiveCard(): Card | null {
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

  // Reset Flipped Class and answer glow classes
  cardViewport.classList.remove('flipped', 'correct-answer', 'incorrect-answer');
  state.isFlipped = false;
  state.hasSubmittedAnswer = false;

  if (state.practiceMode === 'typing') {
    typingInput.value = '';
    typingInput.className = '';
    submitBtn.textContent = 'Check';
    feedbackText.className = 'feedback-text';
    feedbackText.textContent = '';
    setTimeout(() => {
      typingInput.focus();
    }, 50);
  }

  // Handle empty state (e.g. no cards in filter)
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
      <span class="card-indicator">Japanese ${level ? `<span class="level-badge" style="margin-left: 0.65rem; padding: 0.15rem 0.45rem; font-size: 0.75rem; background: rgba(255,255,255,0.12); border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); color: var(--accent-pink); font-weight: 600;">${level}</span>` : ''}</span>
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
      <div class="hiragana-text" style="font-size: 3rem; margin-top: -10px;">${currentCard.kana}</div>
      ${state.activeDeck === 'vocabulary' ? `<div class="romaji-text">${currentCard.romaji}</div>` : ''}
      ${hint ? `<div class="romaji-text" style="opacity: 0.7;">(${hint})</div>` : ''}
    </div>
    <span style="font-size: 0.85rem; color: var(--text-secondary); opacity: 0.6;">Click or Press [Space] to flip</span>
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

  // Update mastered button state on card
  updateMasteredButtonState(currentCard.id);

  // Always enable navigation buttons if there are cards in active deck
  const total = state.displayOrder.length;
  prevBtn.disabled = total === 0;
  nextBtn.disabled = total === 0;
}

// Render empty state if filter contains 0 cards
function renderEmptyState(): void {
  cardFront.innerHTML = `
    <span class="card-indicator">Empty</span>
    <div class="card-main-text" style="font-size: 1.5rem; color: var(--text-secondary);">No cards found in this category</div>
    <span style="font-size: 0.85rem; color: var(--text-secondary); opacity: 0.5;">Try changing your filter settings below</span>
  `;
  cardBack.innerHTML = cardFront.innerHTML;

  prevBtn.disabled = true;
  nextBtn.disabled = true;
}

// Flip Card 3D Toggle
export function flipCard(silent = false): void {
  if (state.displayOrder.length === 0) return;
  state.isFlipped = !state.isFlipped;
  cardViewport.classList.toggle('flipped', state.isFlipped);
  if (silent !== true) {
    FeedbackAudio.playFlip();
  }
}

// Next Card (loops endlessly and reshuffles on wrap-around if shuffle is enabled)
export function nextCard(): void {
  const total = state.displayOrder.length;
  if (total === 0) return;

  if (state.currentIndex < total - 1) {
    state.currentIndex++;
  } else {
    // Wrap around to start
    state.currentIndex = 0;

    // If in shuffle mode, reshuffle the remaining deck on completion so sequence varies
    if (state.isShuffled) {
      applyFiltersAndShuffle();
    }
  }
  renderCard();
}

// Previous Card (loops endlessly)
export function prevCard(): void {
  const total = state.displayOrder.length;
  if (total === 0) return;

  if (state.currentIndex > 0) {
    state.currentIndex--;
  } else {
    // Wrap around to end
    state.currentIndex = total - 1;
  }
  renderCard();
}

// Change study filter (All, Learning, Mastered)
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

// Update the list layout order according to filter and shuffle state
export function applyFiltersAndShuffle(): void {
  // Filter index list
  const activeIndices: number[] = [];
  state.cards.forEach((card, index) => {
    const isMastered = state.isStoryModeActive
      ? state.storyMasteredIds.has(card.id)
      : state.masteredCardIds.has(card.id);

    const matchesProgress =
      state.filterMode === 'all' ||
      (state.filterMode === 'learning' && !isMastered) ||
      (state.filterMode === 'mastered' && isMastered);

    const cardLevel = isVocabCard(card) ? card.level : '';
    const matchesLevel = state.levelFilter === 'all' || cardLevel === state.levelFilter;

    // Check type and topic filters for Vocabulary deck (using multi-select arrays)
    let matchesType = true;
    let matchesTopic = true;
    if (state.activeDeck === 'vocabulary' && !state.isStoryModeActive && isVocabCard(card)) {
      matchesType = state.selectedVocabTypes.includes(posToTypeBucket(card.pos));
      matchesTopic = card.topics.some((t) => state.selectedVocabTopics.includes(t));
    }

    if (matchesProgress && matchesLevel && matchesType && matchesTopic) {
      activeIndices.push(index);
    }
  });

  // Shuffle if needed
  if (state.isShuffled) {
    // Fisher-Yates Shuffle
    for (let i = activeIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [activeIndices[i], activeIndices[j]] = [activeIndices[j]!, activeIndices[i]!];
    }
  }

  state.displayOrder = activeIndices;
}

// Toggle Mastered Card Status
export function toggleMastered(): void {
  const currentCard = getActiveCard();
  if (!currentCard) return;

  const cardId = currentCard.id;
  let newlyMastered = false;

  if (state.isStoryModeActive) {
    if (state.storyMasteredIds.has(cardId)) {
      state.storyMasteredIds.delete(cardId);
    } else {
      state.storyMasteredIds.add(cardId);
      newlyMastered = true;
    }
    saveStoryMasteredIds(state.storyMasteredIds);
  } else {
    if (state.masteredCardIds.has(cardId)) {
      state.masteredCardIds.delete(cardId);
    } else {
      state.masteredCardIds.add(cardId);
      newlyMastered = true;
    }
    saveMasteredIds(state.masteredCardIds);
  }

  if (newlyMastered) {
    FeedbackAudio.playCorrect();
  }

  updateStats();
  updateMasteredButtonState(cardId);

  // If we are filtering, the list of cards has changed, so we need to refresh active list
  if (state.filterMode !== 'all') {
    applyFiltersAndShuffle();

    // Ensure index remains in bounds
    if (state.currentIndex >= state.displayOrder.length) {
      state.currentIndex = Math.max(0, state.displayOrder.length - 1);
    }
    renderCard();
  }
}

// Update Mastered Button style active state
function updateMasteredButtonState(cardId: CardId): void {
  const isMastered = state.isStoryModeActive
    ? state.storyMasteredIds.has(cardId)
    : state.masteredCardIds.has(cardId);
  if (isMastered) {
    masteredToggleBtn.classList.add('active');
    masteredToggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24" style="fill: #10b981;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
      Mastered [M]
    `;
  } else {
    masteredToggleBtn.classList.remove('active');
    masteredToggleBtn.innerHTML = `
      <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15.5h-2v-2h2v2zm0-4h-2v-5h2v5z"/></svg>
      Mark Mastered [M]
    `;
  }
}

// Update Proposal Progress
export function updateStats(): void {
  if (state.isStoryModeActive && state.activeStoryChapterId !== null) {
    // Story Mode Stats
    const total = state.cards.length;
    const mastered = state.cards.filter((card) => state.storyMasteredIds.has(card.id)).length;
    const remaining = total - mastered;
    const percent = total > 0 ? (mastered / total) * 100 : 0;

    if (countTotalEl) countTotalEl.textContent = String(total);
    if (countLearningEl) countLearningEl.textContent = String(remaining);

    if (proposalRemainingEl) {
      if (remaining === 0) {
        proposalRemainingEl.innerHTML = `<strong>Chapter Cleared! Ready to read the Dialogue with Chiyo-chan! 💍❤️</strong>`;

        // Auto-unlock next chapter if this is the active progress chapter
        if (state.activeStoryChapterId === state.storyUnlockedChapter) {
          state.storyUnlockedChapter = state.activeStoryChapterId + 1;
          saveStoryUnlockedChapter(state.storyUnlockedChapter);

          // Trigger dialogue modal automatically
          void showStoryDialogue(state.activeStoryChapterId);
        }
      } else {
        proposalRemainingEl.innerHTML = `<strong>${remaining}</strong> card${remaining > 1 ? 's' : ''} remaining in Chapter ${state.activeStoryChapterId} before unlocking the story dialogue!`;
      }
    }

    if (proposalBarFillEl) {
      proposalBarFillEl.style.width = `${percent}%`;
    }
  } else {
    // Normal Vocabulary Mode Stats
    const total = state.cards.length;
    const mastered = state.cards.filter((card) => state.masteredCardIds.has(card.id)).length;
    const remaining = Math.max(0, total - mastered);
    const percent = total > 0 ? Math.min(100, (mastered / total) * 100) : 0;

    if (countTotalEl) countTotalEl.textContent = String(total);
    if (countLearningEl) countLearningEl.textContent = String(remaining);

    if (proposalRemainingEl) {
      if (remaining === 0) {
        proposalRemainingEl.innerHTML = `<strong>Ready to propose! Go get her, Chris-kun! 💍❤️</strong>`;
      } else {
        proposalRemainingEl.innerHTML = `<strong>${remaining}</strong> vocabulary word${remaining > 1 ? 's' : ''} left to master before proposing to Chiyo-chan`;
      }
    }

    if (proposalBarFillEl) {
      proposalBarFillEl.style.width = `${percent}%`;
    }
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

    submitBtn.textContent = 'Next Card';
  } else {
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

  applyFiltersAndShuffle();
  state.currentIndex = 0;

  updateStats();
  renderCard();
}
