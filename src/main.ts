import './styles/main.css';

import { FeedbackAudio } from './audio/feedback';
import { state } from './state/store';
import {
  cardViewport,
  prevBtn,
  nextBtn,
  modeSessionBtn,
  modeBrowseBtn,
  btnStartSession,
  btnSessionEndAction,
  btnGradeAgain,
  btnGradeHard,
  btnGradeGood,
  btnGradeEasy,
  filterAllBtn,
  filterLearningBtn,
  filterMasteredBtn,
  filterLevelAllBtn,
  filterLevelN5Btn,
  filterLevelN4Btn,
  modeFlashcardBtn,
  modeTypingBtn,
  submitBtn,
  typingInput,
  flipCard,
  prevCard,
  nextCard,
  changeFilter,
  changeLevelFilter,
  setPracticeMode,
  submitAnswer,
  toggleRomajiVisibility,
  loadDeck,
  startSession,
  gradeCurrentCard,
  setStudyMode,
  acknowledgeSessionEnd,
  updateStats,
  getActiveCard,
} from './ui/card';
import { Rating } from './srs/scheduler';
import type { Grade } from './srs/types';
import { renderKanaGrid } from './ui/kana';
import { setupFilterDrawer } from './ui/filters';
import {
  menuVocabulary,
  menuHiragana,
  menuKatakana,
  menuStory,
  menuStats,
  btnBackToStory,
  switchSection,
} from './ui/nav';
import { renderStoryRoadmap } from './ui/story';
import { renderStatsView } from './ui/statsView';
import { initTheme } from './ui/theme';
import { speakJapanese } from './audio/tts';
import { runMigrationIfNeeded } from './srs/migration';

const btnPracticeHiragana = document.getElementById('btn-practice-hiragana')!;
const btnPracticeKatakana = document.getElementById('btn-practice-katakana')!;

// Initialize Application
async function init(): Promise<void> {
  setupEventListeners();
  // One-time migration from the old boolean "mastered" localStorage sets to
  // real FSRS review records - must finish before the deck loads so the
  // progress header and session queue reflect migrated state immediately.
  await runMigrationIfNeeded();
  // Boots straight into the vocabulary deck; kana grids and story chapters
  // load lazily on first navigation to their sections (see below).
  await loadDeck('vocabulary');
}

