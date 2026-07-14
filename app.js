// ==================== PROGRAMMATIC FEEDBACK SOUNDS (WEB AUDIO API) ====================
const FeedbackAudio = {
  ctx: null,

  init() {
    try {
      if (!this.ctx) {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume();
      }
    } catch (e) {
      console.warn("Web Audio API is not supported or was blocked:", e);
    }
  },

  playFlip() {
    this.init();
    if (!this.ctx) return;
    
    const duration = 0.15; // 150ms
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    
    // Fill buffer with white noise friction source
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    
    const noiseNode = this.ctx.createBufferSource();
    noiseNode.buffer = buffer;
    
    // Bandpass filter to sculpt white noise into a paper "swish"
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.setValueAtTime(3.0, this.ctx.currentTime); // resonance Q
    filter.frequency.setValueAtTime(800, this.ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(1600, this.ctx.currentTime + duration);
    
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
    
    noiseNode.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);
    
    noiseNode.start(this.ctx.currentTime);
    noiseNode.stop(this.ctx.currentTime + duration);
  },

  playCorrect() {
    this.init();
    if (!this.ctx) return;

    const playNote = (freq, time, duration) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0.05, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(time);
      osc.stop(time + duration);
    };

    const now = this.ctx.currentTime;
    playNote(659.25, now, 0.08); // E5
    playNote(880, now + 0.08, 0.25); // A5
  },

  playSuccess() {
    this.init();
    if (!this.ctx) return;

    const playNote = (freq, time, duration) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, time);
      
      gain.gain.setValueAtTime(0.04, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + duration);
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      osc.start(time);
      osc.stop(time + duration);
    };

    const now = this.ctx.currentTime;
    playNote(523.25, now, 0.12);        // C5
    playNote(659.25, now + 0.08, 0.12); // E5
    playNote(783.99, now + 0.16, 0.12); // G5
    playNote(1046.5, now + 0.24, 0.35); // C6
  }
};

// State Variables
let cards = [...initialCards];
let displayOrder = cards.map((_, index) => index); // maps display positions to index in cards array
let currentIndex = 0;
let isFlipped = false;
let isShuffled = true; // Enabled by default for endless shuffle study style
let studyDirection = 'jp-to-eng'; // Fixed to Japanese-first (jp-to-eng)
let filterMode = 'all'; // 'all', 'learning', 'mastered'
let levelFilter = 'all'; // 'all', 'N5', 'N4'
let practiceMode = 'flashcard'; // 'flashcard' or 'typing'
let hasSubmittedAnswer = false;
let showRomaji = true; // Toggle for hiding/showing Romaji pronunciation text
let activeDeck = 'vocabulary'; // 'vocabulary', 'hiragana', 'katakana'

// Mastered Cards Persistence (using Local Storage)
let masteredCardIds = new Set();
try {
  const savedMastered = localStorage.getItem('nihongo_mastered_ids');
  if (savedMastered) {
    const parsed = JSON.parse(savedMastered);
    if (Array.isArray(parsed)) {
      masteredCardIds = new Set(parsed);
    }
  }
} catch (e) {
  console.warn("Could not load progress from localStorage:", e);
}

// Story Mode state variables
let isStoryModeActive = false;
let activeStoryChapterId = null;
let storyUnlockedChapter = 1;
try {
  const savedStoryLevel = localStorage.getItem('nihongo_story_unlocked');
  if (savedStoryLevel) {
    storyUnlockedChapter = parseInt(savedStoryLevel, 10);
  }
} catch(e) {}

let storyMasteredIds = new Set();
try {
  const savedStoryMastered = localStorage.getItem('nihongo_story_mastered_ids');
  if (savedStoryMastered) {
    const parsed = JSON.parse(savedStoryMastered);
    if (Array.isArray(parsed)) {
      storyMasteredIds = new Set(parsed);
    }
  }
} catch(e) {}

// DOM Elements - Card Workspace
const cardViewport = document.getElementById('card-viewport');
const cardFront = document.getElementById('card-front');
const cardBack = document.getElementById('card-back');

const prevBtn = document.getElementById('btn-prev');
const nextBtn = document.getElementById('btn-next');
const masteredToggleBtn = document.getElementById('btn-mastered');

// Proposal Progress Counters
const proposalRemainingEl = document.getElementById('proposal-remaining');
const proposalBarFillEl = document.getElementById('proposal-bar-fill');
const countTotalEl = document.getElementById('count-total');
const countLearningEl = document.getElementById('count-learning');

// Filter toggles
const filterAllBtn = document.getElementById('filter-all');
const filterLearningBtn = document.getElementById('filter-learning');
const filterMasteredBtn = document.getElementById('filter-mastered');

// JLPT Level filter toggles
const levelFilterGroup = document.getElementById('level-filter-group');
const vocabDropdownFilters = document.getElementById('vocab-dropdown-filters');
const filterLevelAllBtn = document.getElementById('filter-level-all');
const filterLevelN5Btn = document.getElementById('filter-level-n5');
const filterLevelN4Btn = document.getElementById('filter-level-n4');

// Typing Mode elements
const typingContainer = document.getElementById('typing-container');
const typingInput = document.getElementById('typing-input');
const submitBtn = document.getElementById('btn-submit-answer');
const feedbackText = document.getElementById('feedback-text');
const modeFlashcardBtn = document.getElementById('toggle-mode-flashcard');
const modeTypingBtn = document.getElementById('toggle-mode-typing');

// Sidebar Switcher Elements
const menuVocabulary = document.getElementById('menu-vocabulary');
const menuHiragana = document.getElementById('menu-hiragana');
const menuKatakana = document.getElementById('menu-katakana');
const menuStory = document.getElementById('menu-story');

const sectionVocabulary = document.getElementById('section-vocabulary');
const sectionHiragana = document.getElementById('section-hiragana');
const sectionKatakana = document.getElementById('section-katakana');
const sectionStory = document.getElementById('section-story');

const btnPracticeHiragana = document.getElementById('btn-practice-hiragana');
const btnPracticeKatakana = document.getElementById('btn-practice-katakana');

// Story Mode additional controls
const storyRoadmap = document.getElementById('story-roadmap');
const storyModal = document.getElementById('story-modal');
const btnCloseStoryModal = document.getElementById('btn-close-story-modal');
const btnCloseStoryModalFooter = document.getElementById('btn-close-story-modal-footer');
const storyDialogueBody = document.getElementById('story-dialogue-body');
const btnBackToStory = document.getElementById('btn-back-to-story');

// Standard Japanese Gojuon Row Layout Template
const gojuonLayout = [
  "a", "i", "u", "e", "o",
  "ka", "ki", "ku", "ke", "ko",
  "sa", "shi", "su", "se", "so",
  "ta", "chi", "tsu", "te", "to",
  "na", "ni", "nu", "ne", "no",
  "ha", "hi", "fu", "he", "ho",
  "ma", "mi", "mu", "me", "mo",
  "ya", null, "yu", null, "yo",
  "ra", "ri", "ru", "re", "ro",
  "wa", null, null, null, "wo",
  "n", null, null, null, null
];

