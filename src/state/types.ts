import type { Card } from '../data/types';

export type CardId = number | string;
export type { Card };

export type FilterMode = 'all' | 'learning' | 'mastered';
export type LevelFilter = 'all' | 'N5' | 'N4';
export type PracticeMode = 'flashcard' | 'typing';
export type ActiveDeck = 'vocabulary' | 'hiragana' | 'katakana' | 'story';
export type KanaTab = 'basic' | 'voiced' | 'combos';

export interface AppState {
  cards: Card[];
  displayOrder: number[];
  currentIndex: number;
  isFlipped: boolean;
  isShuffled: boolean;
  filterMode: FilterMode;
  levelFilter: LevelFilter;
  practiceMode: PracticeMode;
  hasSubmittedAnswer: boolean;
  showRomaji: boolean;
  activeDeck: ActiveDeck;

  masteredCardIds: Set<CardId>;

  isStoryModeActive: boolean;
  activeStoryChapterId: number | null;
  storyUnlockedChapter: number;
  storyMasteredIds: Set<CardId>;

  activeHiraganaTab: KanaTab;
  activeKatakanaTab: KanaTab;

  selectedVocabTypes: string[];
  selectedVocabTopics: string[];

  isLightTheme: boolean;
}