// Setup Event Listeners
function setupEventListeners(): void {
  // Card Flip Click
  cardViewport.addEventListener('click', () => flipCard());

  // Nav buttons
  prevBtn.addEventListener('click', (e) => {
    e.preventDefault();
    prevCard();
  });
  nextBtn.addEventListener('click', (e) => {
    e.preventDefault();
    nextCard();
  });

  // Study Mode toggle (Study Session vs Browse)
  modeSessionBtn.addEventListener('click', () => void setStudyMode('session'));
  modeBrowseBtn.addEventListener('click', () => void setStudyMode('browse'));

  // Session lifecycle
  btnStartSession.addEventListener('click', () => void startSession());
  btnSessionEndAction.addEventListener('click', () => acknowledgeSessionEnd());

  // SRS Grade buttons
  const bindGrade = (btn: HTMLElement, grade: Grade) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation(); // Avoid flipping the card when clicking a button on the back face
      void gradeCurrentCard(grade);
    });
  };
  bindGrade(btnGradeAgain, Rating.Again);
  bindGrade(btnGradeHard, Rating.Hard);
  bindGrade(btnGradeGood, Rating.Good);
  bindGrade(btnGradeEasy, Rating.Easy);

  // Filter Buttons
  filterAllBtn.addEventListener('click', () => changeFilter('all'));
  filterLearningBtn.addEventListener('click', () => changeFilter('learning'));
  filterMasteredBtn.addEventListener('click', () => changeFilter('mastered'));

  // Level Filter Buttons
  filterLevelAllBtn?.addEventListener('click', () => changeLevelFilter('all'));
  filterLevelN5Btn?.addEventListener('click', () => changeLevelFilter('N5'));
  filterLevelN4Btn?.addEventListener('click', () => changeLevelFilter('N4'));

  // Vocabulary Filter Drawer (Concept B Refined)
  setupFilterDrawer();

  // Practice Mode toggles
  modeFlashcardBtn.addEventListener('click', () => setPracticeMode('flashcard'));
  modeTypingBtn.addEventListener('click', () => setPracticeMode('typing'));

  // Typing submit button
  submitBtn.addEventListener('click', submitAnswer);

  // Typing Input key listener (Enter to check/next)
  typingInput.addEventListener('keydown', (e) => {
    if (e.code === 'Enter') {
      e.preventDefault();
      submitAnswer();
    }
  });

  // Sidebar Menu triggers
  menuVocabulary.addEventListener('click', () => {
    state.isStoryModeActive = false;
    btnBackToStory?.classList.add('hidden');
    switchSection('vocabulary');
    void loadDeck('vocabulary');
  });

  menuHiragana.addEventListener('click', () => {
    state.isStoryModeActive = false;
    btnBackToStory?.classList.add('hidden');
    switchSection('hiragana');
    void renderKanaGrid('hiragana');
  });

  menuKatakana.addEventListener('click', () => {
    state.isStoryModeActive = false;
    btnBackToStory?.classList.add('hidden');
    switchSection('katakana');
    void renderKanaGrid('katakana');
  });

  menuStory.addEventListener('click', () => {
    state.isStoryModeActive = false;
    btnBackToStory?.classList.add('hidden');
    switchSection('story');
    void renderStoryRoadmap();
    updateStats();
  });

  menuStats.addEventListener('click', () => {
    state.isStoryModeActive = false;
    btnBackToStory?.classList.add('hidden');
    switchSection('stats');
    void renderStatsView();
  });

  // Return to Roadmap button inside Card view
  btnBackToStory.addEventListener('click', () => {
    state.isStoryModeActive = false;
    btnBackToStory?.classList.add('hidden');
    switchSection('story');
    void renderStoryRoadmap();
    updateStats();
  });

  // Dynamic Learning workspace hooks to Study deck mode
  btnPracticeHiragana.addEventListener('click', () => {
    state.isStoryModeActive = false;
    btnBackToStory?.classList.add('hidden');
    void loadDeck('hiragana');
    switchSection('vocabulary', 'hiragana');
  });

  btnPracticeKatakana.addEventListener('click', () => {
    state.isStoryModeActive = false;
    btnBackToStory?.classList.add('hidden');
    void loadDeck('katakana');
    switchSection('vocabulary', 'katakana');
  });

  // Hiragana Tab Event Listeners
  const hiraganaTabBtns = document.querySelectorAll<HTMLElement>('#hiragana-tabs .btn-chart-tab');
  hiraganaTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      hiraganaTabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeHiraganaTab = (btn.dataset.tab as 'basic' | 'voiced' | 'combos') ?? 'basic';

      // Update Practice Button Text dynamically
      if (state.activeHiraganaTab === 'basic') {
        btnPracticeHiragana.textContent = '🌸 Study Hiragana Flashcards';
      } else if (state.activeHiraganaTab === 'voiced') {
        btnPracticeHiragana.textContent = '🌸 Study Voiced Hiragana';
      } else {
        btnPracticeHiragana.textContent = '🌸 Study Combo Hiragana';
      }

      void renderKanaGrid('hiragana');
    });
  });

  // Katakana Tab Event Listeners
  const katakanaTabBtns = document.querySelectorAll<HTMLElement>('#katakana-tabs .btn-chart-tab');
  katakanaTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      katakanaTabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeKatakanaTab = (btn.dataset.tab as 'basic' | 'voiced' | 'combos') ?? 'basic';

      // Update Practice Button Text dynamically
      if (state.activeKatakanaTab === 'basic') {
        btnPracticeKatakana.textContent = '⚡ Study Katakana Flashcards';
      } else if (state.activeKatakanaTab === 'voiced') {
        btnPracticeKatakana.textContent = '⚡ Study Voiced Katakana';
      } else {
        btnPracticeKatakana.textContent = '⚡ Study Combo Katakana';
      }

      void renderKanaGrid('katakana');
    });
  });

  // Forgotten Things Easter Egg listeners (Circular popup popup from bottom-left corner)
  const forgottenBtn = document.getElementById('btn-forgotten-things');
  const forgottenPopup = document.getElementById('forgotten-popup');
  if (forgottenBtn && forgottenPopup) {
    forgottenBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      forgottenPopup.classList.toggle('active');
    });

    document.addEventListener('click', (e) => {
      if (!forgottenPopup.contains(e.target as Node) && e.target !== forgottenBtn) {
        forgottenPopup.classList.remove('active');
      }
    });
  }

  // Unlock Web Audio Context on first click
  document.addEventListener(
    'click',
    () => {
      FeedbackAudio.init();
    },
    { once: true }
  );

  // Hamburger Menu drawer logic for mobile
  const hamburgerBtn = document.getElementById('hamburger-menu-btn');
  const sidebarOverlay = document.getElementById('sidebar-overlay');
  const sidebarElement = document.querySelector('.sidebar');
  const sidebarMenuItems = document.querySelectorAll('.sidebar .menu-item');

  if (hamburgerBtn && sidebarElement) {
    const toggleSidebar = () => {
      hamburgerBtn.classList.toggle('active');
      sidebarElement.classList.toggle('open');
      if (sidebarOverlay) {
        sidebarOverlay.classList.toggle('active');
      }
    };

    const closeSidebar = () => {
      hamburgerBtn.classList.remove('active');
      sidebarElement.classList.remove('open');
      if (sidebarOverlay) {
        sidebarOverlay.classList.remove('active');
      }
    };

    hamburgerBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleSidebar();
    });

    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', closeSidebar);
    }

    // Auto-close drawer when selecting a section
    sidebarMenuItems.forEach((item) => {
      item.addEventListener('click', closeSidebar);
    });
  }

  // Keyboard Shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Keyboard Action Bindings
