import { describe, it, expect } from 'vitest';
import framing from './framing.json';
import gallery from './gallery.json';
import overrides from './cardOverrides.json';
import cardInserts from './cardInserts.json';
import { applyInserts, type InsertFile } from './inserts';
import { coercePos, cropRect, placement, DEFAULT_POS, MAX_SCALE } from '../state/imagePos';

// the framing tool (tools/framer.html) writes framing.json. these guard that
// what it writes is actually usable by the app - the whole point of sitting
// through 301 pictures is that the result reproduces exactly, on any phone.

const PORTRAIT = 63 / 88;
const LANDSCAPE = 88 / 63;

type Override = { layout: string; tier: string; rotate?: number };
const OVR = overrides as Record<string, Override>;

// every picture Andy singled out, by card number. pinned exactly, so a stray
// edit to cardOverrides.json fails here instead of quietly reverting a card to
// the wrong frame or the wrong finish. the numbers in the comments shift when a
// card is inserted - they are a signpost, not an assertion.
const PINNED: Record<string, Override> = {
  'ch-005': { layout: 'landscape', tier: 'chapter' },                             // #5
  'ch-012': { layout: 'landscape', tier: 'chapter' },                             // #15
  'vol-02': { layout: 'portrait', tier: 'arc' },                                  // #22
  'ch-017': { layout: 'portrait', tier: 'cover' },                                // #23
  'ch-024': { layout: 'portrait', tier: 'cover' },                                // #30
  'ch-025': { layout: 'portrait', tier: 'chapter' },                              // #32
  'ch-027': { layout: 'landscape', tier: 'chapter' },                             // #35
  'vol-05': { layout: 'landscape', tier: 'chapter' },                             // #56
  'ch-045': { layout: 'portrait', tier: 'chapter' },                              // #58
  'ch-046': { layout: 'portrait', tier: 'cover' },                                // #60
  'ch-052': { layout: 'landscape', tier: 'chapter' },                             // #67
  'ch-056': { layout: 'landscape', tier: 'cover' },                               // #72
  'ch-060': { layout: 'landscape', tier: 'chapter', rotate: 270 },                // #76
  'ch-065': { layout: 'portrait', tier: 'chapter' },                              // #82
  'ch-069': { layout: 'landscape', tier: 'chapter' },                             // #87
  'ch-081': { layout: 'landscape', tier: 'chapter' },                             // #102
  'ch-089': { layout: 'landscape', tier: 'chapter' },                             // #110
  'ch-093': { layout: 'landscape', tier: 'chapter' },                             // #115
  'ins-005': { layout: 'portrait', tier: 'cover' },                               // #119
  'vol-11': { layout: 'portrait', tier: 'chapter' },                              // #124
  'ch-101': { layout: 'landscape', tier: 'chapter' },                             // #126
  'ch-105': { layout: 'landscape', tier: 'chapter' },                             // #130
  'ins-007': { layout: 'landscape', tier: 'chapter' },                            // #132
  'vol-12': { layout: 'portrait', tier: 'chapter' },                              // #137
  'ch-114': { layout: 'landscape', tier: 'chapter' },                             // #143
  'ch-120': { layout: 'landscape', tier: 'cover' },                               // #148
  'ch-129': { layout: 'portrait', tier: 'cover' },                                // #159
  'ch-152': { layout: 'portrait', tier: 'cover' },                                // #186
  'ch-154': { layout: 'landscape', tier: 'cover', rotate: 270 },                  // #189
  'ch-180': { layout: 'landscape', tier: 'cover' },                               // #220
  'ch-235': { layout: 'landscape', tier: 'cover' },                               // #288
  'ch-236': { layout: 'landscape', tier: 'chapter' },                             // #289
  'ch-249': { layout: 'portrait', tier: 'chapter' },                              // #303
  'ch-250': { layout: 'landscape', tier: 'cover' },                               // #304
  'bonus-01': { layout: 'landscape', tier: 'arc' },                               // #306
};

/** a picture's real frame, once its override has its say */
function landscape(id: string, kind: string | undefined): boolean {
  const o = OVR[id];
  return o ? o.layout === 'landscape' : kind === 'spread';
}

interface Piece {
  id: string;
  kind: string;
}
function ids(): Map<string, string> {
  const out = new Map<string, string>();
  // the hand-inserted cards are gallery pictures like any other - the app sees
  // them through the same merge, so the guards here have to as well
  const sagas = applyInserts(
    gallery.sagas as Parameters<typeof applyInserts>[0],
    (cardInserts as InsertFile).inserts
  );
  for (const saga of sagas)
    for (const arc of saga.arcs) {
      for (const p of arc.pieces as Piece[]) out.set(p.id, p.kind);
      if (arc.payoff) out.set(arc.id, arc.payoff.kind);
    }
  return out;
}

const entries = Object.entries(framing as Record<string, unknown>);

