import { describe, it, expect } from 'vitest';
import { tiltFromOrientation, wrap } from './motion';

// the phone reports its attitude in its OWN frame, which is not the frame you
// are looking at once the phone is turned sideways - and the arc cards exist
// to be looked at sideways. these pin the rotation, because getting it wrong
// is not a crash, it is a card that leans the wrong way and looks cheap.

const flat = { beta: 0, gamma: 0 };
const r2 = (n: number): number => Math.round(n * 100) / 100;

describe('wrap', () => {
  it('takes the short way round the seam', () => {
    expect(wrap(10)).toBe(10);
    expect(wrap(-10)).toBe(-10);
    // leaning from 179 to -179 is two degrees, not 358
    expect(wrap(-179 - 179)).toBe(2);
    expect(wrap(350)).toBe(-10);
  });
});

describe('tilt from device attitude', () => {
  it('is flat at the position it started from', () => {
    const base = { beta: 34, gamma: -12 };
    expect(tiltFromOrientation(base, base, 0)).toEqual({ x: 0, y: 0 });
  });

  it('measures from that start, not from level', () => {
    // held at a 34 degree slouch: leaning 11 further is half of full range
    const base = { beta: 34, gamma: 0 };
    const t = tiltFromOrientation({ beta: 45, gamma: 0 }, base, 0);
    expect(r2(t.y)).toBe(0.5);
    expect(t.x).toBe(0);
  });

  it('reaches full tilt at 22 degrees and goes no further', () => {
    expect(tiltFromOrientation({ beta: 0, gamma: 22 }, flat, 0).x).toBe(1);
    expect(tiltFromOrientation({ beta: 0, gamma: 90 }, flat, 0).x).toBe(1);
    expect(tiltFromOrientation({ beta: 0, gamma: -90 }, flat, 0).x).toBe(-1);
  });

  it('portrait: gamma is sideways, beta is up the screen', () => {
    const t = tiltFromOrientation({ beta: 11, gamma: 22 }, flat, 0);
    expect(r2(t.x)).toBe(1);
    expect(r2(t.y)).toBe(0.5);
  });

  it('landscape 90: the axes swap, and one of them flips', () => {
    // the same physical lean now runs along the other screen axis. without
    // this the arc cards - the only ones held sideways - tilt across the wrong
    // diagonal, which reads as the card being broken rather than lit.
    const t = tiltFromOrientation({ beta: 22, gamma: 0 }, flat, 90);
    expect(r2(t.x)).toBe(1);
    expect(r2(t.y)).toBe(0);

    const u = tiltFromOrientation({ beta: 0, gamma: 22 }, flat, 90);
    expect(r2(u.x)).toBe(0);
    expect(r2(u.y)).toBe(-1);
  });

  it('landscape 270 is the mirror of 90', () => {
    const a = tiltFromOrientation({ beta: 22, gamma: 0 }, flat, 90);
    const b = tiltFromOrientation({ beta: 22, gamma: 0 }, flat, 270);
    expect(r2(a.x)).toBe(-r2(b.x));
  });

  it('upside down inverts both', () => {
    const t = tiltFromOrientation({ beta: 11, gamma: 22 }, flat, 180);
    expect(r2(t.x)).toBe(-1);
    expect(r2(t.y)).toBe(-0.5);
  });

  it('does not fling when the lean crosses the 180 seam', () => {
    const t = tiltFromOrientation({ beta: -179, gamma: 0 }, { beta: 179, gamma: 0 }, 0);
    expect(r2(t.y)).toBe(r2(2 / 22));
  });
});
