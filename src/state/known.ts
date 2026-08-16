import type { CardId } from './types';

/**
 * Words the user has hand-marked as learned while browsing.
 *
 * Deliberately separate from FSRS: this is a self-assessed "I know this one"
 * flag that drives the Proposal Progress counter, not a scheduling signal.
 * Marking a word here does not remove it from study sessions, and grading a
 * card in a session does not mark it here - the two systems answer different
 * questions ("how far through the deck do I feel?" vs "when should this be
 * shown again?").
 */
const KEY = 'nihongo_known_ids';

/** Chris's pre-FSRS progress. Phase 3 migrated it into review records and left
 * the key in place as a rollback path; reading it here as the starting set
 * means his old "mastered" words show up in the counter straight away instead
 * of the bar resetting to zero. Only used to seed - never written back. */
const LEGACY_KEY = 'nihongo_mastered_ids';

let cache: Set<CardId> | null = null;

function read(key: string): CardId[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CardId[]) : [];
  } catch {
    return [];
  }
}

function load(): Set<CardId> {
  if (cache) return cache;
  const own = localStorage.getItem(KEY);
  cache = new Set(own !== null ? read(KEY) : read(LEGACY_KEY));
  return cache;
}

function persist(): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(Array.from(load())));
  } catch {
    // ignore quota errors - this is progress flavour, not study data
  }
}

export function isKnown(id: CardId): boolean {
  return load().has(id);
}

export function toggleKnown(id: CardId): boolean {
  const set = load();
  if (set.has(id)) {
    set.delete(id);
  } else {
    set.add(id);
  }
  persist();
  return set.has(id);
}

/** How many of the given cards are marked known - scoped to the deck on
 * screen, so switching to Hiragana doesn't report vocabulary progress. */
export function countKnownIn(ids: CardId[]): number {
  const set = load();
  let n = 0;
  for (const id of ids) if (set.has(id)) n++;
  return n;
}