// Voiced (Dakuon/Handakuon) Row Layout Template (G, Z, D, B, P rows)
const voicedLayout = [
  "ga", "gi", "gu", "ge", "go",
  "za", "ji", "zu", "ze", "zo",
  "da", "dji", "dzu", "de", "do",
  "ba", "bi", "bu", "be", "bo",
  "pa", "pi", "pu", "pe", "po"
];

// Contracted (Yōon) Layout Template (3-column layout)
const combosLayout = [
  "kya", "kyu", "kyo",
  "sha", "shu", "sho",
  "cha", "chu", "cho",
  "nya", "nyu", "nyo",
  "hya", "hyu", "hyo",
  "mya", "myu", "myo",
  "rya", "ryu", "ryo",
  "gya", "gyu", "gyo",
  "ja", "ju", "jo",
  "bya", "byu", "byo",
  "pya", "pyu", "pyo"
];

// Variation Active Tab States
let activeHiraganaTab = 'basic';
let activeKatakanaTab = 'basic';

// Vocabulary Category & Context Filter States (Multi-select tracking arrays)
let selectedVocabTypes = ['nouns', 'verbs', 'adjectives', 'misc'];
let selectedVocabTopics = ['numbers', 'calendar', 'time', 'body', 'food', 'family', 'school', 'travel', 'weather', 'other'];

const deckTitleMap = {
  vocabulary: "Vocabulary Deck",
  hiragana: "Hiragana Deck",
  katakana: "Katakana Deck"
};

// Initialize Web Speech API triggers
if ('speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    window.speechSynthesis.getVoices();
  };
}

// Initialize Application
function init() {
  setupEventListeners();
  updateStats();
  applyFiltersAndShuffle();
  renderCard();
  
  // Pre-render grids
  renderKanaGrid('hiragana');
  renderKanaGrid('katakana');
}

// Setup Event Listeners
function setupEventListeners() {
  // Card Flip Click
  cardViewport.addEventListener('click', flipCard);

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
  filterLevelAllBtn.addEventListener('click', () => changeLevelFilter('all'));
  filterLevelN5Btn.addEventListener('click', () => changeLevelFilter('N5'));
  filterLevelN4Btn.addEventListener('click', () => changeLevelFilter('N4'));

  // Vocabulary Filter Drawer (Concept B Refined) Event Handlers
  const btnOpenFilters = document.getElementById('btn-open-filters');
  const filterModalOverlay = document.getElementById('filter-modal-overlay');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const btnDrawerClear = document.getElementById('btn-drawer-clear');
  const btnDrawerSelectAll = document.getElementById('btn-drawer-select-all');
  const btnDrawerApply = document.getElementById('btn-drawer-apply');
  const filterDrawer = document.getElementById('filter-drawer');

  // Helper to open the drawer and sync UI state with variables
  const openFilterDrawer = () => {
    if (!filterModalOverlay) return;
    
    // Sync chip button states with active variable arrays
    const typeBtns = filterModalOverlay.querySelectorAll('.types-grid .filter-chip-btn');
    typeBtns.forEach(btn => {
      const val = btn.getAttribute('data-type');
      btn.classList.toggle('active', selectedVocabTypes.includes(val));
    });

    const topicBtns = filterModalOverlay.querySelectorAll('.topics-grid .filter-chip-btn');
    topicBtns.forEach(btn => {
      const val = btn.getAttribute('data-topic');
      btn.classList.toggle('active', selectedVocabTopics.includes(val));
    });

    filterModalOverlay.classList.remove('hidden');
  };

  // Helper to close the drawer
  const closeFilterDrawer = () => {
    if (filterModalOverlay) {
      filterModalOverlay.classList.add('hidden');
    }
  };

  if (btnOpenFilters) {
    btnOpenFilters.addEventListener('click', openFilterDrawer);
  }

  if (btnCloseDrawer) {
    btnCloseDrawer.addEventListener('click', closeFilterDrawer);
  }

  // Close when clicking on overlay backdrop (excluding the drawer container itself)
  if (filterModalOverlay) {
    filterModalOverlay.addEventListener('click', (e) => {
      if (filterDrawer && !filterDrawer.contains(e.target)) {
        closeFilterDrawer();
      }
    });
  }

  // Helper to bind desktop double-clicks and mobile touch long-presses to filter chips
  function bindIsolateGesture(btn, typeOrTopic, siblingButtons) {
    let touchTimer = null;
    let isLongPress = false;
    let startX = 0;
    let startY = 0;

    // Mobile touchstart event
    btn.addEventListener('touchstart', (e) => {
      isLongPress = false;
      const touch = e.touches[0];
      startX = touch.clientX;
      startY = touch.clientY;

      touchTimer = setTimeout(() => {
        isLongPress = true;
        // Vibration pulse feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        // Isolate this chip
        siblingButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      }, 600); // 600ms long-press threshold
    }, { passive: true });

    // Cancel timer if finger drags/scrolls
    btn.addEventListener('touchmove', (e) => {
      const touch = e.touches[0];
      if (Math.abs(touch.clientX - startX) > 10 || Math.abs(touch.clientY - startY) > 10) {
        clearTimeout(touchTimer);
      }
    });

    // Handle touchend
    btn.addEventListener('touchend', (e) => {
      clearTimeout(touchTimer);
      if (isLongPress) {
        // Prevent click/toggle from firing instantly upon release
        e.preventDefault();
      }
    });

    btn.addEventListener('touchcancel', () => {
      clearTimeout(touchTimer);
    });

    // Pointer click event
    btn.addEventListener('click', (e) => {
      if (isLongPress) {
        isLongPress = false;
        return;
      }

      if (e.detail === 2) {
        // Desktop Double Click: Isolate
        siblingButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      } else {
        // Single Click: Toggle
        if (typeOrTopic === 'type') {
          const activeBtns = Array.from(siblingButtons).filter(b => b.classList.contains('active'));
          if (btn.classList.contains('active')) {
            if (activeBtns.length <= 1) return; // Prevent empty Word Types
            btn.classList.remove('active');
          } else {
            btn.classList.add('active');
          }
        } else {
          btn.classList.toggle('active');
        }
      }
    });
  }

  // Bind type and topic elements
  if (filterModalOverlay) {
    const typeBtns = filterModalOverlay.querySelectorAll('.types-grid .filter-chip-btn');
    typeBtns.forEach(btn => bindIsolateGesture(btn, 'type', typeBtns));

    const topicBtns = filterModalOverlay.querySelectorAll('.topics-grid .filter-chip-btn');
    topicBtns.forEach(btn => bindIsolateGesture(btn, 'topic', topicBtns));
  }

  // Clear all category filters (deactivate all topics, leave nouns active for type)
  if (btnDrawerClear) {
    btnDrawerClear.addEventListener('click', () => {
      if (!filterModalOverlay) return;
      filterModalOverlay.querySelectorAll('.topics-grid .filter-chip-btn').forEach(btn => {
        btn.classList.remove('active');
      });
      filterModalOverlay.querySelectorAll('.types-grid .filter-chip-btn').forEach(btn => {
        const val = btn.getAttribute('data-type');
        btn.classList.toggle('active', val === 'nouns');
      });
    });
  }

  // Select all category filters
  if (btnDrawerSelectAll) {
    btnDrawerSelectAll.addEventListener('click', () => {
      if (!filterModalOverlay) return;
      filterModalOverlay.querySelectorAll('.filter-chip-btn').forEach(btn => {
        btn.classList.add('active');
      });
    });
  }

  // Apply filters button logic
  if (btnDrawerApply) {
    btnDrawerApply.addEventListener('click', () => {
      if (!filterModalOverlay) return;

      const activeTypes = Array.from(filterModalOverlay.querySelectorAll('.types-grid .filter-chip-btn.active'))
        .map(btn => btn.getAttribute('data-type'));

      const activeTopics = Array.from(filterModalOverlay.querySelectorAll('.topics-grid .filter-chip-btn.active'))
        .map(btn => btn.getAttribute('data-topic'));

      // Prevent blank deck states
      if (activeTypes.length === 0) {
        alert('Please select at least one Word Type.');
        return;
      }

      // Update state arrays
      selectedVocabTypes = activeTypes;
      selectedVocabTopics = activeTopics;

      currentIndex = 0;
      applyFiltersAndShuffle();
      renderCard();
      closeFilterDrawer();
    });
  }

  // Close drawer on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && filterModalOverlay && !filterModalOverlay.classList.contains('hidden')) {
      closeFilterDrawer();
    }
  });

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
    isStoryModeActive = false;
    if (btnBackToStory) btnBackToStory.classList.add('hidden');
    switchSection('vocabulary');
    loadDeck('vocabulary');
  });

  menuHiragana.addEventListener('click', () => {
    isStoryModeActive = false;
    if (btnBackToStory) btnBackToStory.classList.add('hidden');
    switchSection('hiragana');
  });

  menuKatakana.addEventListener('click', () => {
    isStoryModeActive = false;
    if (btnBackToStory) btnBackToStory.classList.add('hidden');
    switchSection('katakana');
  });

  menuStory.addEventListener('click', () => {
    isStoryModeActive = false;
    if (btnBackToStory) btnBackToStory.classList.add('hidden');
    switchSection('story');
    renderStoryRoadmap();
    updateStats();
  });

  // Return to Roadmap button inside Card view
  btnBackToStory.addEventListener('click', () => {
    isStoryModeActive = false;
    if (btnBackToStory) btnBackToStory.classList.add('hidden');
    switchSection('story');
    renderStoryRoadmap();
    updateStats();
  });

  // Dialogue Modal overlay close listeners
  btnCloseStoryModal.addEventListener('click', closeStoryModal);
  btnCloseStoryModalFooter.addEventListener('click', closeStoryModal);

  // Dynamic Learning workspace hooks to Study deck mode
  btnPracticeHiragana.addEventListener('click', () => {
    isStoryModeActive = false;
    if (btnBackToStory) btnBackToStory.classList.add('hidden');
    loadDeck('hiragana');
    switchSection('vocabulary', 'hiragana');
  });

  btnPracticeKatakana.addEventListener('click', () => {
    isStoryModeActive = false;
    if (btnBackToStory) btnBackToStory.classList.add('hidden');
    loadDeck('katakana');
    switchSection('vocabulary', 'katakana');
  });

  // Hiragana Tab Event Listeners
  const hiraganaTabBtns = document.querySelectorAll('#hiragana-tabs .btn-chart-tab');
  hiraganaTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      hiraganaTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeHiraganaTab = btn.dataset.tab;
      
      // Update Practice Button Text dynamically
      if (activeHiraganaTab === 'basic') {
        btnPracticeHiragana.textContent = '🌸 Study Hiragana Flashcards';
      } else if (activeHiraganaTab === 'voiced') {
        btnPracticeHiragana.textContent = '🌸 Study Voiced Hiragana';
      } else {
        btnPracticeHiragana.textContent = '🌸 Study Combo Hiragana';
      }
      
      renderKanaGrid('hiragana');
    });
  });

  // Katakana Tab Event Listeners
  const katakanaTabBtns = document.querySelectorAll('#katakana-tabs .btn-chart-tab');
  katakanaTabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      katakanaTabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeKatakanaTab = btn.dataset.tab;
      
      // Update Practice Button Text dynamically
      if (activeKatakanaTab === 'basic') {
        btnPracticeKatakana.textContent = '⚡ Study Katakana Flashcards';
      } else if (activeKatakanaTab === 'voiced') {
        btnPracticeKatakana.textContent = '⚡ Study Voiced Katakana';
      } else {
        btnPracticeKatakana.textContent = '⚡ Study Combo Katakana';
      }
      
      renderKanaGrid('katakana');
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
      if (!forgottenPopup.contains(e.target) && e.target !== forgottenBtn) {
        forgottenPopup.classList.remove('active');
      }
    });
  }

  // Unlock Web Audio Context on first click
  document.addEventListener('click', () => {
    FeedbackAudio.init();
  }, { once: true });

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
    sidebarMenuItems.forEach(item => {
      item.addEventListener('click', closeSidebar);
    });
  }

  // Keyboard Shortcuts
  document.addEventListener('keydown', handleKeyboardShortcuts);
}

