// Kanji chart + detail sheet. The grid mirrors the kana chart (same
// .kana-grid-cell), and the sheet reuses createModal() so it inherits the focus
// trap, Escape handling and mobile bottom-sheet behaviour.

import { loadKanji, loadKanjiDetail } from '../data/loader';
import type { KanjiCard, KanjiDetail } from '../data/types';
import { getNote, setNote } from '../state/kanjiNotes';
import { state } from '../state/store';
import { readingHtml } from './kanjiReadings';
import { createModal, type ModalController } from './modal';

let sheet: ModalController | null = null;

function ensureSheet(): ModalController | null {
  if (sheet) return sheet;
  const overlay = document.getElementById('kanji-modal-overlay');
  if (!overlay) return null;
  sheet = createModal(overlay);
  document.getElementById('btn-close-kanji')?.addEventListener('click', () => sheet?.close());
  return sheet;
}

/** "age 6" for a first-year kanji - the school grade as the age japanese kids
 * learn it, which means something to chris where "grade 1" did not. grade 9
 * and 10 are name-only kanji, never taught. */
export function learnedAt(grade: number | null): string | null {
  if (grade !== null && grade >= 1 && grade <= 6) return `age ${grade + 5}`;
  if (grade === 8) return 'age 12–15';
  return null;
}

const BOX = 'viewBox="0 0 109 109"';

// where the pen goes down - kanjivg paths all open with an absolute M x,y
function startOf(d: string): [number, number] {
  const m = /^M\s*(-?[\d.]+)[\s,]+(-?[\d.]+)/.exec(d);
  return m ? [Number(m[1]), Number(m[2])] : [0, 0];
}

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

function bigKanji(d: KanjiDetail): string {
  const red = new Set(d.radicalStrokes);
  const paths = (cls: (i: number) => string) =>
    d.strokes.map((p, i) => `<path class="${cls(i)}" d="${p}"/>`).join('');
  return `<svg ${BOX} aria-hidden="true">
    <g class="ks-ghost">${paths(() => '')}</g>
    <g class="ks-ink">${paths((i) => (red.has(i) ? 'is-radical' : ''))}</g>
    <circle class="ks-dot" r="4.2"/>
  </svg>`;
}

// one box per stroke: the strokes so far in grey, the new one dark, a red dot
// where it starts. up to 8 in a row, two rows beyond that
function strokeStrip(d: KanjiDetail): string {
  const n = d.strokes.length;
  const cols = n <= 8 ? n : Math.ceil(n / 2);
  const cells = d.strokes.map((_, i) => {
    const [x, y] = startOf(d.strokes[i]!);
    const done = d.strokes
      .slice(0, i + 1)
      .map((p, j) => `<path class="${j === i ? 'is-current' : ''}" d="${p}"/>`)
      .join('');
    return `<div class="ks-sq ks-cell"><svg ${BOX} aria-hidden="true">${done}<circle cx="${x}" cy="${y}" r="6.5"/></svg><span>${i + 1}</span></div>`;
  });
  while (cells.length % cols) cells.push('<div class="ks-cell is-empty"></div>');
  const rows = cells.length / cols;
  const edged = cells.map((c, i) => {
    const edges = `${i % cols === cols - 1 ? ' is-last-col' : ''}${Math.floor(i / cols) === rows - 1 ? ' is-last-row' : ''}`;
    return edges ? c.replace('class="', `class="${edges.trim()} `) : c;
  });
  // a short kanji keeps eighth-width boxes rather than stretching two across the sheet
  const width = n < 8 ? `width:${(n / 8) * 100}%;` : '';
  return `<div class="ks-strip" style="grid-template-columns:repeat(${cols},minmax(0,1fr));${width}">${edged.join('')}</div>`;
}

function stat(label: string, value: string | null): string {
  return value === null ? '' : `<div class="ks-stat"><span class="ks-label">${label}</span><span>${value}</span></div>`;
}

function chips(label: string, values: string[], cls: string): string {
  if (!values.length) return '';
  return `<div class="ks-chip-row"><span class="ks-label">${label}</span>${values
    .map((v) => `<span class="ks-chip ${cls}" lang="ja">${readingHtml(v)}</span>`)
    .join('')}</div>`;
}

