// guards on the generated kanji sheet data (scripts/build-kanji-detail.mjs)

import { describe, it, expect } from 'vitest';
import kanji from './kanji.json';
import detail from './kanjiDetail.json';
import type { KanjiCard, KanjiDetail } from './types';
import { learnedAt } from '../ui/kanjiGrid';

const cards = kanji as KanjiCard[];
const data = detail as Record<string, KanjiDetail>;

describe('kanji sheet data', () => {
  it('has an entry for every kanji in the deck', () => {
    for (const c of cards) expect(data[c.kana], c.kana).toBeDefined();
  });

  it('draws the same number of strokes the deck counts', () => {
    for (const c of cards) expect(data[c.kana]!.strokes, c.kana).toHaveLength(c.strokes);
  });

  it('only paths that start with a pen-down point', () => {
    for (const d of Object.values(data)) for (const p of d.strokes) expect(p).toMatch(/^M\s*-?[\d.]+[\s,]+-?[\d.]+/);
  });

  it('colours only strokes that exist, never the whole kanji', () => {
    for (const [ch, d] of Object.entries(data)) {
      for (const i of d.radicalStrokes) expect(i, ch).toBeLessThan(d.strokes.length);
      expect(d.radicalStrokes.length, ch).toBeLessThan(d.strokes.length);
    }
  });

  it('uses regular kanji for shapes, not radical-only forms a phone draws thin', () => {
    for (const [ch, d] of Object.entries(data)) {
      for (const s of [d.radical, ...d.parts]) if (s) expect(s.char, ch).not.toMatch(/[⺀-⿟]/u);
    }
  });

  it('names every part it shows, and shows two or none', () => {
    for (const [ch, d] of Object.entries(data)) {
      expect(d.parts.length === 0 || d.parts.length >= 2, ch).toBe(true);
      for (const p of d.parts) expect(p.meaning, `${ch} ${p.char}`).toBeTruthy();
    }
  });
});

describe('learnedAt', () => {
  it('turns a school grade into the age it is taught', () => {
    expect(learnedAt(1)).toBe('age 6');
    expect(learnedAt(6)).toBe('age 11');
    expect(learnedAt(8)).toBe('age 12–15');
  });

  it('hides name-only and unknown grades', () => {
    expect(learnedAt(9)).toBeNull();
    expect(learnedAt(null)).toBeNull();
  });
});
