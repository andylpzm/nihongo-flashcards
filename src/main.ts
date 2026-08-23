import './styles/tokens.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/components/card.css';
import './styles/components/gallery-card.css';
import './styles/components/controls.css';
import './styles/components/sidebar.css';
import './styles/components/bottom-nav.css';
import './styles/components/modal.css';
import './styles/components/kana.css';
import './styles/components/gallery.css';
import './styles/components/stats.css';
import './styles/components/picker.css';
import './styles/components/misc.css';
import './styles/components/focus.css';
import './styles/components/pager.css';
import './styles/components/splash.css';
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
  getActiveCard,
} from './ui/card';
import { Rating } from './srs/scheduler';
import type { Grade } from './srs/types';
import { renderKanaGrid } from './ui/kana';
import { renderKanjiGrid } from './ui/kanjiGrid';
import { setupFilterDrawer } from './ui/filters';
import {
  menuVocabulary,
  menuHiragana,
  menuKatakana,
  menuGallery,
  menuStats,
  switchSection,
} from './ui/nav';
import { renderGallery } from './ui/galleryView';
import { renderStatsView, refreshMissionDot } from './ui/statsView';
import { initTheme } from './ui/theme';
import { speakJapanese } from './audio/tts';
import { runMigrationIfNeeded } from './srs/migration';
import { onSwipe } from './ui/gestures';
import { createPager, type PagerController } from './ui/pager';
import { startSplash } from './ui/splash';
import { setupSettingsSheet } from './ui/settingsSheet';
import { armMotion } from './ui/motion';
import { setupPackPanel } from './ui/packPanel';
import { setupBinderTab, binderTapAllowed } from './ui/binderTab';
import { startPointsClock } from './state/profile';
import { restorePack } from './state/vault';
import { syncGalleryBadge } from './ui/galleryBadge';

const btnPracticeHiragana = document.getElementById('btn-practice-hiragana')!;
const btnPracticeKatakana = document.getElementById('btn-practice-katakana')!;

