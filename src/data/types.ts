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

/** Any card that can appear in state.cards, across all decks. */
/** A single kanji character. Note there is deliberately no `pos` field: that is
 * what keeps isVocabCard() false, so the vocabulary level/type/topic filters
 * skip these exactly as they skip kana. */
export interface KanjiCard {
  id: string;
  /** The character itself. Named `kana` so the existing card renderer needs no
   * special case for the front face. */
  kana: string;
  romaji: string;
  meanings: string[];
  level: Level;
  /** On'yomi - the reading used when the kanji appears in compounds. */
  on: string[];
  /** Kun'yomi - the reading used when it stands alone or takes okurigana. */
  kun: string[];
  strokes: number;
  /** Words from our own vocabulary deck that contain this kanji. */
  examples: { word: string; reading: string; meaning: string }[];
}

export type Card = VocabCard | KanaCard | KanjiCard;

export function isVocabCard(card: Card): card is VocabCard {
  return 'pos' in card;
}

export function isKanjiCard(card: Card): card is KanjiCard {
  return 'strokes' in card;
}
