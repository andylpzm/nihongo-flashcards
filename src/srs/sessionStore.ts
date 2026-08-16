import type { CardId } from '../state/types';

const KEY = 'nihongo_active_session';

export interface PersistedSession {
  date: string; // YYYY-MM-DD, so a stale session doesn't resume tomorrow
  deck: string; // activeDeck at the time - don't resume into a different deck
  remainingCardIds: CardId[];
  totalCards: number;
  startedAt: number;
  answers: number;
  correct: number;
}

export function saveActiveSession(s: PersistedSession): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // ignore
  }
}

export function loadActiveSession(): PersistedSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PersistedSession;
  } catch {
    return null;
  }
}

export function clearActiveSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}