// Bottom tab bar (mobile only, see styles/components/bottom-nav.css) covers
// Study/Kana/Gallery/Stats. It mirrors the equivalent sidebar menu item's
// active state - "Kana" highlights whenever either kana section is open,
// since it only has room to link to one of them (Hiragana).
const bottomNavButtons = {
  study: document.getElementById('bottom-nav-study'),
  kana: document.getElementById('bottom-nav-kana'),
  gallery: document.getElementById('bottom-nav-gallery'),
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

// Hiragana / katakana / kanji are pages of one section, driven by the pager.
// The kanji chart has no sidebar entry of its own, so it borrows the Kana
// tab's active state.
type KanaPage = 'hiragana' | 'katakana' | 'kanji';
let kanaPager: PagerController | null = null;
let studyPager: PagerController | null = null;

/** point the study deck at whatever mode the app is in, without animating -
 *  entering the section is not a swipe. */
function syncStudyPager(): void {
  const mode = state.studyMode === 'browse' ? 'browse' : 'session';
  if (studyPager && studyPager.getActive() !== mode) studyPager.goTo(mode, false);
}

/** Show one kana page's content and render its grid. Called by the pager. */
function renderKanaPage(page: KanaPage): void {
  document.querySelectorAll<HTMLElement>('.kana-page').forEach((el) => {
    el.classList.toggle('hidden', el.dataset.kanaPage !== page);
  });
  if (page === 'kanji') void renderKanjiGrid();
  else void renderKanaGrid(page);
}

/** Enter the Kana section on a given page, from the sidebar or tab bar. */
function showKanaSection(page: KanaPage): void {
  switchSection(page, page === 'kanji' ? 'katakana' : page);
  syncBottomNav('kana');
  // Jumping in from outside the section is not a swipe, so it must not
  // animate - the deal-a-card transition is the signal for "you moved
  // sideways within this deck", and firing it on entry would misreport that.
  if (kanaPager && kanaPager.getActive() !== page) kanaPager.goTo(page, false);
  else renderKanaPage(page);
}

// Initialize Application
/**
 * dev only: ?reset starts over as a brand new user.
 *
 * points are computed from the session history, so wiping the srs database is
 * the only thing that actually puts the counter back to zero - clearing the
 * profile alone leaves every picture unlocked again on the next render. the
 * picture pack is deliberately NOT touched: reconnecting 34MB every time you
 * want to watch one unlock is waiting, not testing.
 */
async function resetForTesting(): Promise<void> {
  for (const key of Object.keys(localStorage)) {
    if (key.startsWith('nihongo_')) localStorage.removeItem(key);
  }
  await new Promise<void>((resolve) => {
    const req = indexedDB.deleteDatabase('nihongo-srs');
    req.onsuccess = req.onerror = req.onblocked = () => resolve();
    // a blocked delete never fires anything; the reload clears it anyway
    setTimeout(resolve, 1500);
  });
  location.replace(import.meta.env.BASE_URL);
}

/**
 * dev only: ?xp=690 seeds a history worth about that many points.
 *
 * points are derived from the sessions store, so there is no counter to poke -
 * the only honest way to arrive at a total is to have earned it. this adds real
 * sessions one at a time and stops before it overshoots, which sidesteps having
 * to model the streak multiplier and the per-day decay by hand.
 */
async function seedXpForTesting(target: number): Promise<void> {
  const { getAllSessions, putSession } = await import('./srs/db');
  const { computePoints } = await import('./srs/points');

  // all on one past day: the streak stays at 1, so what a session is worth
  // does not creep as more are added
  const day = new Date();
  day.setDate(day.getDate() - 1);
  day.setHours(9, 0, 0, 0);

  // the seeded sittings are dated yesterday, which is before the epoch this
  // build stamps at first boot - without moving it back they would pay nothing
  const { saveProfile } = await import('./state/profile');
  await saveProfile({ pointsEpoch: day.getTime() - 1 });

  const sessions = await getAllSessions();
  for (let i = 0; i < 400; i++) {
    const startedAt = day.getTime() + i * 60_000;
    const next = { startedAt, endedAt: startedAt + 30_000, deck: 'vocabulary', answers: 20, completed: false };
    if (computePoints([...sessions, next]).total > target) break;
    sessions.push(next);
    await putSession(next);
  }
  location.replace(import.meta.env.BASE_URL);
}

async function init(): Promise<void> {
  if (import.meta.env.DEV) {
    const flags = new URLSearchParams(location.search);
    if (flags.has('reset')) {
      await resetForTesting();
      return;
    }
    const xp = Number(flags.get('xp'));
    if (xp > 0) {
      await seedXpForTesting(xp);
      return;
    }
  }

  // Started before any work so the counter reflects the real boot, and
  // dismissed in a finally so a failed migration can never strand the user
  // on the splash screen.
  const splash = startSplash();
  try {
    await boot();
    // the pictures are the one thing loading cannot finish on its own. a pack
    // connected on an earlier visit is already in storage; a first run stops
    // here and asks for the file rather than opening into empty frames.
    if (!(await restorePack())) await splash.askForPack();
  } finally {
    void splash.finish();
  }
}

async function boot(): Promise<void> {
  // before anything reads points: draws the line under any studying done
  // before this build, so the binder is earned from today rather than bought
  // by a back catalogue
  await startPointsClock();
  setupEventListeners();
  // Vocabulary is shown by default without going through switchSection, which
  // left body.section-vocabulary unstamped until the first navigation - and
  // anything scoped to it (the resume bar, the progress panel) silently dead.
  switchSection('vocabulary');
  // One-time migration from the old boolean "mastered" localStorage sets to
  // real FSRS review records - must finish before the deck loads so the
  // progress header and session queue reflect migrated state immediately.
  await runMigrationIfNeeded();
  // Boots straight into the vocabulary deck; kana grids and the gallery
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
  setupPackPanel();
  setupBinderTab();
  // takes the tilt sensor at the first touch, so the first card opens live
  armMotion();


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
    switchSection('vocabulary');
    syncBottomNav('study');
    syncStudyPager();
    void loadDeck('vocabulary');
  });

  menuHiragana.addEventListener('click', () => showKanaSection('hiragana'));
  menuKatakana.addEventListener('click', () => showKanaSection('katakana'));

  menuGallery.addEventListener('click', () => {
    switchSection('gallery');
    syncBottomNav('gallery');
    void renderGallery();
  });

  menuStats.addEventListener('click', () => {
    switchSection('stats');
    syncBottomNav('stats');
    void renderStatsView();
  });

  // Dynamic Learning workspace hooks to Study deck mode
  btnPracticeHiragana.addEventListener('click', () => {
    void loadDeck('hiragana');
    switchSection('vocabulary', 'hiragana');
    syncBottomNav('study');
  });

  btnPracticeKatakana.addEventListener('click', () => {
    void loadDeck('katakana');
    switchSection('vocabulary', 'katakana');
    syncBottomNav('study');
  });

  // Bottom Tab Bar triggers (mobile) - mirror the equivalent sidebar item
  bottomNavButtons.study?.addEventListener('click', () => menuVocabulary.click());
  bottomNavButtons.kana?.addEventListener('click', () => menuHiragana.click());
  // the binder tab is a padlock until the first picture is earned, and the tap
  // that reveals it is not the tap that opens it
  bottomNavButtons.gallery?.addEventListener('click', () => {
    if (binderTapAllowed()) menuGallery.click();
  });
  bottomNavButtons.stats?.addEventListener('click', () => menuStats.click());

  const studyHost = document.getElementById('section-vocabulary');
  const studyContent = document.getElementById('study-pages');
  if (studyHost && studyContent) {
    studyPager = createPager(studyHost, {
      content: studyContent,
      initial: 'session',
      pages: [
        { id: 'session', title: 'Study', label: 'Study session' },
        { id: 'browse', title: 'Browse' },
      ],
      // A running session must not be swiped away - "End session" is the
      // intended exit, and paging would silently discard the queue.
      isLocked: () => document.body.classList.contains('session-active'),
      onChange: (id) => void setStudyMode(id === 'browse' ? 'browse' : 'session'),
    });
  }

  // Global "session in progress" bar. Deliberately does NOT call loadDeck:
  // a session can be running on the kana or kanji deck, and reloading
  // vocabulary would swap the cards out from under it. The session lives in
  // card.ts and survives section changes, so returning the view is enough.
  document.getElementById('btn-resume-session')?.addEventListener('click', () => {
    switchSection('vocabulary');
    syncBottomNav('study');
  });

  // The three charts are pages of one deck: big title, dots, long swipe.
  const kanaHost = document.getElementById('section-kana');
  const kanaContent = document.getElementById('kana-pages');
  if (kanaHost && kanaContent) {
    kanaPager = createPager(kanaHost, {
      content: kanaContent,
      initial: 'hiragana',
      pages: [
        { id: 'hiragana', title: 'Hiragana' },
        { id: 'katakana', title: 'Katakana' },
        { id: 'kanji', title: 'Kanji' },
      ],
      onChange: (id) => {
        const page = id as KanaPage;
        switchSection(page, page === 'kanji' ? 'katakana' : page);
        syncBottomNav('kana');
        renderKanaPage(page);
      },
    });
  }

  // Kanji N5/N4 level tabs
  const kanjiTabBtns = document.querySelectorAll<HTMLElement>('#kanji-tabs .btn-chart-tab');
  kanjiTabBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      kanjiTabBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      state.activeKanjiLevel = (btn.dataset.level as 'N5' | 'N4') ?? 'N5';
      void renderKanjiGrid();
    });
  });

  document.getElementById('btn-practice-kanji')?.addEventListener('click', () => {
    void loadDeck('kanji');
    switchSection('vocabulary', 'katakana');
    syncBottomNav('study');
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
void init().then(() => {
  // set the tab-bar cues before either tab has been opened
  void refreshMissionDot();
  syncGalleryBadge();
});
