import './styles/main.css';

import { FeedbackAudio } from './audio/feedback';
import { state } from './state/store';
import {
  cardViewport,
  prevBtn,
  nextBtn,
  masteredToggleBtn,
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
  toggleMastered,
  changeFilter,
  changeLevelFilter,
  setPracticeMode,
  submitAnswer,
  toggleRomajiVisibility,
  loadDeck,
  updateStats,
  getActiveCard,
} from './ui/card';
import { renderKanaGrid } from './ui/kana';
import { setupFilterDrawer } from './ui/filters';
import {
  menuVocabulary,
  menuHiragana,
  menuKatakana,
  menuStory,
  btnBackToStory,
  switchSection,
} from './ui/nav';
import { renderStoryRoadmap } from './ui/story';
import { initTheme } from './ui/theme';
import { speakJapanese } from './audio/tts';

const btnPracticeHiragana = document.getElementById('btn-practice-hiragana')!;
const btnPracticeKatakana = document.getElementById('btn-practice-katakana')!;

// Initialize Application
async function init(): Promise<void> {
  setupEventListeners();
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

  // Mastered status toggle
  masteredToggleBtn.addEventListener('click', (e) => {
    e.preventDefault();
    e.stopPropagation(); // Avoid flipping the card when clicking the button on back face
    toggleMastered();
  });

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

  switch (e.code) {
    case 'Space':
      e.preventDefault(); // Stop scrolling the page
      flipCard();
      break;
    case 'Enter':
      // Only flip on Enter when the card itself is focused, to avoid double-firing
      // a button's native click behavior when e.g. a toolbar button has focus.
      if (e.target === cardViewport) {
        e.preventDefault();
        flipCard();
      }
      break;
    case 'ArrowLeft':
      prevCard();
      break;
    case 'ArrowRight':
      nextCard();
      break;
    case 'KeyM':
      toggleMastered();
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
