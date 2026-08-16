export type Level = 'N5' | 'N4';

export type Pos =
  | 'noun'
  | 'verb'
  | 'i-adj'
  | 'na-adj'
  | 'adverb'
  | 'expression'
  | 'counter'
  | 'other';

export type Topic =
  | 'numbers'
  | 'calendar'
  | 'time'
  | 'body'
  | 'food'
  | 'family'
  | 'school'
  | 'travel'
  | 'weather'
  | 'other';

export interface VocabCard {
  id: number;
  kana: string;
  kanji?: string;
  romaji: string;
  meanings: string[];
  level: Level;
  pos: Pos;
  topics: Topic[];
  /** Kana reading shared with another card; set only for the ~40 duplicate readings. */
  homophoneGroup?: string;
  examples?: { jp: string; en: string }[];
}

export interface KanaCard {
  id: string;
  kana: string;
  romaji: string;
  meanings: string[];
}

export interface StoryDialogueLine {
  speaker: string;
  text: string;
}

export interface StoryChapter {
  id: number;
  title: string;
  description: string;
  deck: KanaCard[];
  dialogue: StoryDialogueLine[];
}

/** Any card that can appear in state.cards, across all decks. */
export type Card = VocabCard | KanaCard;

export function isVocabCard(card: Card): card is VocabCard {
  return 'pos' in card;
}
