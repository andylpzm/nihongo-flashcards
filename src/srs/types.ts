import type { Card as FsrsCard, Grade } from 'ts-fsrs';
import type { CardId } from '../state/types';

export type { FsrsCard, Grade };

export interface ReviewLogEntry {
  ts: number;
  rating: Grade;
  elapsedMs: number;
}

export interface ReviewRecord {
  cardId: CardId;
  card: FsrsCard;
  log: ReviewLogEntry[];
}

/**
 * One finished sitting. Written by finishSession() and read only by the points
 * engine, which needs two things the review log cannot tell it apart: whether
 * the queue was worked to empty or abandoned, and which sitting an answer
 * belonged to.
 *
 * Deliberately small and self-contained so that losing this store costs points
 * history and nothing else - review scheduling never reads it.
 */
export interface SessionRecord {
  /** Also the primary key. */
  startedAt: number;
  endedAt: number;
  /** activeDeck at the time, for a per-deck breakdown later. */
  deck: string;
  /** Grade presses, the same unit the session bar and Progress page report. */
  answers: number;
  /** false when the user pressed "End session" instead of emptying the queue. */
  completed: boolean;
}