// Keyboard Action Bindings
function handleKeyboardShortcuts(e) {
  // Ignore shortcuts if the user is typing in an input
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

  switch (e.code) {
    case 'Space':
      e.preventDefault(); // Stop scrolling the page
      flipCard();
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
    case 'KeyA':
      const currentCard = getActiveCard();
      if (currentCard) {
        speakJapanese(currentCard.hiragana);
      }
      break;
    case 'KeyR':
      if (activeDeck === 'vocabulary') {
        toggleRomajiVisibility();
      }
      break;
  }
}

// Switch Sidebar sections
function switchSection(sectionName, activeMenuName) {
  const menuName = activeMenuName || sectionName;
  menuVocabulary.classList.toggle('active', menuName === 'vocabulary');
  menuHiragana.classList.toggle('active', menuName === 'hiragana');
  menuKatakana.classList.toggle('active', menuName === 'katakana');
  menuStory.classList.toggle('active', menuName === 'story');

  sectionVocabulary.classList.toggle('hidden', sectionName !== 'vocabulary');
  sectionHiragana.classList.toggle('hidden', sectionName !== 'hiragana');
  sectionKatakana.classList.toggle('hidden', sectionName !== 'katakana');
  sectionStory.classList.toggle('hidden', sectionName !== 'story');
}

// Load a specific Deck (Vocabulary, Hiragana, Katakana) into active study scope
function loadDeck(deckName) {
  activeDeck = deckName;
  
  if (deckName === 'vocabulary') {
    cards = [...initialCards];
    if (levelFilterGroup) levelFilterGroup.classList.remove('hidden');
    if (vocabDropdownFilters) vocabDropdownFilters.classList.remove('hidden');
    if (btnBackToStory) btnBackToStory.classList.add('hidden');
  } else {
    if (deckName === 'hiragana') {
      if (activeHiraganaTab === 'basic') {
        cards = [...hiraganaAlphabet];
        deckTitleMap.hiragana = "Hiragana (Basic)";
      } else if (activeHiraganaTab === 'voiced') {
        cards = [...hiraganaVoiced];
        deckTitleMap.hiragana = "Hiragana (Voiced)";
      } else {
        cards = [...hiraganaCombos];
        deckTitleMap.hiragana = "Hiragana (Combos)";
      }
    } else if (deckName === 'katakana') {
      if (activeKatakanaTab === 'basic') {
        cards = [...katakanaAlphabet];
        deckTitleMap.katakana = "Katakana (Basic)";
      } else if (activeKatakanaTab === 'voiced') {
        cards = [...katakanaVoiced];
        deckTitleMap.katakana = "Katakana (Voiced)";
      } else {
        cards = [...katakanaCombos];
        deckTitleMap.katakana = "Katakana (Combos)";
      }
    }
    // Hide level and category filters for non-vocabulary decks and reset filters
    if (levelFilterGroup) levelFilterGroup.classList.add('hidden');
    if (vocabDropdownFilters) vocabDropdownFilters.classList.add('hidden');
    levelFilter = 'all';
    if (filterLevelAllBtn) filterLevelAllBtn.classList.add('active');
    if (filterLevelN5Btn) filterLevelN5Btn.classList.remove('active');
    if (filterLevelN4Btn) filterLevelN4Btn.classList.remove('active');
    if (btnBackToStory) btnBackToStory.classList.add('hidden');
  }

  applyFiltersAndShuffle();
  currentIndex = 0;
  
  updateStats();
  renderCard();
}

