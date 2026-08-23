// how a picture sits inside a frame, shared by the avatar and the banner.
//
// stored as a scale plus two offsets expressed as a FRACTION of the available
// overflow (-1 hard left/top, 0 centred, 1 hard right/bottom) rather than as
// pixels. the profile card is a different width on every phone, so a pixel
// offset set on one device would crop somewhere else on another; a fraction of
// the overflow reproduces the identical region at any size.

export interface ImagePos {
  /** image width as a multiple of the frame width */
  scale: number;
  /** -1..1 across the horizontal overflow */
  ox: number;
  /** -1..1 across the vertical overflow */
  oy: number;
}

/** scale 0 means "not set yet" - the renderer substitutes the cover scale */
export const DEFAULT_POS: ImagePos = { scale: 0, ox: 0, oy: 0 };

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** read from storage the user could have edited, so tolerate any shape */
export function coercePos(raw: unknown): ImagePos {
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_POS };
  const p = raw as Partial<ImagePos>;
  const scale = typeof p.scale === 'number' && Number.isFinite(p.scale) ? p.scale : 0;
  return {
    // anything below 1 is junk rather than a real zoom, so fall back to auto
    scale: scale >= 1 ? Math.min(scale, MAX_SCALE) : 0,
    ox: typeof p.ox === 'number' && Number.isFinite(p.ox) ? clamp(p.ox, -1, 1) : 0,
    oy: typeof p.oy === 'number' && Number.isFinite(p.oy) ? clamp(p.oy, -1, 1) : 0,
  };
}

export const MAX_SCALE = 3;

/**
 * smallest scale that still covers the frame.
 *
 * a fixed default (1.3, say) is wrong for anything but one aspect ratio: a
 * picture wider than its frame needs no zoom at all, while a narrow one needs
 * a lot before it stops showing bars down the sides.
 */
export function coverScale(
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number
): number {
  if (imageWidth <= 0 || imageHeight <= 0 || frameWidth <= 0 || frameHeight <= 0) return 1;
  // width is scale*frameWidth, so height is scale*frameWidth*(imageHeight/imageWidth)
  const needed = (frameHeight * imageWidth) / (frameWidth * imageHeight);
  return Math.max(1, needed);
}

export interface Placement {
  /** rendered image size, in px */
  width: number;
  height: number;
  /** translation from centred, in px */
  x: number;
  y: number;
}

/**
 * where the picture lands, in px, for a frame of this size.
 *
 * `scale: 0` is taken as "never positioned", which resolves to the cover scale
 * so an untouched picture fills the frame exactly rather than being blown up.
 */
export function placement(
  pos: ImagePos,
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number
): Placement {
  const min = coverScale(imageWidth, imageHeight, frameWidth, frameHeight);
  const scale = pos.scale > 0 ? Math.max(min, pos.scale) : min;
  const width = frameWidth * scale;
  const height = imageWidth > 0 ? width * (imageHeight / imageWidth) : frameHeight;
  const mx = Math.max(0, (width - frameWidth) / 2);
  const my = Math.max(0, (height - frameHeight) / 2);
  return { width, height, x: clamp(pos.ox, -1, 1) * mx, y: clamp(pos.oy, -1, 1) * my };
}

/** the visible region of the source image, as fractions of it - used by tests */
export function cropRect(
  pos: ImagePos,
  imageWidth: number,
  imageHeight: number,
  frameWidth: number,
  frameHeight: number
): { x: number; y: number; w: number; h: number } {
  const p = placement(pos, imageWidth, imageHeight, frameWidth, frameHeight);
  const left = (p.width - frameWidth) / 2 - p.x;
  const top = (p.height - frameHeight) / 2 - p.y;
  return {
    x: left / p.width,
    y: top / p.height,
    w: frameWidth / p.width,
    h: frameHeight / p.height,
  };
}
