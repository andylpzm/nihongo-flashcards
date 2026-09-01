// cards added by hand in tools/framer.html, merged over the generated manifest.
//
// gallery.json is written from scratch by tools/build-gallery-assets.mjs, so a
// card inserted straight into it disappears the next time that tool runs. the
// inserts live in their own file instead and are applied on load - regenerating
// the manifest cannot lose them, and the generator needs to know nothing.

import type { GallerySaga, GalleryPiece } from '../srs/gallery';

export interface CardInsert {
  /** its own id, unique across the whole gallery */
  id: string;
  /** which arc it joins */
  arc: string;
  /** the piece it sits behind. null puts it first; the arc's own id, last */
  after: string | null;
  kind: string;
  image: string;
  thumb: string;
}

export interface InsertFile {
  inserts: CardInsert[];
}

/** every insert, in order, spliced into the arc it names */
export function applyInserts(sagas: GallerySaga[], inserts: CardInsert[]): GallerySaga[] {
  if (!inserts.length) return sagas;

  // copied before anything is spliced: the manifest is an imported module
  // object, shared with everything else that reads it
  const pieces = new Map<string, GalleryPiece[]>();
  for (const saga of sagas) for (const arc of saga.arcs) pieces.set(arc.id, [...arc.pieces]);

  const taken = new Set<string>();
  for (const saga of sagas) for (const arc of saga.arcs) for (const p of arc.pieces) taken.add(p.id);

  for (const ins of inserts) {
    const list = pieces.get(ins.arc);
    // an arc that no longer exists, or a card already in the manifest - either
    // way there is nothing sensible to do but leave it out
    if (!list || taken.has(ins.id)) continue;
    taken.add(ins.id);

    const piece: GalleryPiece = {
      id: ins.id,
      // keeps it out of the count the price curve is fitted to, so adding it
      // cannot change a requirement chris has already been shown
      inserted: true,
      kind: ins.kind,
      chapter: 0,
      volume: null,
      image: ins.image,
      thumb: ins.thumb,
    };
    if (ins.after === null) {
      list.unshift(piece);
      continue;
    }
    const at = list.findIndex((p) => p.id === ins.after);
    // the arc's own id means the payoff, which sits behind every piece. an
    // anchor that has since gone lands here too: the end of the arc keeps the
    // card, where dropping it would lose artwork already written to disk.
    if (at < 0) list.push(piece);
    else list.splice(at + 1, 0, piece);
  }

  return sagas.map((saga) => ({
    ...saga,
    arcs: saga.arcs.map((arc) => ({ ...arc, pieces: pieces.get(arc.id) ?? arc.pieces })),
  }));
}