// Render dynamic Interactive Syllabary Gojuon chart
function renderKanaGrid(type) {
  const containerId = type === 'hiragana' ? 'hiragana-grid-container' : 'katakana-grid-container';
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = '';
  
  // Determine active tab state
  const activeTab = type === 'hiragana' ? activeHiraganaTab : activeKatakanaTab;
  
  let alphabet;
  let layout;
  
  if (activeTab === 'basic') {
    alphabet = type === 'hiragana' ? hiraganaAlphabet : katakanaAlphabet;
    layout = gojuonLayout;
    container.classList.remove('combos-layout');
  } else if (activeTab === 'voiced') {
    alphabet = type === 'hiragana' ? hiraganaVoiced : katakanaVoiced;
    layout = voicedLayout;
    container.classList.remove('combos-layout');
  } else {
    alphabet = type === 'hiragana' ? hiraganaCombos : katakanaCombos;
    layout = combosLayout;
    container.classList.add('combos-layout');
  }

  layout.forEach(romaji => {
    const cell = document.createElement('div');
    
    if (romaji === null) {
      cell.className = 'kana-grid-cell empty';
      cell.innerHTML = '';
    } else {
      const charData = alphabet.find(item => item.romaji === romaji);
      if (charData) {
        cell.className = 'kana-grid-cell';
        cell.innerHTML = `
          <span class="kana-char">${charData.hiragana}</span>
          <span class="kana-romaji">${charData.romaji}</span>
        `;
        cell.title = `Pronounce ${charData.romaji}`;
        cell.addEventListener('click', () => {
          speakJapanese(charData.hiragana);
        });
      } else {
        cell.className = 'kana-grid-cell empty';
        cell.innerHTML = '';
      }
    }
    container.appendChild(cell);
  });
}

// Get the Active Card Object based on current display index
function getActiveCard() {
  if (displayOrder.length === 0) return null;
  const originalIndex = displayOrder[currentIndex];
  return cards[originalIndex];
}

