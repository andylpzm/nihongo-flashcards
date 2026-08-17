// Shared rendering for kanji readings, used by both the flashcard back and the
// chart's detail sheet so the two can never drift apart.

/**
 * KANJIDIC writes okurigana-bearing kun readings with a dot at the boundary:
 * `た.べる` means the 食 covers た and べる is written in kana. Printing the dot
 * raw looks like a typo, so the stem is rendered normally and the okurigana
 * tail in a dimmer weight.
 */
export function readingRow(label: string, values: string[]): string {
  if (values.length === 0) return '';
  const rendered = values
    .map((r) => {
      const dot = r.indexOf('.');
      if (dot === -1) return r;
      return `${r.slice(0, dot)}<span class="okurigana">${r.slice(dot + 1)}</span>`;
    })
    .join('・');
  return `<div class="kanji-reading-row"><span class="kanji-reading-label">${label}</span><span class="kanji-reading-values" lang="ja">${rendered}</span></div>`;
}
