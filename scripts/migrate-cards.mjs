// One-shot migration: old notes-string + runtime-classified cards.js data
// -> structured src/data/vocab.json / kana.json / story.json.
//
// Kept in the repo for reproducibility, but this is not meant to be re-run
// routinely — once vocab.json exists and has been hand-corrected (Phase 2.3),
// it is the source of truth, not this script's output.
//
// Run with: npx tsx scripts/migrate-cards.mjs

import { writeFileSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import path from 'path';

import { initialCards } from '../src/data/vocab.ts';
import {
  hiraganaAlphabet,
  katakanaAlphabet,
  hiraganaVoiced,
  katakanaVoiced,
  hiraganaCombos,
  katakanaCombos,
} from '../src/data/kana.ts';
import { storyChapters } from '../src/data/story.ts';
import { getWordType, getWordTopic } from '../src/data/classify.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, '../src/data');
const outDir = path.join(__dirname, 'out');
mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------------------
// 1-3. Parse notes, split meanings
// ---------------------------------------------------------------------------

function parseNotes(notes) {
  const kanjiMatch = notes.match(/Kanji:\s*([^|]+?)\s*(?:\||$)/);
  const levelMatch = notes.match(/Level:\s*(N\d)/);
  const kanji = kanjiMatch ? kanjiMatch[1].trim() : undefined;
  const level = levelMatch ? levelMatch[1] : undefined;

  let residual = notes;
  if (kanjiMatch) residual = residual.replace(kanjiMatch[0], '');
  if (levelMatch) residual = residual.replace(/Level:\s*N\d\s*\|?\s*/, '');
  residual = residual.trim();

  return { kanji, level, residual };
}

// ---------------------------------------------------------------------------
// Old -> new pos mapping. The old classifier only had 4 buckets
// (nouns/verbs/adjectives/misc); the new schema has 8. This seed is
// necessarily approximate for the old "misc" bucket - Phase 2.3 hand-corrects it.
// ---------------------------------------------------------------------------

const ADVERB_KEYWORDS = [
  'very', 'little', 'slowly', 'gradually', 'together', 'sometimes', 'often',
  'always', 'never', 'already', 'yet', 'early', 'late', 'soon',
];
const GREETING_KANA = [
  'はい', 'いいえ', 'ありがとう', 'すみません', 'ごめんなさい', 'はじめまして',
  'ただいま', 'おかえり', 'いってきます', 'いってらっしゃい',
];

function seedPos(oldType, card) {
  const english = (card.english || '').toLowerCase();
  const notes = (card.notes || '').toLowerCase();
  const hiragana = card.hiragana || '';
  const words = english.replace(/[?,.!();/]/g, ' ').split(/\s+/).filter(Boolean);

  if (oldType === 'nouns') return 'noun';
  if (oldType === 'verbs') return 'verb';
  if (oldType === 'adjectives') {
    return hiragana.endsWith('い') ? 'i-adj' : 'na-adj';
  }

  // oldType === 'misc'
  const isCounter =
    hiragana.startsWith('〜') || notes.includes('counter') || english.includes('counter');
  if (isCounter) return 'counter';

  const isAdverb = ADVERB_KEYWORDS.some((kw) => words.includes(kw));
  if (isAdverb) return 'adverb';

  const isExpression =
    notes.includes('greeting') ||
    notes.includes('phrase') ||
    notes.includes('expression') ||
    GREETING_KANA.includes(hiragana) ||
    english.includes('!');
  if (isExpression) return 'expression';

  return 'other';
}

// ---------------------------------------------------------------------------
// 4-5. Build structured vocab cards + homophone detection
// ---------------------------------------------------------------------------

const vocabCards = initialCards.map((card) => {
  const { kanji, level, residual } = parseNotes(card.notes);
  if (residual) {
    console.warn(`[residual notes] id=${card.id}: "${residual}"`);
  }
  if (!level) {
    console.warn(`[missing level] id=${card.id}`);
  }

  const oldType = getWordType(card);
  const oldTopic = getWordTopic(card);

  return {
    id: card.id,
    kana: card.hiragana,
    ...(kanji ? { kanji } : {}),
    romaji: card.romaji,
    meanings: card.english.split('/').map((s) => s.trim()),
    level: level ?? 'N5',
    pos: seedPos(oldType, card),
    topics: [oldTopic],
  };
});

// Homophone detection: group by kana reading
const byKana = new Map();
vocabCards.forEach((c) => {
  if (!byKana.has(c.kana)) byKana.set(c.kana, []);
  byKana.get(c.kana).push(c);
});

const homophoneGroups = [];
for (const [kana, group] of byKana) {
  if (group.length > 1) {
    homophoneGroups.push({ kana, cards: group });
    group.forEach((c) => {
      c.homophoneGroup = kana;
      c.hint = c.topics[0];
    });
  }
}

// ---------------------------------------------------------------------------
// 6. Emit vocab.json + report.md
// ---------------------------------------------------------------------------

writeFileSync(path.join(dataDir, 'vocab.json'), JSON.stringify(vocabCards, null, 2) + '\n');

const noKanji = vocabCards.filter((c) => !c.kanji);
const fellThroughToOther = vocabCards.filter((c) => c.pos === 'other');
const topicOther = vocabCards.filter((c) => c.topics.includes('other'));

const reportLines = [];
reportLines.push('# Phase 2 migration report\n');
reportLines.push(`Total cards: ${vocabCards.length}\n`);

reportLines.push(`## Cards with no kanji (${noKanji.length})\n`);
reportLines.push(
  'These are likely katakana loanwords or kana-only words - verify no kanji actually exists.\n'
);
noKanji.forEach((c) => reportLines.push(`- ${c.id}: ${c.kana} (${c.meanings.join(', ')})`));
reportLines.push('');

reportLines.push(`## pos: 'other' (${fellThroughToOther.length})\n`);
reportLines.push('Old classifier could not confidently place these - needs a real pos.\n');
fellThroughToOther.forEach((c) =>
  reportLines.push(`- ${c.id}: ${c.kana} / ${c.meanings.join(', ')}`)
);
reportLines.push('');

reportLines.push(`## topics includes 'other' (${topicOther.length})\n`);
topicOther.forEach((c) => reportLines.push(`- ${c.id}: ${c.kana} / ${c.meanings.join(', ')}`));
reportLines.push('');

reportLines.push(`## Homophone groups (${homophoneGroups.length})\n`);
reportLines.push('Every card in these groups needs a real, distinguishing `hint`.\n');
homophoneGroups.forEach((g) => {
  reportLines.push(`### ${g.kana}`);
  g.cards.forEach((c) =>
    reportLines.push(`- ${c.id}: ${c.meanings.join(', ')} (seeded hint: "${c.hint}")`)
  );
  reportLines.push('');
});

writeFileSync(path.join(outDir, 'report.md'), reportLines.join('\n'));

// ---------------------------------------------------------------------------
// Kana + story decks -> same schema shape
// ---------------------------------------------------------------------------

function toKanaCard(c) {
  return {
    id: c.id,
    kana: c.hiragana,
    romaji: c.romaji,
    meanings: [c.english],
  };
}

const kanaOut = {
  hiraganaAlphabet: hiraganaAlphabet.map(toKanaCard),
  katakanaAlphabet: katakanaAlphabet.map(toKanaCard),
  hiraganaVoiced: hiraganaVoiced.map(toKanaCard),
  katakanaVoiced: katakanaVoiced.map(toKanaCard),
  hiraganaCombos: hiraganaCombos.map(toKanaCard),
  katakanaCombos: katakanaCombos.map(toKanaCard),
};
writeFileSync(path.join(dataDir, 'kana.json'), JSON.stringify(kanaOut, null, 2) + '\n');

const storyOut = storyChapters.map((chapter) => ({
  id: chapter.id,
  title: chapter.title,
  description: chapter.description,
  deck: chapter.deck.map(toKanaCard),
  dialogue: chapter.dialogue,
}));
writeFileSync(path.join(dataDir, 'story.json'), JSON.stringify(storyOut, null, 2) + '\n');

console.log(`\nWrote ${vocabCards.length} vocab cards, ${homophoneGroups.length} homophone groups.`);
console.log(`No kanji: ${noKanji.length}, pos=other: ${fellThroughToOther.length}, topic=other: ${topicOther.length}`);
console.log(`Report: scripts/out/report.md`);
