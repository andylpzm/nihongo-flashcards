// gallery unlock rules.
//
// structure is saga -> arc -> chapters. one manga chapter title page is one
// unlock; collecting every chapter in an arc reveals that arc's payoff image.
//
// thresholds are paced against the real points curve in points.ts, not guessed:
// TOTAL_TARGET is what one medium session a day earns in twelve months, so the
// last piece lands at twelve months of steady study and about eight for someone
// doing two sessions a day. the daily rate cap in points.ts is what keeps those
// two numbers from drifting apart.

/** xp a two-decks-a-day habit earns in 12 months (verified in points.test.ts) */
export const TOTAL_TARGET = 66_500;
/** what the first picture costs - deliberately under one session's earnings
 *  (a first vocab sitting plus its mission pays ~55) so the mechanic is
 *  discovered immediately rather than on day two */
/** xp for the very first picture. exported so the binder tab can ask whether
    there is anything behind it yet without loading the whole gallery. */
export const FIRST_UNLOCK = 50;

/**
 * xp needed for the picture in slot `index` (0-based), on a curve fitted to
 * `total` slots.
 *
 * one smooth curve, `FIRST_UNLOCK x n^p`, fitted so slot `total - 1` lands on
 * TOTAL_TARGET. the first unlock used to be a hardcoded special case bolted
 * onto a curve that started far lower, which left a five-xp gap between
 * pictures one and two - a single session cleared both.
 *
 * `index` may run PAST the last slot, and that is not an error: a card inserted
 * by hand adds a slot to the end of the collection, and the price of that slot
 * is the curve carried on rather than the last rung repeated. `total` is what
 * fixes the shape, so every existing price stays the number it was.
 */
export function thresholdFor(index: number, total: number): number {
  const last = Math.max(2, total);
  const power = Math.log(TOTAL_TARGET / FIRST_UNLOCK) / Math.log(last);
  return Math.round(FIRST_UNLOCK * Math.pow(Math.max(0, index) + 1, power));
}

export interface GalleryPiece {
  id: string;
  /** added by hand in the framing tool rather than by the generator - see
   *  src/data/inserts.ts and countGenerated() */
  inserted?: boolean;
  /** 'chapter' is a chapter title page; 'cover' a volume cover, which sits in
   *  the sequence right after that volume's last chapter */
  kind: string;
  chapter: number;
  volume: number | null;
  image: string;
  thumb: string;
}

export interface GalleryPayoff {
  /** 'spread' is the arc's double page spread, 'custom' a hand-picked override */
  kind: string;
  image: string;
  thumb: string;
  /** real size of the built image, so the banner can take its shape */
  width: number | null;
  height: number | null;
}

export interface GalleryArc {
  id: string;
  arc: string;
  payoff: GalleryPayoff | null;
  pieces: GalleryPiece[];
}

export interface GallerySaga {
  id: string;
  saga: string;
  arcs: GalleryArc[];
}

export interface GalleryEntry extends GalleryPiece {
  /** index across every arc - this is what sets the threshold */
  index: number;
  arcId: string;
  threshold: number;
  unlocked: boolean;
  remaining: number;
}

export interface PayoffEntry {
  arcId: string;
  arcName: string;
  kind: string;
  image: string;
  thumb: string;
  width: number | null;
  height: number | null;
  /** the arc's last chapter - clearing it clears the payoff */
  threshold: number;
  unlocked: boolean;
  remaining: number;
}

export interface ArcView {
  id: string;
  arc: string;
  entries: GalleryEntry[];
  payoff: PayoffEntry | null;
  unlockedCount: number;
  total: number;
  complete: boolean;
}

export interface SagaView {
  id: string;
  saga: string;
  arcs: ArcView[];
  unlockedCount: number;
  total: number;
}

export function countPieces(sagas: GallerySaga[]): number {
  return sagas.reduce((n, s) => n + s.arcs.reduce((m, a) => m + a.pieces.length, 0), 0);
}

/**
 * the pictures the manga itself supplies - what the curve is fitted to, and
 * deliberately NOT the number of cards in the collection.
 *
 * a card inserted by hand must not re-price anything: the requirements are
 * numbers chris has been looking at. so the curve keeps the shape it was fitted
 * to, the inserted card pushes everything behind it up a slot into that slot's
 * price, and the collection grows one slot past TOTAL_TARGET - a little more xp
 * to earn at the end, which is what an extra card should cost.
 */
export function countGenerated(sagas: GallerySaga[]): number {
  return sagas.reduce(
    (n, s) => n + s.arcs.reduce((m, a) => m + a.pieces.filter((p) => !p.inserted).length, 0),
    0
  );
}