function shape(s: { char: string; meaning: string | null }, radical: string | undefined): string {
  return `<span class="ks-shape${s.char === radical ? ' is-radical' : ''}" lang="ja">${s.char}</span>`;
}

function sheetHtml(card: KanjiCard, d: KanjiDetail): string {
  const rad = d.radical;
  const colouredRadical = d.radicalStrokes.length ? rad?.char : undefined;
  return `
    <div class="ks-top">
      <div class="ks-glyph-col">
        <div class="ks-sq ks-glyph" role="button" tabindex="0" aria-label="Draw ${card.kana} stroke by stroke">${bigKanji(d)}</div>
        <span class="ks-tip"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>Tap to draw</span>
      </div>
      <div class="ks-stats">
        ${stat('Strokes', String(d.strokes.length))}
        ${stat('JLPT', card.level)}
        ${stat('Frequency', d.freq === null ? null : `#${d.freq}`)}
        ${stat('Learned at', learnedAt(d.grade))}
      </div>
    </div>
    <div class="ks-label ks-section">Stroke order</div>
    ${strokeStrip(d)}
    <div class="ks-row"><span class="ks-label">Meaning</span><span class="ks-meaning">${card.meanings.join(', ')}</span></div>
    ${
      rad
        ? `<div class="ks-row"><span class="ks-label">Radical</span>${shape(rad, colouredRadical)}<span>${rad.meaning ?? ''}</span></div>`
        : ''
    }
    ${
      d.parts.length
        ? `<div class="ks-row"><span class="ks-label">Parts</span><span class="ks-shapes">${d.parts
            .map((p) => shape(p, colouredRadical))
            .join('')}</span><span class="ks-muted">${d.parts.map((p) => p.meaning).join(' + ')}</span></div>`
        : ''
    }
    <div class="ks-readings">
      ${chips('On', card.on, 'is-on')}
      ${chips('Kun', card.kun, 'is-kun')}
      ${chips('Names', d.names, 'is-name')}
    </div>
    ${
      card.examples.length
        ? `<div class="ks-label ks-section">Words</div><div class="kanji-examples">${card.examples
            .map(
              (e) =>
                `<div class="kanji-example"><span class="kanji-example-word" lang="ja">${e.word}</span><span class="kanji-example-reading" lang="ja">${e.reading}</span><span class="kanji-example-meaning">${e.meaning}</span></div>`
            )
            .join('')}</div>`
        : ''
    }
    <div class="ks-note" id="ks-note"></div>
  `;
}

// the tracing-paper draw: the kanji goes grey, each stroke inks in from a red
// dot, then the whole thing comes back. only on a tap.
function wireDrawing(root: HTMLElement): void {
  const glyph = root.querySelector<HTMLElement>('.ks-glyph');
  const ink = Array.from(root.querySelectorAll<SVGPathElement>('.ks-ink path'));
  const dot = root.querySelector<SVGCircleElement>('.ks-dot');
  const cells = Array.from(root.querySelectorAll<HTMLElement>('.ks-cell:not(.is-empty)'));
  if (!glyph || !dot) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
  let running = false;

  const play = async (): Promise<void> => {
    if (running || reduced || !glyph.isConnected) return;
    running = true;
    glyph.classList.add('is-drawing');
    for (const p of ink) {
      const len = p.getTotalLength();
      p.style.transition = 'none';
      p.style.strokeDasharray = `${len}`;
      p.style.strokeDashoffset = `${len}`;
    }
    await wait(300);
    for (let i = 0; i < ink.length; i++) {
      // the sheet may have closed or moved on to another kanji mid-draw
      if (!glyph.isConnected) return;
      const p = ink[i]!;
      const secs = Math.max(0.4, p.getTotalLength() / 110);
      cells.forEach((c, k) => c.classList.toggle('is-now', k === i));
      const [x, y] = startOf(p.getAttribute('d') ?? '');
      dot.setAttribute('cx', String(x));
      dot.setAttribute('cy', String(y));
      dot.classList.add('is-shown');
      await wait(220);
      p.style.transition = `stroke-dashoffset ${secs}s ease-in-out`;
      p.style.strokeDashoffset = '0';
      await wait(secs * 350);
      dot.classList.remove('is-shown');
      await wait(secs * 650 + 40);
    }
    cells.forEach((c) => c.classList.remove('is-now'));
    await wait(300);
    glyph.classList.remove('is-drawing');
    running = false;
  };

  glyph.addEventListener('click', () => void play());
  glyph.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      void play();
    }
  });
}

const noteDate = (at: number): string => new Date(at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

// saved as he types, so closing the sheet mid-sentence loses nothing
function wireNote(slot: HTMLElement, kanji: string): void {
  const show = (): void => {
    const note = getNote(kanji);
    slot.innerHTML = `<div class="ks-note-head"><span class="ks-label">Your note</span>${
      note ? `<span class="ks-muted">${noteDate(note.at)}</span>` : ''
    }</div>${
      note
        ? `<div class="ks-note-text" role="button" tabindex="0">${escapeHtml(note.text)}</div>`
        : '<button class="ks-note-empty">Add a note, like a way to remember it</button>'
    }`;
    const open = slot.querySelector<HTMLElement>('.ks-note-text, .ks-note-empty');
    // these taps swap the element they land on, and the sheet's outside-tap
    // check would then find the target gone and close the sheet
    open?.addEventListener('click', (e) => {
      e.stopPropagation();
      edit();
    });
    open?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        edit();
      }
    });
  };
  const edit = (): void => {
    slot.innerHTML = `<div class="ks-note-head"><span class="ks-label">Your note</span></div>
      <textarea class="ks-note-input" rows="3" aria-label="Your note on ${kanji}"></textarea>
      <div class="ks-note-foot"><span class="ks-muted">Saved on your phone and in backups</span><button class="ks-note-done">Done</button></div>`;
    const input = slot.querySelector<HTMLTextAreaElement>('textarea')!;
    input.value = getNote(kanji)?.text ?? '';
    const grow = (): void => {
      input.style.height = 'auto';
      input.style.height = `${input.scrollHeight}px`;
    };
    input.addEventListener('input', () => {
      setNote(kanji, input.value);
      grow();
    });
    slot.querySelector('.ks-note-done')?.addEventListener('click', (e) => {
      e.stopPropagation();
      show();
    });
    grow();
    input.focus();
  };
  show();
}

export async function openKanjiSheet(card: KanjiCard): Promise<void> {
  const modal = ensureSheet();
  const body = document.getElementById('kanji-sheet-body');
  const title = document.getElementById('kanji-sheet-title');
  if (!modal || !body) return;
  const detail = (await loadKanjiDetail())[card.kana];
  if (!detail) return;

  // Separated by spacing rather than a dash: an em dash sitting next to a
  // glyph reads as 一 (one) on a screen full of kanji.
  if (title) {
    title.innerHTML = `<span class="kanji-title-glyph" lang="ja">${card.kana}</span><span class="kanji-title-meaning">${card.meanings[0] ?? ''}</span>`;
  }

  body.innerHTML = sheetHtml(card, detail);
  wireDrawing(body);
  const note = body.querySelector<HTMLElement>('#ks-note');
  if (note) wireNote(note, card.kana);
  modal.open();
}

/** Render the chart for the level currently selected by the N5/N4 tabs. */
export async function renderKanjiGrid(): Promise<void> {
  const container = document.getElementById('kanji-grid-container');
  if (!container) return;

  const all = await loadKanji();
  const cards = all.filter((c) => c.level === state.activeKanjiLevel);

  container.innerHTML = '';
  for (const card of cards) {
    const cell = document.createElement('div');
    cell.className = 'kana-grid-cell';
    cell.innerHTML = `<span class="kana-char" lang="ja">${card.kana}</span>`;
    cell.setAttribute('role', 'button');
    cell.tabIndex = 0;
    cell.setAttribute('aria-label', `${card.kana}, ${card.meanings.join(', ')}`);
    cell.addEventListener('click', () => void openKanjiSheet(card));
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        void openKanjiSheet(card);
      }
    });
    container.appendChild(cell);
  }
}
