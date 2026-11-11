import { describe, it, expect, beforeEach } from 'vitest';
import { getNote, setNote } from './kanjiNotes';

describe('kanji notes', () => {
  beforeEach(() => localStorage.clear());

  it('keeps a note with when it was written', () => {
    setNote('男', 'field + power', 1000);
    expect(getNote('男')).toEqual({ text: 'field + power', at: 1000 });
  });

  it('removes a note emptied out', () => {
    setNote('男', 'field + power');
    setNote('男', '   ');
    expect(getNote('男')).toBeNull();
  });

  it('lives under the backup prefix', () => {
    setNote('男', 'x');
    expect(Object.keys(localStorage).some((k) => k.startsWith('nihongo_'))).toBe(true);
  });
});