describe('framing.json', () => {
  it('only names pictures that exist in the gallery', () => {
    const known = ids();
    const strays = entries.map(([id]) => id).filter((id) => !known.has(id));
    expect(strays).toEqual([]);
  });

  it('every entry survives coercion without being silently discarded', () => {
    for (const [id, raw] of entries) {
      const pos = coercePos(raw);
      // scale 0 means "never positioned" - a saved entry should never be that,
      // or the user's work vanished somewhere between the tool and here
      expect(pos.scale, `${id} lost its scale`).toBeGreaterThanOrEqual(1);
      expect(pos.scale).toBeLessThanOrEqual(MAX_SCALE);
      expect(Math.abs(pos.ox), `${id} ox out of range`).toBeLessThanOrEqual(1);
      expect(Math.abs(pos.oy), `${id} oy out of range`).toBeLessThanOrEqual(1);
    }
  });

  it('reproduces the identical crop at every card size', () => {
    const known = ids();
    for (const [id, raw] of entries) {
      const pos = coercePos(raw);
      const land = landscape(id, known.get(id));
      const aspect = land ? LANDSCAPE : PORTRAIT;
      // a real source image, and three very different rendered widths
      const iw = 800;
      const ih = land ? 583 : 1138;
      const at = (w: number): ReturnType<typeof cropRect> =>
        cropRect(pos, iw, ih, w, w / aspect);

      const small = at(150);
      const phone = at(340);
      const big = at(560);
      for (const k of ['x', 'y', 'w', 'h'] as const) {
        expect(phone[k], `${id}.${k} drifted between 150px and 340px`).toBeCloseTo(small[k], 6);
        expect(big[k], `${id}.${k} drifted between 340px and 560px`).toBeCloseTo(phone[k], 6);
      }
    }
  });

  it('never crops outside the source image', () => {
    const known = ids();
    for (const [id, raw] of entries) {
      const pos = coercePos(raw);
      const land = landscape(id, known.get(id));
      const aspect = land ? LANDSCAPE : PORTRAIT;
      const r = cropRect(pos, 800, land ? 583 : 1138, 340, 340 / aspect);
      expect(r.x, `${id} crops off the left`).toBeGreaterThanOrEqual(-1e-9);
      expect(r.y, `${id} crops off the top`).toBeGreaterThanOrEqual(-1e-9);
      expect(r.x + r.w, `${id} crops past the right`).toBeLessThanOrEqual(1 + 1e-9);
      expect(r.y + r.h, `${id} crops past the bottom`).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it('keeps every overridden card on the frame and finish it was given', () => {
    for (const [id, want] of Object.entries(PINNED)) {
      const got = OVR[id];
      expect(got, `${id} lost its override entirely`).toBeDefined();
      if (!got) continue;
      expect(got.layout, `${id} changed frame`).toBe(want.layout);
      expect(got.tier, `${id} changed rarity`).toBe(want.tier);
      expect(got.rotate ?? 0, `${id} changed rotation`).toBe(want.rotate ?? 0);
    }
  });

  it('overrides only name real pictures, with a real tier and a square turn', () => {
    const known = ids();
    for (const [id, o] of Object.entries(OVR)) {
      expect(known.has(id), `${id} is not a gallery picture`).toBe(true);
      expect(['portrait', 'landscape']).toContain(o.layout);
      expect(['chapter', 'cover', 'arc']).toContain(o.tier);
      if (o.rotate !== undefined) expect([0, 90, 180, 270]).toContain(o.rotate);
    }
  });

  it('positions the six against their rotated shape, not the file shape', () => {
    // a quarter turn swaps the source dimensions. if the crop were computed
    // against the file's own 547x800 the picture would be placed wrongly.
    for (const [id, o] of Object.entries(OVR)) {
      if (!o.rotate || o.rotate % 180 === 0) continue;
      const pos = coercePos((framing as Record<string, unknown>)[id]);
      const [w, h] = [547, 800];
      const turned = cropRect(pos, h, w, 340, 340 / LANDSCAPE);
      for (const k of ['x', 'y', 'w', 'h'] as const) {
        expect(turned[k], `${id}.${k} outside the turned image`).toBeGreaterThanOrEqual(-1e-9);
      }
      expect(turned.x + turned.w).toBeLessThanOrEqual(1 + 1e-9);
      expect(turned.y + turned.h).toBeLessThanOrEqual(1 + 1e-9);
    }
  });

  it('has a saved position for every picture in the gallery', () => {
    // 302 sittings went into this. losing one should fail loudly, not silently
    // fall back to a default crop nobody chose.
    const missing = [...ids().keys()].filter((id) => !(id in (framing as object)));
    expect(missing, 'pictures with no saved framing').toEqual([]);
    expect(Object.keys(framing as object)).toHaveLength(ids().size);
  });

  it('pins the override list itself, so one cannot quietly disappear', () => {
    expect(Object.keys(OVR).sort()).toEqual(Object.keys(PINNED).sort());
  });

  it('leaves an unframed picture filling the card exactly', () => {
    // the 294 pictures nobody adjusts must still look right
    const p = placement(DEFAULT_POS, 800, 1138, 340, 340 / PORTRAIT);
    expect(p.width).toBeGreaterThanOrEqual(340 - 1e-9);
    expect(p.height).toBeGreaterThanOrEqual(340 / PORTRAIT - 1e-9);
    expect(p.x).toBe(0);
    expect(p.y).toBe(0);
  });
});
