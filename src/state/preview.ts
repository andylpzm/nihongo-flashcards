// ?unlockall shows every picture regardless of points, for reviewing the art
// and for testing the pickers with a full collection.
//
// it also counts every picture as already SEEN - see seen() in galleryView.ts.
// points alone only decide what is unlocked; an unopened card still lies face
// down, and an arc reward still waits on its pieces being opened. without that
// second half the switch left all 302 cards to be tapped one at a time.
//
// a url switch rather than a code change so there is nothing to undo, and it
// lives here rather than in one view so the gallery and both pickers agree
// about what is unlocked.

export const previewAll = new URLSearchParams(location.search).has('unlockall');

/** the points total to build the gallery from, honouring the preview switch */
export function effectivePoints(total: number): number {
  return previewAll ? Number.MAX_SAFE_INTEGER : total;
}
