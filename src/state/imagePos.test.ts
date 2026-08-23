import { describe, it, expect } from 'vitest';
import { coverScale, placement, cropRect, coercePos, DEFAULT_POS, MAX_SCALE } from './imagePos';

const BANNER = { w: 359, h: 270 };
const AVATAR = { w: 64, h: 64 };

describe('coverScale', () => {
  it('needs no zoom when the picture is wider than the frame', () => {
    // 800x583 into 359x270: slightly wider than the frame, so 1 is enough
    expect(coverScale(800, 583, BANNER.w, BANNER.h)).toBeCloseTo(1.0, 1);
  });

  it('needs no zoom for a tall picture in a wide frame either', () => {
    // 548x800 into 359x270 already overflows vertically at scale 1
    expect(coverScale(548, 800, BANNER.w, BANNER.h)).toBe(1);
  });

  it('zooms a wide picture until it covers a square frame', () => {
    // this is the case that actually needs it - a fixed default would crop wrong
    const s = coverScale(800, 583, AVATAR.w, AVATAR.h);
    expect(s).toBeGreaterThan(1.3);
    const p = placement({ scale: s, ox: 0, oy: 0 }, 800, 583, AVATAR.w, AVATAR.h);
    expect(p.height).toBeGreaterThanOrEqual(AVATAR.h - 0.01);
  });

  it('covers a square frame from either orientation', () => {
    for (const [w, h] of [
      [800, 583],
      [548, 800],
      [1000, 1000],
    ] as const) {
      const s = coverScale(w, h, AVATAR.w, AVATAR.h);
      const p = placement({ scale: s, ox: 0, oy: 0 }, w, h, AVATAR.w, AVATAR.h);
      expect(p.width).toBeGreaterThanOrEqual(AVATAR.w - 0.01);
      expect(p.height).toBeGreaterThanOrEqual(AVATAR.h - 0.01);
    }
  });
});

describe('placement', () => {
  it('treats scale 0 as never positioned and falls back to covering', () => {
    const auto = placement(DEFAULT_POS, 548, 800, BANNER.w, BANNER.h);
    const explicit = placement(
      { scale: coverScale(548, 800, BANNER.w, BANNER.h), ox: 0, oy: 0 },
      548,
      800,
      BANNER.w,
      BANNER.h
    );
    expect(auto).toEqual(explicit);
  });

  it('never lets a stored scale uncover the frame', () => {
    // a scale saved against some other frame could be too small here
    const p = placement({ scale: 1, ox: 0, oy: 0 }, 548, 800, BANNER.w, BANNER.h);
    expect(p.height).toBeGreaterThanOrEqual(BANNER.h - 0.01);
  });

  it('clamps offsets so a gap can never be dragged into view', () => {
    const p = placement({ scale: 2, ox: 5, oy: -5 }, 800, 583, BANNER.w, BANNER.h);
    const mx = (p.width - BANNER.w) / 2;
    const my = (p.height - BANNER.h) / 2;
    expect(p.x).toBeCloseTo(mx, 5);
    expect(p.y).toBeCloseTo(-my, 5);
  });
});

describe('cropRect', () => {
  it('is identical at any frame size - the whole point of storing fractions', () => {
    const pos = { scale: 1.6, ox: -0.42, oy: 0.31 };
    const small = cropRect(pos, 800, 583, 359, 270);
    const large = cropRect(pos, 800, 583, 1436, 1080);
    for (const k of ['x', 'y', 'w', 'h'] as const) {
      expect(large[k]).toBeCloseTo(small[k], 6);
    }
  });

  it('stays inside the source image at the extremes', () => {
    for (const ox of [-1, 0, 1]) {
      for (const oy of [-1, 0, 1]) {
        const c = cropRect({ scale: 1.8, ox, oy }, 548, 800, BANNER.w, BANNER.h);
        expect(c.x).toBeGreaterThanOrEqual(-1e-9);
        expect(c.y).toBeGreaterThanOrEqual(-1e-9);
        expect(c.x + c.w).toBeLessThanOrEqual(1 + 1e-9);
        expect(c.y + c.h).toBeLessThanOrEqual(1 + 1e-9);
      }
    }
  });
});

describe('coercePos', () => {
  it('survives junk from storage', () => {
    expect(coercePos(null)).toEqual(DEFAULT_POS);
    expect(coercePos('nope')).toEqual(DEFAULT_POS);
    expect(coercePos({ scale: NaN, ox: 'x', oy: undefined })).toEqual(DEFAULT_POS);
  });

  it('clamps a hand-edited scale and offsets', () => {
    expect(coercePos({ scale: 99, ox: 4, oy: -4 })).toEqual({ scale: MAX_SCALE, ox: 1, oy: -1 });
    expect(coercePos({ scale: 0.2, ox: 0, oy: 0 }).scale).toBe(0);
  });
});
