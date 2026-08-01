import type { AppState } from './types';
import {
  loadMasteredIds,
  loadStoryMasteredIds,
  loadStoryUnlockedChapter,
  loadFilters,
} from './persistence';

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
  isShuffled: true, // Enabled by default for endless shuffle study style
  filterMode: savedFilters.filterMode ?? 'all',
  levelFilter: savedFilters.levelFilter ?? 'all',
  practiceMode: 'flashcard',
  hasSubmittedAnswer: false,
  showRomaji: true,
  activeDeck: 'vocabulary',

  masteredCardIds: loadMasteredIds(),

  isStoryModeActive: false,
  activeStoryChapterId: null,
  storyUnlockedChapter: loadStoryUnlockedChapter(),
  storyMasteredIds: loadStoryMasteredIds(),

  activeHiraganaTab: 'basic',
  activeKatakanaTab: 'basic',

  selectedVocabTypes: savedFilters.selectedVocabTypes ?? DEFAULT_VOCAB_TYPES,
  selectedVocabTopics: savedFilters.selectedVocabTopics ?? DEFAULT_VOCAB_TOPICS,

  isLightTheme: false,
};

// Lightweight pub/sub, available for modules that want to react to state
// changes rather than being called imperatively after each mutation.
type Listener = (s: AppState) => void;
const listeners = new Set<Listener>();

export function subscribe(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function notify(): void {
  listeners.forEach((fn) => fn(state));
}
