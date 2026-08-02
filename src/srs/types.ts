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
