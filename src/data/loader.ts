import type { VocabCard, KanaCard, KanjiCard, StoryChapter } from './types';

export interface KanaDataset {
  hiraganaAlphabet: KanaCard[];
  katakanaAlphabet: KanaCard[];
  hiraganaVoiced: KanaCard[];
  katakanaVoiced: KanaCard[];
  hiraganaCombos: KanaCard[];
  katakanaCombos: KanaCard[];
}

let vocabCache: VocabCard[] | null = null;
export async function loadVocab(): Promise<VocabCard[]> {
  if (!vocabCache) {
    const mod = await import('./vocab.json');
    vocabCache = mod.default as VocabCard[];
  }
  return vocabCache;
}

let kanaCache: KanaDataset | null = null;
export async function loadKana(): Promise<KanaDataset> {
  if (!kanaCache) {
    const mod = await import('./kana.json');
    kanaCache = mod.default as KanaDataset;
  }
  return kanaCache;
}

let storyCache: StoryChapter[] | null = null;
export async function loadStory(): Promise<StoryChapter[]> {
  if (!storyCache) {
    const mod = await import('./story.json');
    storyCache = mod.default as StoryChapter[];
  }
  return storyCache;
}

let kanjiCache: KanjiCard[] | null = null;
export async function loadKanji(): Promise<KanjiCard[]> {
  if (!kanjiCache) {
    const mod = await import('./kanji.json');
    kanjiCache = mod.default as KanjiCard[];
  }
  return kanjiCache;
}
