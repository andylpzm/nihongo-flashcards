// Kanji chart + detail sheet. The grid mirrors the kana chart (same
// .kana-grid-cell), and the sheet reuses createModal() so it inherits the focus
// trap, Escape handling and mobile bottom-sheet behaviour.

import { loadKanji } from '../data/loader';
import type { KanjiCard } from '../data/types';
import { state } from '../state/store';
import { readingRow } from './kanjiReadings';
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

export function openKanjiSheet(card: KanjiCard): void {
  const modal = ensureSheet();
  const body = document.getElementById('kanji-sheet-body');
  const title = document.getElementById('kanji-sheet-title');
  if (!modal || !body) return;

  // Separated by spacing rather than a dash: an em dash sitting next to a
  // glyph reads as 一 (one) on a screen full of kanji.
  if (title) {
    title.innerHTML = `<span class="kanji-title-glyph" lang="ja">${card.kana}</span><span class="kanji-title-meaning">${card.meanings[0] ?? ''}</span>`;
  }

  body.innerHTML = `
    <div class="kanji-sheet-hero">
      <div class="kanji-glyph" lang="ja">${card.kana}</div>
      <div class="kanji-sheet-meaning">${card.meanings.join(', ')}</div>
      <div class="kanji-sheet-meta">${card.level} · ${card.strokes} stroke${card.strokes === 1 ? '' : 's'}</div>
    </div>
    <div class="kanji-readings">
      ${readingRow('On', card.on)}
      ${readingRow('Kun', card.kun)}
    </div>
    ${
      card.examples.length
        ? `<div class="kanji-examples">${card.examples
            .map(
              (e) =>
                `<div class="kanji-example"><span class="kanji-example-word" lang="ja">${e.word}</span><span class="kanji-example-reading" lang="ja">${e.reading}</span><span class="kanji-example-meaning">${e.meaning}</span></div>`
            )
            .join('')}</div>`
        : ''
    }
  `;
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
    cell.addEventListener('click', () => openKanjiSheet(card));
    cell.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openKanjiSheet(card);
      }
    });
    container.appendChild(cell);
  }
}
