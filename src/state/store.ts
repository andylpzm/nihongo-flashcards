import type { AppState } from './types';
import { loadStoryUnlockedChapter, loadFilters } from './persistence';

const DEFAULT_VOCAB_TYPES = ['nouns', 'verbs', 'adjectives', 'misc'];
const DEFAULT_VOCAB_TOPICS = [
  'numbers',
  'calendar',
  'time',
  'body',
  'food',
  'family',
  'school',
  'travel',
  'weather',
  'other',
];

const savedFilters = loadFilters();

export const state: AppState = {
  // Populated asynchronously by loadDeck('vocabulary') during boot - the
  // shell renders before the (216KB) vocab data has to be ready.
  cards: [],
  displayOrder: [],
  currentIndex: 0,
  isFlipped: false,
  filterMode: savedFilters.filterMode ?? 'all',
  levelFilter: savedFilters.levelFilter ?? 'all',
  showRomaji: true,
  activeDeck: 'vocabulary',

  isStoryModeActive: false,
  activeStoryChapterId: null,
  storyUnlockedChapter: loadStoryUnlockedChapter(),

  activeHiraganaTab: 'basic',
  activeKatakanaTab: 'basic',
  activeKanjiLevel: 'N5',

  selectedVocabTypes: savedFilters.selectedVocabTypes ?? DEFAULT_VOCAB_TYPES,
  selectedVocabTopics: savedFilters.selectedVocabTopics ?? DEFAULT_VOCAB_TOPICS,

  isLightTheme: false,

  studyMode: 'session',
};

// Lightweight pub/sub, available for modules that want to react to state
// changes rather than being called imperatively after each mutation.

