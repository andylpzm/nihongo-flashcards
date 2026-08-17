// Guards on the generated kanji deck. src/data/kanji.json is machine-built by
// scripts/build-kanji.mjs from KANJIDIC2, so these assert the shape the UI
// relies on rather than any hand-authored content.

import { describe, it, expect } from 'vitest';
import kanji from './kanji.json';
import { isKanjiCard, isVocabCard } from './types';
import type { KanjiCard } from './types';

const cards = kanji as KanjiCard[];

describe('kanji deck', () => {
  it('covers the JLPT N5 and N4 character sets', () => {
    expect(cards.filter((c) => c.level === 'N5')).toHaveLength(80);
    expect(cards.filter((c) => c.level === 'N4')).toHaveLength(170);
  });

  it('has unique ids and single-character glyphs', () => {
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
    for (const c of cards) expect([...c.kana]).toHaveLength(1);
  });

  it('gives every card a meaning, a stroke count and at least one reading', () => {
    for (const c of cards) {
      expect(c.meanings.length).toBeGreaterThan(0);
      expect(c.strokes).toBeGreaterThan(0);
      expect(c.on.length + c.kun.length).toBeGreaterThan(0);
    }
  });

  it('strips KANJIDIC prefix/suffix notation from readings', () => {
    // "-り" means "only as a suffix" - dictionary shorthand a learner cannot
    // act on, so the build drops those entries entirely.
    for (const c of cards) {
      for (const r of [...c.on, ...c.kun]) expect(r).not.toContain('-');
    }
  });

  it('is matched by isKanjiCard but not by isVocabCard', () => {
    // The vocabulary filters key off isVocabCard(); a kanji card leaking
    // through would be filtered by level/type/topic it does not carry.
    for (const c of cards) {
      expect(isKanjiCard(c)).toBe(true);
      expect(isVocabCard(c)).toBe(false);
    }
  });

  it('gives example words a reading and a meaning when present', () => {
    for (const c of cards) {
      expect(c.examples.length).toBeLessThanOrEqual(3);
      for (const e of c.examples) {
        expect(e.word).toContain(c.kana);
        expect(e.reading.length).toBeGreaterThan(0);
        expect(e.meaning.length).toBeGreaterThan(0);
      }
    }
  });
});
