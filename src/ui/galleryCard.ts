// a gallery picture presented as a collectible card.
//
// the design is settled in gallery-source/CARD-SPEC.html; this builds it for
// real, from three pieces of authored data:
//   framing.json        where each picture sits inside its frame
//   cardOverrides.json  which frame and which finish, where the kind is wrong
//   gallery.json        everything else
//
// nothing here decides how a card looks - it only assembles what was decided.

import framing from '../data/framing.json';
import overrides from '../data/cardOverrides.json';
import { coercePos, placement } from '../state/imagePos';
import { isConnected, thumbUrl, fullUrl } from '../state/vault';
import type { GallerySaga } from '../srs/gallery';

const BASE = import.meta.env.BASE_URL;

// where a picture comes from. with a pack connected it is a blob the app
// decrypted. without one, in the repo, it is the ordinary file still sitting in
// public/ - but the built app ships no artwork at all, so there the card gets
// no src and shows its empty window rather than a broken-image glyph.
const loose = (path: string): string | null => (import.meta.env.DEV ? `${BASE}${path}` : null);
const readyUrl = (path: string): string | null => (isConnected() ? thumbUrl(path) : loose(path));
const openUrl = async (path: string): Promise<string | null> =>
  isConnected() ? await fullUrl(path) : loose(path);

export type Tier = 'chapter' | 'cover' | 'arc';

interface Override {
  layout: string;
  tier: string;
  rotate?: number;
}
const OVR = overrides as Record<string, Override>;
const POS = framing as Record<string, unknown>;

/** which finish a picture takes: its override, else its kind */
export function tierOf(id: string, kind: string): Tier {
  const o = OVR[id];
  if (o) return o.tier as Tier;
  return kind === 'spread' ? 'arc' : kind === 'cover' ? 'cover' : 'chapter';
}

/** landscape cards are the arc spreads, plus anything overridden onto its side */
export function isLandscape(id: string, kind: string): boolean {
  const o = OVR[id];
  return o ? o.layout === 'landscape' : kind === 'spread';
}

export function rotationOf(id: string): number {
  return OVR[id]?.rotate ?? 0;
}

// the card number is the picture's place in the whole gallery, pieces and arc
// payoffs together - the same order the framing tool numbered them in, so the
// number on the card matches the number Andy framed it under.
let ORDER: Map<string, number> | null = null;
export function indexPictures(sagas: GallerySaga[]): void {
  const m = new Map<string, number>();
  let n = 0;
  for (const saga of sagas)
    for (const arc of saga.arcs) {
      for (const p of arc.pieces) m.set(p.id, ++n);
      if (arc.payoff) m.set(arc.id, ++n);
    }
  ORDER = m;
}
export const numberOf = (id: string): string => String(ORDER?.get(id) ?? 0).padStart(3, '0');
/** a picture's 1-based place in the whole gallery, 0 if it is not indexed */
export const positionOf = (id: string): number => ORDER?.get(id) ?? 0;

export interface CardPicture {
  id: string;
  image: string;
  thumb?: string;
  kind: string;
}

/**
 * where the bottom rule breaks, as fractions of the card's width.
 *
 * every card carries three digits and the same mangaka name, and both are sized
 * in cqw - so the cut points are the SAME fraction on every card of a given
 * orientation. measuring per card, 302 times, would produce 302 identical
 * answers. measured once here against a real probe card, then reused.
 */
interface Cuts { seg1: number; seg2l: number; seg2w: number; seg3: number }
const cutCache = new Map<string, Cuts>();

function measureCuts(land: boolean): Cuts {
  const key = land ? 'land' : 'port';
  const hit = cutCache.get(key);
  if (hit) return hit;

  const host = document.createElement('div');
  host.className = 'gc-frame';
  host.style.cssText = 'position:fixed;left:-9999px;top:0;width:400px;pointer-events:none';
  const card = document.createElement('div');
  card.className = 'gc' + (land ? ' is-land' : '');
  card.innerHTML =
    '<div class="gc-num"><i>0</i><i>0</i><i>0</i></div><span class="gc-auth">三浦 糀</span>';
  host.appendChild(card);
  document.body.appendChild(host);

  const cr = card.getBoundingClientRect();
  const num = card.querySelector('.gc-num')!.getBoundingClientRect();
  const auth = card.querySelector('.gc-auth')!.getBoundingClientRect();
  const gap = probe(card, '--gap');
  const brk = probe(card, '--brk');
  const w = cr.width || 1;
  const cuts: Cuts = {
    seg1: Math.max(0, num.left - cr.left - brk - gap) / w,
    seg2l: (num.right - cr.left + brk) / w,
    seg2w: Math.max(0, auth.left - cr.left - brk - (num.right - cr.left + brk)) / w,
    seg3: Math.max(0, cr.width - gap - (auth.right - cr.left + brk)) / w,
  };
  host.remove();
  // a card with no fonts yet measures wrong; only keep a believable answer
  if (cuts.seg2w > 0 && cuts.seg1 > 0) cutCache.set(key, cuts);
  return cuts;
}

/** clears the cache when the fonts land and the name's width changes */
export function refreshCuts(): void {
  cutCache.clear();
}

/**
 * builds the card. the artwork is placed by the saved framing, so it shows the
 * exact crop that was chosen in the tool - at whatever size the card renders.
 */
