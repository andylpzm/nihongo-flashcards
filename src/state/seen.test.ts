import { describe, it, expect } from 'vitest';
import { coerce, hasSeen, type Profile } from './profile';

// the frosted reveal asks one question per picture: has this been opened? it
// used to be answered by a single high-water index, and these guard the change
// to a per-picture list - including that the old form still answers correctly,
// because getting it wrong asks someone to unwrap pictures they already saw.

const withSeen = (raw: unknown): Profile => coerce(raw);

describe('seen pictures', () => {
  it('starts empty', () => {
    const p = withSeen({});
    expect(p.seenPictures).toEqual([]);
    expect(hasSeen(p, 'ch-001', 1)).toBe(false);
  });

  it('remembers a picture by id, whatever its position', () => {
    const p = withSeen({ seenPictures: ['ch-014', 'bonus-01'] });
    expect(hasSeen(p, 'ch-014', 14)).toBe(true);
    expect(hasSeen(p, 'bonus-01', 302)).toBe(true);
    expect(hasSeen(p, 'ch-013', 13)).toBe(false);
  });

  it('can express a gap - the case the old single index could not', () => {
    // 12 and 14 opened, 13 not. this is the normal shape after several unlock
    // at once and get opened out of order.
    const p = withSeen({ seenPictures: ['ch-012', 'ch-014'] });
    expect(hasSeen(p, 'ch-012', 12)).toBe(true);
    expect(hasSeen(p, 'ch-013', 13)).toBe(false);
    expect(hasSeen(p, 'ch-014', 14)).toBe(true);
  });

  it('carries the old seenUnlocks index across', () => {
    // a profile written before the reveal: "the first 20 were seen". their ids
    // are not recorded, so the index has to keep answering for them.
    const p = withSeen({ seenUnlocks: 20 });
    expect(hasSeen(p, 'ch-001', 1)).toBe(true);
    expect(hasSeen(p, 'ch-020', 20)).toBe(true);
    expect(hasSeen(p, 'ch-021', 21)).toBe(false);
  });

  it('lets new ids sit alongside a migrated index', () => {
    const p = withSeen({ seenUnlocks: 5, seenPictures: undefined });
    const later = withSeen({ ...p, seenPictures: [...p.seenPictures, 'ch-100'] });
    expect(hasSeen(later, 'ch-003', 3)).toBe(true);
    expect(hasSeen(later, 'ch-100', 100)).toBe(true);
    expect(hasSeen(later, 'ch-099', 99)).toBe(false);
  });

  it('does not treat an unknown position as seen', () => {
    // index 0 means "position unknown". with a high water of 0 it used to
    // satisfy `index <= high` and every arc payoff came back already-seen.
    const p = withSeen({});
    expect(hasSeen(p, 'regulars-arc', 0)).toBe(false);
  });

  it('ignores junk in the stored list rather than throwing', () => {
    const p = withSeen({ seenPictures: ['ch-002', 7, null, { id: 'x' }] });
    expect(p.seenPictures).toEqual(['ch-002']);
    expect(hasSeen(p, 'ch-002', 2)).toBe(true);
  });
});
