import type { Card } from '../data/types';

export type CardId = number | string;
export type { Card };

export type FilterMode = 'all' | 'learning' | 'mastered';
export type LevelFilter = 'all' | 'N5' | 'N4';
export type ActiveDeck = 'vocabulary' | 'hiragana' | 'katakana' | 'kanji';
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
  showRomaji: boolean;
  activeDeck: ActiveDeck;

  activeHiraganaTab: KanaTab;
  activeKatakanaTab: KanaTab;
  activeKanjiLevel: 'N5' | 'N4';

  selectedVocabTypes: string[];
  selectedVocabTopics: string[];

  isLightTheme: boolean;

  studyMode: StudyMode;
}
