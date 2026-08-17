// One-shot build for src/data/kanji.json (N5 + N4, 250 characters).
//
// Readings, meanings and stroke counts come from KANJIDIC2 (EDRDG, CC BY-SA
// 4.0), downloaded once and parsed locally - deliberately NOT via the
// kanjiapi.dev REST wrapper, which would be 250 requests to a free community
// service and would make this build depend on someone else's uptime.
//
// Example words are joined from our own src/data/vocab.json, so every example
// is a word the user is already studying rather than a generic one.
//
// Run: node scripts/build-kanji.mjs

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');
const outDir = join(here, 'out');
const KANJIDIC_URL = 'http://www.edrdg.org/kanjidic/kanjidic2.xml.gz';

// JLPT groupings. A list of which characters sit at each level is factual and
// widely published; no third-party editorial text is reproduced here.
const N5 =
  '人一日大年出本中子見国上分生行二間時気十女三前入小後長下学月何来話山高今書五名' +
  '金男外四先川東聞語九食八水天木六万白七円電父北車母半百土西読千校右南左友火毎雨休午';
const N4 =
  '言手自者事思会家的方地目場代私立物田体動社知理同心発作新世度明力意用主通文屋業持' +
  '道身不口多野考開教近以問正真味界無少海切重集員公画死安親強使朝題仕京足品着別音元' +
  '特風夜空有起運料楽色帰歩悪広店町住売待古始終計院送族映買病早質台室可建転医止字工' +
  '急図黒花英走青答紙歌注赤春館旅験写去研飲肉服銀茶究洋兄秋堂週習試夏弟鳥犬夕魚借飯' +
  '駅昼冬姉曜漢牛妹貸勉';

const MAX_MEANINGS = 3;
const MAX_READINGS = 3;
const MAX_EXAMPLES = 3;

function assert(cond, msg) {
  if (!cond) {
    console.error(`✗ ${msg}`);
    process.exit(1);
  }
}

assert([...N5].length === 80, `N5 should be 80 characters, got ${[...N5].length}`);
assert([...N4].length === 170, `N4 should be 170 characters, got ${[...N4].length}`);
assert(new Set([...N5]).size === 80, 'N5 contains duplicates');
assert(new Set([...N4]).size === 170, 'N4 contains duplicates');
assert([...N5].every((c) => !N4.includes(c)), 'N5 and N4 overlap');

const level = new Map();
for (const c of N5) level.set(c, 'N5');
for (const c of N4) level.set(c, 'N4');

// ---------------------------------------------------------------- KANJIDIC2
mkdirSync(outDir, { recursive: true });
const gzPath = join(outDir, 'kanjidic2.xml.gz');

if (!existsSync(gzPath)) {
  console.log(`Downloading ${KANJIDIC_URL} ...`);
  const res = await fetch(KANJIDIC_URL);
  assert(res.ok, `download failed: HTTP ${res.status}`);
  writeFileSync(gzPath, Buffer.from(await res.arrayBuffer()));
  console.log('  saved to scripts/out/ (re-runs are offline)');
} else {
  console.log('Using cached scripts/out/kanjidic2.xml.gz');
}

const xml = gunzipSync(readFileSync(gzPath)).toString('utf8');

const parsed = new Map();
for (const m of xml.matchAll(/<character>([\s\S]*?)<\/character>/g)) {
  const block = m[1];
  const lit = /<literal>(.)<\/literal>/.exec(block);
  if (!lit || !level.has(lit[1])) continue;
  const ch = lit[1];

  // KANJIDIC marks prefix/suffix-only readings with a leading or trailing
  // hyphen (人 carries "-り", "-と"). That is dictionary notation a beginner
  // cannot act on, so those entries are dropped rather than shown. The "."
  // in readings like "た.べる" is kept - it marks the okurigana boundary, and
  // the UI renders the tail in a dimmer weight instead of printing the dot.
  const readings = (type) =>
    [...block.matchAll(new RegExp(`<reading r_type="${type}">([^<]+)</reading>`, 'g'))]
      .map((r) => r[1])
      .filter((r) => !r.includes('-'))
      .slice(0, MAX_READINGS);

  // <meaning> with no m_lang attribute is the English gloss; others are
  // French/Spanish/Portuguese and must be skipped.
  const meanings = [...block.matchAll(/<meaning>([^<]+)<\/meaning>/g)]
    .map((r) => r[1])
    .slice(0, MAX_MEANINGS);

  const strokes = /<stroke_count>(\d+)<\/stroke_count>/.exec(block);

  parsed.set(ch, {
    meanings,
    on: readings('ja_on'),
    kun: readings('ja_kun'),
    strokes: strokes ? Number(strokes[1]) : 0,
  });
}

const missing = [...level.keys()].filter((c) => !parsed.has(c));
assert(missing.length === 0, `not found in KANJIDIC2: ${missing.join('')}`);

// ------------------------------------------------- examples from our vocab
const vocab = JSON.parse(readFileSync(join(root, 'src/data/vocab.json'), 'utf8'));
const examplesFor = new Map();
for (const card of vocab) {
  const kanji = card.kanji || '';
  for (const ch of new Set(kanji)) {
    if (!level.has(ch)) continue;
    if (!examplesFor.has(ch)) examplesFor.set(ch, []);
    examplesFor.get(ch).push({
      word: card.kanji,
      reading: card.kana,
      meaning: card.meanings[0],
    });
  }
}

// ------------------------------------------------------------------- emit
const cards = [];
for (const [ch, lvl] of level) {
  const d = parsed.get(ch);
  const examples = (examplesFor.get(ch) ?? [])
    // Shortest first: short words are the common, useful ones.
    .sort((a, b) => [...a.word].length - [...b.word].length)
    .slice(0, MAX_EXAMPLES);

  cards.push({
    id: `k-${ch}`,
    kana: ch, // named `kana` so the existing card renderer needs no branching
    romaji: (d.on[0] ?? d.kun[0] ?? '').replace(/\..*$/, ''),
    meanings: d.meanings,
    level: lvl,
    on: d.on,
    kun: d.kun,
    strokes: d.strokes,
    examples,
  });
}

assert(cards.length === 250, `expected 250 cards, got ${cards.length}`);
assert(
  cards.every((c) => c.meanings.length > 0),
  'some cards have no meanings'
);
assert(
  cards.every((c) => c.on.length > 0 || c.kun.length > 0),
  'some cards have no readings'
);

writeFileSync(join(root, 'src/data/kanji.json'), JSON.stringify(cards, null, 2) + '\n');

const noExamples = cards.filter((c) => c.examples.length === 0);
const report = [
  '# Kanji build report',
  '',
  `- cards: ${cards.length} (N5 ${cards.filter((c) => c.level === 'N5').length}, N4 ${cards.filter((c) => c.level === 'N4').length})`,
  `- with at least one example word from vocab.json: ${cards.length - noExamples.length}`,
  `- with no example word: ${noExamples.length} — ${noExamples.map((c) => c.kana).join('') || 'none'}`,
  '',
  'Readings and meanings: KANJIDIC2 © EDRDG, CC BY-SA 4.0.',
  '',
].join('\n');
writeFileSync(join(outDir, 'kanji-report.md'), report);

console.log(`✓ wrote src/data/kanji.json (${cards.length} cards)`);
console.log(`  no example word for ${noExamples.length}: ${noExamples.map((c) => c.kana).join('') || 'none'}`);