// Render UI for Card
function renderCard() {
  const currentCard = getActiveCard();

  // Reset Flipped Class and answer glow classes
  cardViewport.classList.remove('flipped', 'correct-answer', 'incorrect-answer');
  isFlipped = false;
  hasSubmittedAnswer = false;

  if (practiceMode === 'typing') {
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
  if (isStoryModeActive && activeStoryChapterId !== null) {
    level = `Ch. ${activeStoryChapterId}`;
  } else {
    const levelMatch = currentCard.notes ? currentCard.notes.match(/Level:\s*(N\d)/i) : null;
    level = levelMatch ? levelMatch[1] : '';
  }

  // Set card contents depending on Study Direction
  if (studyDirection === 'eng-to-jp') {
    // FRONT: English
    cardFront.innerHTML = `
      <span class="card-indicator">English ${level ? `<span class="level-badge" style="margin-left: 0.65rem; padding: 0.15rem 0.45rem; font-size: 0.75rem; background: rgba(255,255,255,0.12); border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); color: var(--accent-cyan); font-weight: 600;">${level}</span>` : ''}</span>
      <div class="card-main-text">${currentCard.english}</div>
      <span style="font-size: 0.85rem; color: var(--text-secondary); opacity: 0.6;">Click or Press [Space] to flip</span>
    `;

    // BACK: Japanese
    cardBack.innerHTML = `
      <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-start;">
        <span class="card-indicator">Japanese</span>
        <div style="display: flex; gap: 0.5rem;">
          ${activeDeck === 'vocabulary' ? `
            <button class="speak-button" id="btn-toggle-romaji" title="${showRomaji ? 'Hide Romaji [R]' : 'Show Romaji [R]'}" aria-label="Toggle Romaji">
              ${showRomaji ? getEyeOpenSVG() : getEyeClosedSVG()}
            </button>
          ` : ''}
          <button class="speak-button" id="btn-speak" title="Listen Pronunciation [A]" aria-label="Listen Pronunciation">
            <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          </button>
        </div>
      </div>
      <div class="japanese-container">
        <div class="hiragana-text">${currentCard.hiragana}</div>
        ${activeDeck === 'vocabulary' ? `<div class="romaji-text">${currentCard.romaji}</div>` : ''}
      </div>
      <div class="card-sub-info">${currentCard.notes}</div>
    `;
  } else {
    // FRONT: Japanese
    cardFront.innerHTML = `
      <div style="width: 100%; display: flex; justify-content: space-between; align-items: flex-start;">
        <span class="card-indicator">Japanese ${level ? `<span class="level-badge" style="margin-left: 0.65rem; padding: 0.15rem 0.45rem; font-size: 0.75rem; background: rgba(255,255,255,0.12); border-radius: 6px; border: 1px solid rgba(255,255,255,0.08); color: var(--accent-pink); font-weight: 600;">${level}</span>` : ''}</span>
        <div style="display: flex; gap: 0.5rem;">
          ${activeDeck === 'vocabulary' ? `
            <button class="speak-button" id="btn-toggle-romaji" title="${showRomaji ? 'Hide Romaji [R]' : 'Show Romaji [R]'}" aria-label="Toggle Romaji">
              ${showRomaji ? getEyeOpenSVG() : getEyeClosedSVG()}
            </button>
          ` : ''}
          <button class="speak-button" id="btn-speak" title="Listen Pronunciation [A]" aria-label="Listen Pronunciation">
            <svg viewBox="0 0 24 24"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/></svg>
          </button>
        </div>
      </div>
      <div class="japanese-container">
        <div class="hiragana-text" style="font-size: 3rem; margin-top: -10px;">${currentCard.hiragana}</div>
        ${activeDeck === 'vocabulary' ? `<div class="romaji-text">${currentCard.romaji}</div>` : ''}
      </div>
      <span style="font-size: 0.85rem; color: var(--text-secondary); opacity: 0.6;">Click or Press [Space] to flip</span>
    `;

    // BACK: English
    cardBack.innerHTML = `
      <span class="card-indicator">English</span>
      <div class="card-main-text">${currentCard.english}</div>
      <div class="card-sub-info">${currentCard.notes}</div>
    `;
  }

  // Attach dynamic listener for speech icon (since cards are re-rendered)
  const speakBtn = document.getElementById('btn-speak');
  if (speakBtn) {
    speakBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Avoid re-flipping card
      speakJapanese(currentCard.hiragana);
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
  const total = displayOrder.length;
  prevBtn.disabled = total === 0;
  nextBtn.disabled = total === 0;
}

// Render empty state if filter contains 0 cards
function renderEmptyState() {
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
function flipCard(silent = false) {
  if (displayOrder.length === 0) return;
  isFlipped = !isFlipped;
  cardViewport.classList.toggle('flipped', isFlipped);
  if (silent !== true) {
    FeedbackAudio.playFlip();
  }
}

// Next Card (loops endlessly and reshuffles on wrap-around if shuffle is enabled)
function nextCard() {
  const total = displayOrder.length;
  if (total === 0) return;

  if (currentIndex < total - 1) {
    currentIndex++;
  } else {
    // Wrap around to start
    currentIndex = 0;
    
    // If in shuffle mode, reshuffle the remaining deck on completion so sequence varies
    if (isShuffled) {
      applyFiltersAndShuffle();
    }
  }
  renderCard();
}

// Previous Card (loops endlessly)
function prevCard() {
  const total = displayOrder.length;
  if (total === 0) return;

  if (currentIndex > 0) {
    currentIndex--;
  } else {
    // Wrap around to end
    currentIndex = total - 1;
  }
  renderCard();
}

// Shuffled mode is permanently enabled.

// Change study filter (All, Learning, Mastered)
function changeFilter(filter) {
  filterMode = filter;
  filterAllBtn.classList.toggle('active', filter === 'all');
  filterLearningBtn.classList.toggle('active', filter === 'learning');
  filterMasteredBtn.classList.toggle('active', filter === 'mastered');

  currentIndex = 0;
  applyFiltersAndShuffle();
  renderCard();
}

// Change JLPT level filter (All, N5, N4)
function changeLevelFilter(level) {
  levelFilter = level;
  filterLevelAllBtn.classList.toggle('active', level === 'all');
  filterLevelN5Btn.classList.toggle('active', level === 'N5');
  filterLevelN4Btn.classList.toggle('active', level === 'N4');

  currentIndex = 0;
  applyFiltersAndShuffle();
  renderCard();
}

// Classify vocabulary word type (Noun, Verb, Adjective, Phrase)
function getWordType(card) {
  if (!card) return 'other';
  const hiragana = card.hiragana || '';
  const english = (card.english || '').toLowerCase();
  const notes = (card.notes || '').toLowerCase();

  if (english.startsWith('to ') || notes.includes('verb')) {
    return 'verbs';
  }

  // Detect Adjectives (i-adjectives ending in "i" except common noun outliers, and specific na-adjectives)
  const nounBlacklist = ['もんだい', 'おてあらい', 'はい', 'けいたい', 'きょうだい', 'しゃかい', 'じしん', 'せいかつ', 'せかい', 'ちり', 'へや', 'みらい', 'めいし'];
  const adjKeywords = ['hot', 'cold', 'warm', 'cool', 'big', 'small', 'large', 'new', 'old', 'good', 'bad', 'difficult', 'easy', 'expensive', 'cheap', 'busy', 'dirty', 'kind', 'famous', 'lively', 'quiet', 'clean', 'healthy', 'convenient', 'delicious', 'interesting', 'heavy', 'light', 'narrow', 'wide', 'short', 'long', 'slow', 'fast', 'pretty', 'cute', 'unpleasant', 'many', 'few', 'dark', 'bright', 'sweet', 'spicy', 'salty', 'bitter', 'sour', 'thin', 'thick', 'convenient', 'inconvenient', 'skilful', 'unskilful', 'poor', 'rich', 'famous', 'various', 'important', 'safe', 'dangerous', 'rude', 'kind', 'free', 'busy', 'happy', 'sad', 'sleepy', 'painful', 'lonely', 'noisy', 'polite', 'impolite'];
  
  const isAdjEnding = hiragana.endsWith('い') && !nounBlacklist.includes(hiragana);
  const isAdjKeyword = adjKeywords.some(kw => {
    const words = english.replace(/[?,.!();/]/g, ' ').split(/\s+/);
    return words.includes(kw);
  });

  if (isAdjEnding || isAdjKeyword || notes.includes('adjective') || notes.includes('adj') || notes.includes(' na ') || notes.includes(' i ')) {
    return 'adjectives';
  }

  // Detect Miscellaneous structural grammar words (pronouns, adverbs, numbers, counters, greetings, response words)
  const miscKeywords = ['thank you', 'excuse me', 'sorry', 'hello', 'goodbye', 'welcome', 'congratulations', 'please', 'yes', 'no', 'this', 'that', 'these', 'those', 'who', 'what', 'where', 'when', 'why', 'how', 'which', 'very', 'little', 'slowly', 'gradually', 'together', 'sometimes', 'often', 'always', 'never', 'but', 'and', 'then', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hundred', 'thousand', 'counter', 'times', 'floors', 'books', 'people', 'hours', 'minutes', 'days', 'months', 'years', 'me', 'you', 'he', 'she', 'we', 'they', 'my', 'your', 'his', 'her', 'here', 'there'];
  const englishWords = english.replace(/[?,.!();/]/g, ' ').split(/\s+/).filter(Boolean);
  const isMisc = miscKeywords.some(kw => {
    if (kw.includes(' ')) {
      return english.includes(kw);
    }
    return englishWords.includes(kw);
  }) || ['はい', 'いいえ', 'ありがとう', 'すみません', 'ごめんなさい', 'はじめまして', 'ただいま', 'おかえり', 'いってきます', 'いってらっしゃい'].includes(hiragana) ||
  notes.includes('counter') || english.includes('counter') || hiragana.startsWith('〜') || english.includes('?');

  if (isMisc || notes.includes('phrase') || notes.includes('expression') || notes.includes('greeting') || english.includes('!')) {
    return 'misc';
  }

  // Default fallback is nouns
  return 'nouns';
}

// Classify vocabulary topic context (Food, School, Family, Travel, Time & Weather)
function getWordTopic(card) {
  if (!card) return 'other';
  const hiragana = card.hiragana || '';
  const notes = (card.notes || '').toLowerCase();
  const english = (card.english || '').toLowerCase();

  // Split english translation into clean lowercase words to avoid substring matches
  const words = english.replace(/[?,.!();/]/g, ' ').split(/\s+/).filter(Boolean);

  // 1. Numbers & Counters (数字・助数詞)
  const numberKeywords = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'hundred', 'thousand', 'zero', 'half', 'number', 'numbers', 'counter', 'counters', 'times', 'floors', 'books', 'people', 'hours', 'minutes', 'days', 'months', 'years'];
  const isNumber = numberKeywords.some(kw => {
    if (['one', 'two', 'ten'].includes(kw)) {
      const regex = new RegExp('\\b' + kw + '\\b');
      return regex.test(english);
    }
    return words.includes(kw);
  }) || notes.includes('counter') || english.includes('counter') || hiragana.startsWith('〜');
  if (isNumber) {
    return 'numbers';
  }

  // 2. Calendar & Dates (暦・日付)
  const calendarKeywords = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday', 'calendar', 'date', 'week', 'weeks', 'month', 'months', 'year', 'years', 'today', 'yesterday', 'tomorrow', 'tonight', 'weekly', 'monthly', 'yearly', 'relative time'];
  if (calendarKeywords.some(kw => words.includes(kw) || notes.includes(kw))) {
    return 'calendar';
  }

  // 3. Time & Hours (時間・時刻)
  const timeKeywords = ['time', 'clock', 'watch', 'hour', 'hours', 'minute', 'minutes', 'second', 'seconds', 'now', 'morning', 'afternoon', 'evening', 'night', 'noon', 'pm', 'am', 'always', 'often', 'sometimes', 'usually', 'never', 'already', 'yet', 'early', 'late', 'soon'];
  if (timeKeywords.some(kw => words.includes(kw) || notes.includes(kw))) {
    return 'time';
  }

  // 4. Body & Health (身体・健康)
  const bodyKeywords = ['mouth', 'eye', 'eyes', 'body', 'ear', 'ears', 'neck', 'leg', 'legs', 'foot', 'feet', 'hand', 'hands', 'arm', 'arms', 'face', 'throat', 'nose', 'hair', 'tooth', 'teeth', 'head', 'heart', 'hospital', 'doctor', 'medicine', 'ill', 'illness', 'sick', 'sickness', 'cold', 'health', 'healthy', 'hurt', 'pain'];
  if (bodyKeywords.some(kw => words.includes(kw) || notes.includes(kw))) {
    return 'body';
  }

  // 5. Food & Dining (食べ物・食事)
  const foodKeywords = ['food', 'eat', 'drink', 'ate', 'drinking', 'delicious', 'tasty', 'sweet', 'spicy', 'sour', 'salty', 'bitter', 'kitchen', 'restaurant', 'cafe', 'meal', 'cook', 'cooking', 'sugar', 'salt', 'lunch', 'dinner', 'breakfast', 'vegetable', 'fruit', 'apple', 'bread', 'butter', 'milk', 'water', 'tea', 'coffee', 'juice', 'beer', 'sake', 'wine', 'meat', 'beef', 'pork', 'chicken', 'fish', 'egg', 'eggs', 'rice', 'soup', 'dining', 'taste', 'hungry'];
  if (foodKeywords.some(kw => words.includes(kw) || notes.includes(kw))) {
    return 'food';
  }

  // 6. Family & Social (家族・人)
  const familyKeywords = ['family', 'father', 'mother', 'sister', 'brother', 'friend', 'friends', 'child', 'children', 'person', 'people', 'doctor', 'someone', 'anyone', 'husband', 'wife', 'parents', 'marriage', 'proposal', 'love', 'boy', 'girl', 'baby', 'uncle', 'aunt', 'grandpa', 'grandma', 'grandfather', 'grandmother', 'man', 'woman', 'men', 'women', 'son', 'daughter', 'he', 'she', 'they', 'who'];
  if (familyKeywords.some(kw => words.includes(kw) || notes.includes(kw))) {
    return 'family';
  }

  // 7. School & Study (学校・勉強)
  const schoolKeywords = ['school', 'classroom', 'desk', 'blackboard', 'notebook', 'book', 'books', 'pen', 'pens', 'pencil', 'pencils', 'paper', 'student', 'students', 'teacher', 'teachers', 'class', 'classes', 'study', 'studying', 'homework', 'problem', 'problems', 'question', 'questions', 'answer', 'answers', 'test', 'tests', 'exam', 'exams', 'examination', 'dictionary', 'dictionaries', 'read', 'reading', 'write', 'writing', 'lesson', 'lessons', 'library', 'libraries', 'teach', 'teaching', 'learn', 'learning', 'education', 'textbook'];
  if (schoolKeywords.some(kw => words.includes(kw) || notes.includes(kw))) {
    return 'school';
  }

  // 8. Travel & Places (旅行・場所)
  const travelKeywords = ['travel', 'trip', 'station', 'train', 'car', 'bus', 'airplane', 'hotel', 'map', 'ticket', 'tickets', 'go', 'going', 'went', 'come', 'coming', 'came', 'return', 'returning', 'returned', 'left', 'right', 'straight', 'near', 'far', 'here', 'there', 'street', 'road', 'walk', 'walking', 'walked', 'country', 'town', 'city', 'subway', 'taxi', 'bicycle', 'ship', 'airport', 'passport', 'tourist', 'visit', 'arrive', 'arrival', 'depart', 'departure', 'place', 'places', 'location'];
  if (travelKeywords.some(kw => words.includes(kw) || notes.includes(kw))) {
    return 'travel';
  }

  // 9. Weather & Seasons (天気・季節)
  const weatherKeywords = ['weather', 'season', 'seasons', 'rain', 'rainy', 'snow', 'snowy', 'wind', 'windy', 'cloud', 'cloudy', 'sunny', 'shine', 'hot', 'cold', 'warm', 'cool', 'spring', 'summer', 'autumn', 'fall', 'winter', 'sky', 'typhoon'];
  if (weatherKeywords.some(kw => words.includes(kw) || notes.includes(kw))) {
    return 'weather';
  }

  return 'other';
}

// Update the list layout order according to filter and shuffle state
function applyFiltersAndShuffle() {
  // Filter index list
  let activeIndices = [];
  cards.forEach((card, index) => {
    const isMastered = isStoryModeActive ? storyMasteredIds.has(card.id) : masteredCardIds.has(card.id);
    
    const matchesProgress = filterMode === 'all' || 
       (filterMode === 'learning' && !isMastered) || 
       (filterMode === 'mastered' && isMastered);

    // Extract JLPT level from notes if present
    const levelMatch = card.notes ? card.notes.match(/Level:\s*(N\d)/i) : null;
    const cardLevel = levelMatch ? levelMatch[1] : '';

    const matchesLevel = levelFilter === 'all' || cardLevel === levelFilter;

    // Check type and topic filters for Vocabulary deck (using multi-select arrays)
    let matchesType = true;
    let matchesTopic = true;
    if (activeDeck === 'vocabulary' && !isStoryModeActive) {
      const cardType = getWordType(card);
      matchesType = selectedVocabTypes.includes(cardType);

      const cardTopic = getWordTopic(card);
      matchesTopic = selectedVocabTopics.includes(cardTopic);
    }

    if (matchesProgress && matchesLevel && matchesType && matchesTopic) {
      activeIndices.push(index);
    }
  });

  // Shuffle if needed
  if (isShuffled) {
    // Fisher-Yates Shuffle
    for (let i = activeIndices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [activeIndices[i], activeIndices[j]] = [activeIndices[j], activeIndices[i]];
    }
  }

  displayOrder = activeIndices;
}

// Toggle Mastered Card Status
function toggleMastered() {
  const currentCard = getActiveCard();
  if (!currentCard) return;

  const cardId = currentCard.id;
  let newlyMastered = false;
  
  if (isStoryModeActive) {
    if (storyMasteredIds.has(cardId)) {
      storyMasteredIds.delete(cardId);
    } else {
      storyMasteredIds.add(cardId);
      newlyMastered = true;
    }
    try {
      localStorage.setItem('nihongo_story_mastered_ids', JSON.stringify(Array.from(storyMasteredIds)));
    } catch (e) {
      console.error("Failed to write story progress to localStorage:", e);
    }
  } else {
    if (masteredCardIds.has(cardId)) {
      masteredCardIds.delete(cardId);
    } else {
      masteredCardIds.add(cardId);
      newlyMastered = true;
    }
    try {
      localStorage.setItem('nihongo_mastered_ids', JSON.stringify(Array.from(masteredCardIds)));
    } catch (e) {
      console.error("Failed to write vocabulary progress to localStorage:", e);
    }
  }

  if (newlyMastered) {
    FeedbackAudio.playCorrect();
  }

  updateStats();
  updateMasteredButtonState(cardId);

  // If we are filtering, the list of cards has changed, so we need to refresh active list
  if (filterMode !== 'all') {
    applyFiltersAndShuffle();
    
    // Ensure index remains in bounds
    if (currentIndex >= displayOrder.length) {
      currentIndex = Math.max(0, displayOrder.length - 1);
    }
    renderCard();
  }
}

// Update Mastered Button style active state
function updateMasteredButtonState(cardId) {
  const isMastered = isStoryModeActive ? storyMasteredIds.has(cardId) : masteredCardIds.has(cardId);
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
function updateStats() {
  if (isStoryModeActive && activeStoryChapterId !== null) {
    // Story Mode Stats
    const total = cards.length;
    const mastered = cards.filter(card => storyMasteredIds.has(card.id)).length;
    const remaining = total - mastered;
    const percent = total > 0 ? (mastered / total) * 100 : 0;

    if (countTotalEl) countTotalEl.textContent = total;
    if (countLearningEl) countLearningEl.textContent = remaining;

    if (proposalRemainingEl) {
      if (remaining === 0) {
        proposalRemainingEl.innerHTML = `<strong>Chapter Cleared! Ready to read the Dialogue with Chiyo-chan! 💍❤️</strong>`;
        
        // Auto-unlock next chapter if this is the active progress chapter
        if (activeStoryChapterId === storyUnlockedChapter) {
          storyUnlockedChapter = activeStoryChapterId + 1;
          try {
            localStorage.setItem('nihongo_story_unlocked', storyUnlockedChapter);
          } catch(e) {}
          
          // Trigger dialogue modal automatically
          showStoryDialogue(activeStoryChapterId);
        }
      } else {
        proposalRemainingEl.innerHTML = `<strong>${remaining}</strong> card${remaining > 1 ? 's' : ''} remaining in Chapter ${activeStoryChapterId} before unlocking the story dialogue!`;
      }
    }

    if (proposalBarFillEl) {
      proposalBarFillEl.style.width = `${percent}%`;
    }
  } else {
    // Normal Vocabulary Mode Stats
    const total = cards.length;
    const mastered = masteredCardIds.size;
    const remaining = total - mastered;
    const percent = total > 0 ? (mastered / total) * 100 : 0;

    if (countTotalEl) countTotalEl.textContent = total;
    if (countLearningEl) countLearningEl.textContent = remaining;

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

// Japanese Text-to-Speech execution
function speakJapanese(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Stop current speech
    
    // Prioritize female Japanese voices across operating systems
    const voices = window.speechSynthesis.getVoices();
    const jaVoices = voices.filter(voice => voice.lang.toLowerCase().includes('ja'));
    
    // Firefox/Zen Fallback: If no Japanese voice pack is installed on the host OS
    if (jaVoices.length === 0) {
      try {
        const fallbackUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=ja&client=tw-ob&q=${encodeURIComponent(text)}`;
        const audio = new Audio(fallbackUrl);
        audio.play().catch(e => console.warn("Google TTS fallback failed:", e));
      } catch (e) {
        console.warn("Could not play fallback audio:", e);
      }
      return;
    }
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    
    // Known female voice keywords: Kyoko (macOS), Haruka/Ayumi (Windows), Siri, Google
    const femaleKeywords = ['kyoko', 'haruka', 'ayumi', 'siri', 'google', 'female'];
    
    let selectedVoice = jaVoices.find(voice => 
      femaleKeywords.some(keyword => voice.name.toLowerCase().includes(keyword))
    );
    
    // Fallback to any Japanese voice if no female voice matched
    if (!selectedVoice && jaVoices.length > 0) {
      selectedVoice = jaVoices[0];
    }
    
    if (selectedVoice) {
      utterance.voice = selectedVoice;
    }
    
    utterance.rate = 0.8; // Slow down slightly for clarity
    window.speechSynthesis.speak(utterance);
  }
}

// Change practice mode (Flashcard vs Typing)
function setPracticeMode(mode) {
  practiceMode = mode;
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

// Compare user input to correct translation
function isAnswerCorrect(userAnswer, correctAnswer) {
  // Normalize strings by converting to lowercase and stripping punctuation/extra whitespace
  const clean = str => str.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?]/g, "").trim().replace(/\s+/g, ' ');
  const cleanUser = clean(userAnswer);
  
  // Split options by slash to support alternative translations (e.g. "Excuse me / Sorry")
  const options = correctAnswer.split('/').map(opt => clean(opt));
  
  return options.includes(cleanUser);
}

// Submit answer checked logic
function submitAnswer() {
  const currentCard = getActiveCard();
  if (!currentCard) return;

  if (!hasSubmittedAnswer) {
    const userAns = typingInput.value;
    const correct = isAnswerCorrect(userAns, currentCard.english);
    hasSubmittedAnswer = true;

    if (correct) {
      typingInput.classList.add('correct');
      feedbackText.className = 'feedback-text feedback-correct';
      feedbackText.innerHTML = `Correct! 🎉`;
      cardViewport.classList.add('correct-answer');
      FeedbackAudio.playCorrect();
    } else {
      typingInput.classList.add('incorrect');
      feedbackText.className = 'feedback-text feedback-incorrect';
      feedbackText.innerHTML = `Incorrect. Correct answer: <strong>${currentCard.english}</strong>`;
      cardViewport.classList.add('incorrect-answer');
    }

    // Automatically flip card to reveal English back face
    if (!isFlipped) {
      flipCard(true); // silent flip to prevent sound overlap
    }
    
    submitBtn.textContent = 'Next Card';
  } else {
    // If already checked, click on submit acts as "Next Card" navigation
    nextCard();
  }
}

// Toggle Romaji Visibility State
function toggleRomajiVisibility() {
  showRomaji = !showRomaji;
  
  // Toggle class on cardViewport to trigger CSS display none rules
  cardViewport.classList.toggle('romaji-hidden', !showRomaji);
  
  // Update button SVG and tooltip directly on the DOM to maintain flipping state
  const btn = document.getElementById('btn-toggle-romaji');
  if (btn) {
    btn.innerHTML = showRomaji ? getEyeOpenSVG() : getEyeClosedSVG();
    btn.title = showRomaji ? "Hide Romaji [R]" : "Show Romaji [R]";
  }
}

// Eye Open icon SVG
function getEyeOpenSVG() {
  return `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/></svg>`;
}

// Eye Closed icon SVG
function getEyeClosedSVG() {
  return `<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.82l2.92 2.92C21.18 15.39 22.5 13.85 23 12c-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/></svg>`;
}

// ==================== STORY MODE CAMPAIGN LOGIC ====================

// Render the interactive roadmap
function renderStoryRoadmap() {
  if (!storyRoadmap) return;
  storyRoadmap.innerHTML = '';

  storyChapters.forEach(chapter => {
    const isLocked = chapter.id > storyUnlockedChapter;
    const isCleared = chapter.id < storyUnlockedChapter;
    const isActive = chapter.id === storyUnlockedChapter;

    // Calculate progress inside chapter deck
    const totalCards = chapter.deck.length;
    const masteredCount = chapter.deck.filter(card => storyMasteredIds.has(card.id)).length;
    const percent = Math.round((masteredCount / totalCards) * 100);

    const node = document.createElement('div');
    node.className = `story-node ${isLocked ? 'locked' : ''} ${isCleared ? 'cleared' : ''}`;

    let badgeClass = 'locked-badge';
    let badgeText = 'Locked';
    if (isCleared) {
      badgeClass = 'cleared-badge';
      badgeText = '🏆 Cleared';
    } else if (isActive) {
      badgeClass = 'active-badge';
      badgeText = '🟢 Active Quest';
    }

    // Determine actions html
    let actionsHtml = '';
    if (!isLocked) {
      if (isCleared) {
        actionsHtml = `
          <button class="btn btn-story-read" onclick="showStoryDialogue(${chapter.id})">
            Read Story
          </button>
          <button class="btn btn-story-review" onclick="startStoryChapter(${chapter.id}, 'review')">
            Review Deck
          </button>
        `;
      } else {
        actionsHtml = `
          <button class="btn btn-story-start" onclick="startStoryChapter(${chapter.id}, 'study')">
            Start Chapter (${masteredCount}/${totalCards})
          </button>
        `;
      }
    } else {
      actionsHtml = `
        <button class="btn btn-story-locked" disabled>
          🔒 Locked
        </button>
      `;
    }

    node.innerHTML = `
      <div class="story-node-info">
        <div class="story-node-header">
          <h4 class="story-node-title">${isLocked ? `Chapter ${chapter.id}: Locked 🔒` : chapter.title}</h4>
          <span class="story-node-badge ${badgeClass}">${badgeText}</span>
        </div>
        <p class="story-node-desc">
          ${isLocked ? 'Master the previous chapters to unlock this story quest.' : chapter.description}
        </p>
        ${!isLocked ? `<div class="story-node-progress">Mastery Progress: ${percent}%</div>` : ''}
      </div>
      <div class="story-node-actions">
        ${actionsHtml}
      </div>
    `;

    storyRoadmap.appendChild(node);
  });
}

// Start studying/reviewing a story chapter
function startStoryChapter(chapterId, mode) {
  const chapter = storyChapters.find(ch => ch.id === chapterId);
  if (!chapter) return;

  isStoryModeActive = true;
  activeStoryChapterId = chapterId;
  activeDeck = 'story';
  cards = [...chapter.deck];

  // Disable/hide normal JLPT level selector
  if (levelFilterGroup) levelFilterGroup.classList.add('hidden');
  if (vocabDropdownFilters) vocabDropdownFilters.classList.add('hidden');

  // Show back to story map button
  if (btnBackToStory) btnBackToStory.classList.remove('hidden');

  // Reload the study deck
  applyFiltersAndShuffle();
  currentIndex = 0;
  
  updateStats();
  renderCard();
  switchSection('vocabulary', 'story');
}

// Display dialogue scene modal popup
function showStoryDialogue(chapterId) {
  const chapter = storyChapters.find(ch => ch.id === chapterId);
  if (!chapter) return;

  if (!storyDialogueBody || !storyModal) return;

  // Play dialogue unlock celebration chime
  FeedbackAudio.playSuccess();

  storyDialogueBody.innerHTML = '';
  document.getElementById('story-modal-title').textContent = `${chapter.title} - Dialogue`;

  chapter.dialogue.forEach(line => {
    const bubbleRow = document.createElement('div');
    
    // Class names: chris-kun, chiyo-chan, father
    let speakerClass = 'father';
    if (line.speaker.toLowerCase().includes('chris')) {
      speakerClass = 'chris-kun';
    } else if (line.speaker.toLowerCase().includes('chiyo')) {
      speakerClass = 'chiyo-chan';
    }

    bubbleRow.className = `story-bubble-row ${speakerClass}`;
    bubbleRow.innerHTML = `
      <span class="story-bubble-speaker">${line.speaker}</span>
      <div class="story-bubble">${line.text}</div>
    `;
    storyDialogueBody.appendChild(bubbleRow);
  });

  storyModal.classList.remove('hidden');
  
  // Auto-scroll to bottom of conversation
  setTimeout(() => {
    storyDialogueBody.scrollTop = storyDialogueBody.scrollHeight;
  }, 50);
}

// Close dialogue modal popup
function closeStoryModal() {
  if (storyModal) {
    storyModal.classList.add('hidden');
  }
}

// ==================== THEME MANAGEMENT ====================
const themeToggleCube = document.getElementById('theme-toggle-cube');
let isLightTheme = false;

// Initialize theme from localStorage
function initTheme() {
  try {
    localStorage.removeItem('nihongo_theme');
  } catch (e) {}
  isLightTheme = false;
  document.body.classList.remove('light-theme');
  syncCubeRotation();
}

// Sync cube 3D rotation based on active theme state
function syncCubeRotation() {
  if (!themeToggleCube) return;
  const cube = themeToggleCube.querySelector('.cube');
  if (cube) {
    cube.style.transform = isLightTheme 
      ? 'rotateX(45deg) rotateY(225deg)' 
      : 'rotateX(-22deg) rotateY(45deg)';
  }
}

// Toggle light/dark themes with sky/cloud transitions
function toggleTheme() {
  const nextIsLight = !isLightTheme;
  
  if (nextIsLight) {
    const overlay = document.getElementById('sky-transition');
    if (overlay) {
      // Reset overlay states
      overlay.classList.remove('hidden', 'active', 'fade-to-white');
      
      // Force layout repaint
      void overlay.offsetWidth;
      
      // Step 1: Slide in clouds on blue sky
      overlay.classList.add('active');
      
      // Step 2: Swap the theme underneath while covered
      setTimeout(() => {
        isLightTheme = true;
        document.body.classList.add('light-theme');
        syncCubeRotation();
        try {
          localStorage.setItem('nihongo_theme', 'light');
        } catch (e) {}
      }, 400);
      
      // Step 3: Bleach sky and clouds to white
      setTimeout(() => {
        overlay.classList.add('fade-to-white');
      }, 700);
      
      // Step 4: Fade out the overlay to reveal the new theme
      setTimeout(() => {
        overlay.classList.remove('active');
      }, 1100);
      
      // Step 5: Put overlay back to hidden
      setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.classList.remove('fade-to-white');
      }, 1500);
    } else {
      isLightTheme = true;
      document.body.classList.add('light-theme');
      syncCubeRotation();
      try { localStorage.setItem('nihongo_theme', 'light'); } catch (e) {}
    }
  } else {
    // Standard quick toggle to Dark Mode
    isLightTheme = false;
    document.body.classList.remove('light-theme');
    syncCubeRotation();
    try {
      localStorage.setItem('nihongo_theme', 'dark');
    } catch (e) {}
  }
}

// Attach click listener
if (themeToggleCube) {
  themeToggleCube.addEventListener('click', toggleTheme);
}

// Make functions globally available for click handlers
window.startStoryChapter = startStoryChapter;
window.showStoryDialogue = showStoryDialogue;
window.toggleTheme = toggleTheme;

// Run application
initTheme();
init();
