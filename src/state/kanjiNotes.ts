// chris's own notes on a kanji. localStorage under the nihongo_ prefix, so
// they ride along in every backup without backup.ts knowing about them.

const KEY = 'nihongo_kanji_notes';

export interface KanjiNote {
  text: string;
  /** last edit, ms */
  at: number;
}

// typed loosely on purpose - a restored backup can carry anything in here
function readAll(): Record<string, Partial<KanjiNote> | undefined> {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed: unknown = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, Partial<KanjiNote>>) : {};
  } catch {
    return {};
  }
}

export function getNote(kanji: string): KanjiNote | null {
  const note = readAll()[kanji];
  if (!note || typeof note.text !== 'string' || !note.text.trim()) return null;
  return { text: note.text, at: typeof note.at === 'number' ? note.at : 0 };
}

/** an empty note removes the entry */
export function setNote(kanji: string, text: string, now = Date.now()): void {
  const all = readAll();
  if (text.trim()) all[kanji] = { text, at: now };
  else delete all[kanji];
  try {
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    // storage full or blocked - the note just doesn't stick
  }
}