export function buildGallery(sagas: GallerySaga[], totalPoints: number): SagaView[] {
  // the curve's shape, not the collection's length - see countGenerated()
  const total = countGenerated(sagas);
  let index = 0;

  return sagas.map((saga) => {
    const arcs = saga.arcs.map((arc) => {
      const entries = arc.pieces.map((piece) => {
        const threshold = thresholdFor(index++, total);
        return {
          ...piece,
          index: index - 1,
          arcId: arc.id,
          threshold,
          unlocked: totalPoints >= threshold,
          remaining: Math.max(0, threshold - totalPoints),
        };
      });

      const unlockedCount = entries.filter((e) => e.unlocked).length;
      const complete = entries.length > 0 && unlockedCount === entries.length;
      const payoffThreshold = entries.length ? entries[entries.length - 1]!.threshold : 0;

      return {
        id: arc.id,
        arc: arc.arc,
        entries,
        payoff: arc.payoff
          ? {
              arcId: arc.id,
              arcName: arc.arc,
              kind: arc.payoff.kind,
              image: arc.payoff.image,
              thumb: arc.payoff.thumb,
              width: arc.payoff.width ?? null,
              height: arc.payoff.height ?? null,
              threshold: payoffThreshold,
              unlocked: complete,
              remaining: Math.max(0, payoffThreshold - totalPoints),
            }
          : null,
        unlockedCount,
        total: entries.length,
        complete,
      };
    });

    return {
      id: saga.id,
      saga: saga.saga,
      arcs,
      unlockedCount: arcs.reduce((n, a) => n + a.unlockedCount, 0),
      total: arcs.reduce((n, a) => n + a.total, 0),
    };
  });
}

/** one picture the user can choose, for the avatar and banner pickers */
export interface PickableImage {
  id: string;
  /** 'chapter' | 'cover' | 'spread' | 'custom' - what the category tabs filter on */
  kind: string;
  image: string;
  thumb: string;
  label: string;
}

/**
 * every unlocked picture, in gallery order, arc payoffs included.
 *
 * numbered by position in the whole collection rather than by chapter, matching
 * how the gallery labels them - the two diverge because volume covers sit in
 * the sequence too.
 */
export function unlockedImages(sagas: GallerySaga[], totalPoints: number): PickableImage[] {
  const out: PickableImage[] = [];
  for (const saga of buildGallery(sagas, totalPoints)) {
    for (const arc of saga.arcs) {
      for (const entry of arc.entries) {
        if (!entry.unlocked) continue;
        out.push({
          id: entry.id,
          kind: entry.kind,
          image: entry.image,
          thumb: entry.thumb,
          label: `Picture ${entry.index + 1}`,
        });
      }
      if (arc.payoff?.unlocked) {
        out.push({
          id: `${arc.id}-payoff`,
          kind: arc.payoff.kind,
          image: arc.payoff.image,
          thumb: arc.payoff.thumb,
          label: arc.payoff.arcName,
        });
      }
    }
  }
  return out;
}

export function countUnlocked(sagas: GallerySaga[], totalPoints: number): number {
  return buildGallery(sagas, totalPoints).reduce((n, s) => n + s.unlockedCount, 0);
}

/** the next piece still locked, for "x points to the next" */
export function nextLocked(sagas: GallerySaga[], totalPoints: number): GalleryEntry | null {
  for (const saga of buildGallery(sagas, totalPoints)) {
    for (const arc of saga.arcs) {
      const next = arc.entries.find((e) => !e.unlocked);
      if (next) return next;
    }
  }
  return null;
}

export interface NextUp {
  entry: GalleryEntry;
  /** total xp so far */
  pointsInto: number;
  /** what the next picture costs in total */
  to: number;
  pointsNeeded: number;
  /** 0-1 of the way to `to` */
  fraction: number;
}

/**
 * progress towards the next picture, measured cumulatively.
 *
 * deliberately total-against-total rather than progress across the gap since
 * the last unlock: the tiles show each picture's full cost, so measuring the
 * header any other way puts two different scales on the same number.
 */
export function progressToNext(sagas: GallerySaga[], totalPoints: number): NextUp | null {
  const next = nextLocked(sagas, totalPoints);
  if (!next) return null;
  const to = next.threshold;
  return {
    entry: next,
    pointsInto: totalPoints,
    to,
    pointsNeeded: Math.max(0, to - totalPoints),
    fraction: Math.max(0, Math.min(1, totalPoints / Math.max(1, to))),
  };
}

export interface UnlockBatch {
  pieces: GalleryEntry[];
  payoffs: PayoffEntry[];
}

/**
 * what crossing from `before` to `after` points unlocked.
 * returns everything crossed, not just the last, so a session that clears two
 * thresholds announces both.
 */
export function newlyUnlocked(sagas: GallerySaga[], before: number, after: number): UnlockBatch {
  const then = buildGallery(sagas, before);
  const now = buildGallery(sagas, after);

  const pieces: GalleryEntry[] = [];
  const payoffs: PayoffEntry[] = [];

  now.forEach((saga, si) => {
    saga.arcs.forEach((arc, ai) => {
      const previous = then[si]?.arcs[ai];
      arc.entries.forEach((entry, j) => {
        if (entry.unlocked && !previous?.entries[j]?.unlocked) pieces.push(entry);
      });
      if (arc.payoff?.unlocked && !previous?.payoff?.unlocked) payoffs.push(arc.payoff);
    });
  });

  return { pieces, payoffs };
}