export function buildCard(pic: CardPicture, mini = false): HTMLElement {
  const land = isLandscape(pic.id, pic.kind);
  const rot = rotationOf(pic.id);

  const frame = document.createElement('div');
  frame.className = 'gc-frame';

  const card = document.createElement('div');
  card.className = 'gc' + (land ? ' is-land' : '') + (mini ? ' is-mini' : '');
  card.dataset.tier = tierOf(pic.id, pic.kind);
  card.dataset.id = pic.id;

  const digits = [...numberOf(pic.id)].map((d) => `<i>${d}</i>`).join('');
  // a binder page renders 300 of these at once, so the mini leaves out every
  // layer that only exists to move: no foil, no glare, no rim. it also loads the
  // thumbnail, which has the same aspect as the full art and so frames the same.
  // open on the thumbnail and upgrade to the full picture once it has decoded.
  // the binder has already loaded every thumbnail, so it is in cache and the
  // card arrives complete instead of showing its frame around an empty window
  // for as long as the full image takes. both are cut from the same source, so
  // they share an aspect and the saved framing lands identically - the swap is
  // a sharpening, not a jump.
  const src = readyUrl(pic.thumb ?? pic.image);
  card.innerHTML =
    '<span class="gc-wash"></span><span class="gc-grain"></span>' +
    (mini ? '' : '<span class="gc-rim"></span>') +
    '<div class="gc-win">' +
    `<img class="gc-art" alt=""${mini ? ' loading="lazy"' : ''}${src ? ` src="${src}"` : ''}>` +
    (mini ? '' : '<span class="gc-foil"></span><span class="gc-foil2"></span><span class="gc-glare"></span>') +
    '</div>' +
    '<span class="gc-kl"></span>' +
    '<span class="gc-klb s1"></span><span class="gc-klb s2"></span><span class="gc-klb s3"></span>' +
    '<span class="gc-side l">AO NO HAKO</span><span class="gc-side r">AO NO HAKO</span>' +
    `<div class="gc-num">${digits}</div>` +
    '<span class="gc-auth">三浦 糀</span><span class="gc-logo"></span>';

  frame.appendChild(card);

  const img = card.querySelector<HTMLImageElement>('.gc-art')!;
  const apply = (): void => {
    applyFraming(card, img, pic.id, rot);
    cutRule(card, land);
  };
  if (img.complete && img.naturalWidth) apply();
  else img.addEventListener('load', apply, { once: true });

  // the full picture, fetched behind the thumbnail. decode() rather than load:
  // load fires before the bitmap is ready, and swapping then hands the browser
  // a decode on the next paint - which is the flash we are removing.
  if (!mini && pic.thumb && pic.image !== pic.thumb) {
    void openUrl(pic.image)
      .then(async (url) => {
        if (!url) return;
        const full = new Image();
        full.src = url;
        await full.decode();
        img.src = url;
        apply();
      })
      .catch(() => {
        /* the thumbnail is already showing; a failed upgrade changes nothing */
      });
  }
  // the card is a different size on a phone, in the viewer, after a rotate
  new ResizeObserver(apply).observe(card);

  return frame;
}

/** puts the artwork where the framing tool said, in px, for this card's size */
function applyFraming(card: HTMLElement, img: HTMLImageElement, id: string, rot: number): void {
  // offsetWidth/Height, not getBoundingClientRect: the rect is the AXIS-ALIGNED
  // box, so as soon as the viewer turns a landscape card upright it hands back
  // the two dimensions swapped and the artwork gets fitted to the wrong frame.
  // the layout size is what the framing was authored against.
  const el = card.querySelector<HTMLElement>('.gc-win')!;
  const win = { width: el.offsetWidth, height: el.offsetHeight };
  if (!win.width || !img.naturalWidth) return;
  const quarter = rot === 90 || rot === 270;
  // a quarter turn swaps which way the picture is tall, so the placement maths
  // has to see the turned size rather than the file's own
  const iw = quarter ? img.naturalHeight : img.naturalWidth;
  const ih = quarter ? img.naturalWidth : img.naturalHeight;

  const pl = placement(coercePos(POS[id]), iw, ih, win.width, win.height);
  // the element is sized before the turn, so a quarter turn swaps what we set
  img.style.width = `${quarter ? pl.height : pl.width}px`;
  img.style.height = `${quarter ? pl.width : pl.height}px`;
  // px offsets, not percentages: a percentage translate resolves against the
  // element's unrotated box and throws the centring off once it turns
  img.style.transform =
    `translate(-50%, -50%) translate(${pl.x}px, ${pl.y}px)` + (rot ? ` rotate(${rot}deg)` : '');
}

/**
 * the bottom rule stops short of each label rather than running behind it.
 *
 * the cut points are MEASURED from the rendered labels, never parsed from the
 * css - the vars are in cqw, and parseFloat on "9.048cqw" hands back 9.048
 * which then gets used as pixels and puts the rule through the digits.
 */
function probe(card: HTMLElement, name: string): number {
  const el = document.createElement('span');
  el.style.cssText = `position:absolute;visibility:hidden;height:0;width:var(${name})`;
  card.appendChild(el);
  const w = el.getBoundingClientRect().width;
  el.remove();
  return w;
}

export function cutRule(card: HTMLElement, land = card.classList.contains('is-land')): void {
  // layout width for the same reason as applyFraming - a turned card's rect is
  // its rotated bounding box, which would cut the rule in the wrong places
  const w = card.offsetWidth;
  if (!w) return;
  const c = measureCuts(land);
  const set = (k: string, v: number): void => card.style.setProperty(k, `${v * w}px`);
  set('--seg1', c.seg1);
  set('--seg2l', c.seg2l);
  set('--seg2w', c.seg2w);
  set('--seg3', c.seg3);
}
