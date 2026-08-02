import type { Card } from '../data/types';

export type CardId = number | string;
export type { Card };

export type FilterMode = 'all' | 'learning' | 'mastered';
export type LevelFilter = 'all' | 'N5' | 'N4';
export type PracticeMode = 'flashcard' | 'typing';
export type ActiveDeck = 'vocabulary' | 'hiragana' | 'katakana' | 'story';
export type KanaTab = 'basic' | 'voiced' | 'combos';
/** 'session' = SRS-scheduled review queue. 'browse' = free navigation over
 * the filtered deck, same as the old flashcard behavior; does not record
 * reviews or affect scheduling. */
export type StudyMode = 'session' | 'browse';

export interface AppState {
  cards: Card[];
  displayOrder: number[];
  currentIndex: number;
  isFlipped: boolean;
  filterMode: FilterMode;
  levelFilter: LevelFilter;
  practiceMode: PracticeMode;
  hasSubmittedAnswer: boolean;
  showRomaji: boolean;
  activeDeck: ActiveDeck;

  isStoryModeActive: boolean;
  activeStoryChapterId: number | null;
  storyUnlockedChapter: number;

  activeHiraganaTab: KanaTab;
  activeKatakanaTab: KanaTab;

  selectedVocabTypes: string[];
  selectedVocabTopics: string[];

  isLightTheme: boolean;

  studyMode: StudyMode;
}
