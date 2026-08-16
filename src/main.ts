import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components/card.css';
import './styles/components/controls.css';
import './styles/components/sidebar.css';
import './styles/components/bottom-nav.css';
import './styles/components/modal.css';
import './styles/components/kana.css';
import './styles/components/story.css';
import './styles/components/stats.css';
import './styles/components/misc.css';
import './styles/components/focus.css';
import './styles/themes.css';

import { FeedbackAudio } from './audio/feedback';
import { state } from './state/store';
import {
  cardViewport,
  prevBtn,
  nextBtn,
  modeSessionBtn,
  modeBrowseBtn,
  btnStartSession,
  btnEndSession,
  btnGradeAgain,
  btnGradeHard,
  btnGradeGood,
  btnGradeEasy,
  flipCard,
  prevCard,
  nextCard,
  toggleRomajiVisibility,
  loadDeck,
  startSession,
  toggleCurrentCardKnown,
  btnMarkKnown,
  gradeCurrentCard,
  setStudyMode,
  endSessionEarly,
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
import { onSwipe } from './ui/gestures';
import { setupSettingsSheet } from './ui/settingsSheet';

const btnPracticeHiragana = document.getElementById('btn-practice-hiragana')!;
const btnPracticeKatakana = document.getElementById('btn-practice-katakana')!;

// Bottom tab bar (mobile only, see styles/components/bottom-nav.css) covers
// Study/Kana/Story/Stats. It mirrors the equivalent sidebar menu item's
// active state - "Kana" highlights whenever either kana section is open,
// since it only has room to link to one of them (Hiragana).
const bottomNavButtons = {
  study: document.getElementById('bottom-nav-study'),
  kana: document.getElementById('bottom-nav-kana'),
  story: document.getElementById('bottom-nav-story'),
  stats: document.getElementById('bottom-nav-stats'),
};

function syncBottomNav(active: keyof typeof bottomNavButtons | null): void {
  for (const [key, btn] of Object.entries(bottomNavButtons)) {
    if (!btn) continue;
    const isActive = key === active;
    btn.classList.toggle('active', isActive);
    if (isActive) {
      btn.setAttribute('aria-current', 'page');
    } else {
      btn.removeAttribute('aria-current');
    }
  }
}

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

  btnMarkKnown?.addEventListener('click', () => toggleCurrentCardKnown());

  // Session lifecycle
  btnStartSession.addEventListener('click', () => void startSession());
  btnEndSession.addEventListener('click', () => endSessionEarly());

  // Study settings sheet (Step 7) - reachable from the sidebar footer and
  // the Stats section (see .btn-open-settings triggers in index.html).
  setupSettingsSheet();

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

  // Deck filter sheet - the deck bar is its only trigger; progress, level,
  // types and topics all live inside it now.
  setupFilterDrawer();




  // Sidebar Menu triggers
  menuVocabulary.addEventListener('click', () => {
    state.isStoryModeActive = false;
    btnBackToStory?.classList.add('hidden');
    switchSection('vocabulary');
    syncBottomNav('study');
    void loadDeck('vocabulary');
  });

  menuHiragana.addEventListener('click', () => {
    state.isStoryModeActive = false;
    btnBackToStory?.classList.add('hidden');
    switchSection('hiragana');
    syncBottomNav('kana');
    void renderKanaGrid('hiragana');
  });

  menuKatakana.addEventListener('click', () => {
    state.isStoryModeActive = false;
    btnBackToStory?.classList.add('hidden');
    switchSection('katakana');
    syncBottomNav('kana');
    void renderKanaGrid('katakana');
  });

  menuStory.addEventListener('click', () => {
    state.isStoryModeActive = false;
    btnBackToStory?.classList.add('hidden');
    switchSection('story');
    syncBottomNav('story');
    void renderStoryRoadmap();
    updateStats();
  });

  menuStats.addEventListener('click', () => {
    state.isStoryModeActive = false;
    btnBackToStory?.classList.add('hidden');
    switchSection('stats');
    syncBottomNav('stats');
    void renderStatsView();
  });

  // Return to Roadmap button inside Card view
  btnBackToStory.addEventListener('click', () => {
    state.isStoryModeActive = false;
    btnBackToStory?.classList.add('hidden');
    switchSection('story');
    syncBottomNav('story');
    void renderStoryRoadmap();
    updateStats();
  });

  // Dynamic Learning workspace hooks to Study deck mode
  btnPracticeHiragana.addEventListener('click', () => {
    state.isStoryModeActive = false;
    btnBackToStory?.classList.add('hidden');
    void loadDeck('hiragana');
    switchSection('vocabulary', 'hiragana');
    syncBottomNav('study');
  });

  btnPracticeKatakana.addEventListener('click', () => {
    state.isStoryModeActive = false;
    btnBackToStory?.classList.add('hidden');
    void loadDeck('katakana');
    switchSection('vocabulary', 'katakana');
    syncBottomNav('study');
  });

  // Bottom Tab Bar triggers (mobile) - mirror the equivalent sidebar item
  bottomNavButtons.study?.addEventListener('click', () => menuVocabulary.click());
  bottomNavButtons.kana?.addEventListener('click', () => menuHiragana.click());
  bottomNavButtons.story?.addEventListener('click', () => menuStory.click());
  bottomNavButtons.stats?.addEventListener('click', () => menuStats.click());

  // Hiragana / Katakana switcher inside the Kana sections. The bottom tab bar
  // has a single "Kana" slot, so this is the only route between the two on
  // mobile - it delegates to the same handlers the sidebar uses.
  document.querySelectorAll<HTMLElement>('.btn-kana-switch').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.dataset.kana === 'katakana') menuKatakana.click();
      else menuHiragana.click();
    });
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
        btnPracticeHiragana.textContent = 'Study Hiragana Flashcards';
      } else if (state.activeHiraganaTab === 'voiced') {
        btnPracticeHiragana.textContent = 'Study Voiced Hiragana';
      } else {
        btnPracticeHiragana.textContent = 'Study Combo Hiragana';
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
        btnPracticeKatakana.textContent = 'Study Katakana Flashcards';
      } else if (state.activeKatakanaTab === 'voiced') {
        btnPracticeKatakana.textContent = 'Study Voiced Katakana';
      } else {
        btnPracticeKatakana.textContent = 'Study Combo Katakana';
      }

      void renderKanaGrid('katakana');
    });
  });

  // The sidebar (and its footer) doesn't render on mobile any more, so the
  // forgotten-things trigger moves into the Stats section there. Re-runs on
  // breakpoint changes so rotating a tablet doesn't strand it in a hidden
  // container.
  const forgottenHost = document.getElementById('forgotten-host');
  const sidebarFooter = document.querySelector('.sidebar-footer');
  const mobileQuery = window.matchMedia('(max-width: 767px)');
  const placeForgottenTrigger = () => {
    const btn = document.getElementById('btn-forgotten-things');
    if (!btn || !forgottenHost || !sidebarFooter) return;
    (mobileQuery.matches ? forgottenHost : sidebarFooter).appendChild(btn);
  };
  placeForgottenTrigger();
  mobileQuery.addEventListener('change', placeForgottenTrigger);

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

  // Swipe navigation on the card (Browse mode only - nextCard/prevCard
  // already no-op in Study Session mode, where grading advances instead).
  onSwipe(cardViewport, {
    onDragMove: (dx) => {
      cardViewport.style.transform = `translateX(${dx}px)`;
      cardViewport.style.opacity = String(1 - Math.min(Math.abs(dx) / 300, 0.5));
    },
    onDragEnd: () => {
      cardViewport.style.transform = '';
      cardViewport.style.opacity = '';
    },
    onSwipeLeft: () => nextCard(),
    onSwipeRight: () => prevCard(),
  });

  // Keyboard activation for custom-role elements that don't get it for free
  // (native <button>/<a> map Enter/Space to click automatically; a
  // role="menuitem"/"button" on an arbitrary element does not).
  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const target = e.target as HTMLElement;
    if (!target.matches('.menu-item[role="menuitem"]')) return;
    e.preventDefault();
    target.click();
  });

  // Keyboard Shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Keyboard Action Bindings
function handleKeyboardShortcuts(e: KeyboardEvent): void {
  // Ignore shortcuts if the user is typing in an input
  const target = e.target as HTMLElement;
  if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

  // Ignore shortcuts while a modal is open (Escape handling is owned by modal.ts)
  if (document.querySelector('.modal-overlay:not(.hidden)')) return;

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