function handleKeyboardShortcuts(e: KeyboardEvent): void {
  // Ignore shortcuts if the user is typing in an input
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

  // Ignore shortcuts while a modal is open (Escape handling for filters is bound separately)
  if (document.querySelector('.modal-overlay:not(.hidden), .story-modal:not(.hidden)')) return;

  // In Study Session mode, once the card is flipped, the grade buttons are
  // reachable and Space grades Good instead of re-flipping (grading always
  // requires the answer to already be visible - see flipCard()).
  const gradingReachable = state.studyMode === 'session' && state.isFlipped;

  switch (e.code) {
    case 'Space':
      e.preventDefault(); // Stop scrolling the page
      if (gradingReachable) {
        void gradeCurrentCard(Rating.Good);
      } else {
        flipCard();
      }
      break;
    case 'Enter':
      // Only flip on Enter when the card itself is focused, to avoid double-firing
      // a button's native click behavior when e.g. a toolbar button has focus.
      if (e.target === cardViewport && !gradingReachable) {
        e.preventDefault();
        flipCard();
      }
      break;
    case 'Digit1':
      if (gradingReachable) void gradeCurrentCard(Rating.Again);
      break;
    case 'Digit2':
      if (gradingReachable) void gradeCurrentCard(Rating.Hard);
      break;
    case 'Digit3':
      if (gradingReachable) void gradeCurrentCard(Rating.Good);
      break;
    case 'Digit4':
      if (gradingReachable) void gradeCurrentCard(Rating.Easy);
      break;
    case 'ArrowLeft':
      prevCard();
      break;
    case 'ArrowRight':
      nextCard();
      break;
    case 'KeyV':
    case 'KeyA': {
      const currentCard = getActiveCard();
      if (currentCard) {
        speakJapanese(currentCard.kana);
      }
      break;
    }
    case 'KeyR':
      if (state.activeDeck === 'vocabulary') {
        toggleRomajiVisibility();
      }
      break;
  }
}

// Run application
initTheme();
void init();
