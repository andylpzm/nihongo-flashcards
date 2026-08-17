import { Rating } from './scheduler';
import type { Grade } from './types';
import type { QueueItem } from './queue';
import type { CardId } from '../state/types';

/** How many times one card may come back inside a single sitting. */
const MAX_REPEATS = 2;

export interface SessionProgress {
  /** Distinct cards that have graduated out of this session. */
  done: number;
  /** Distinct cards still in the session (including ones waiting to come back). */
  remaining: number;
  /** Distinct cards this session started with. Never changes. */
  total: number;
  /** Grades given, including intra-session repeats. */
  answers: number;
  correct: number;
}

/**
 * An in-flight study sitting.
 *
 * A card leaves the session as soon as it is answered - except one you got
 * wrong, which comes back for a second look before the sitting ends.
 *
 * This used to key off FSRS learning steps, which kept *every* card circling
 * until it had been answered well twice. That made a "10 card" session take 17
 * answers and made the count meaningless. The schedule is now committed on the
 * first answer; the repeat below is a queue behaviour, giving the corrective
 * second attempt to the cards that were actually failed.
 */
export class StudySession {
  private readonly queue: QueueItem[] = [];
  private readonly totalCards: number;
  private readonly graduated = new Set<CardId>();
  private readonly repeats = new Map<CardId, number>();
  private readonly startedAt: number;
  private answers = 0;
  private correct = 0;

  constructor(
    items: QueueItem[],
    now: Date = new Date(),
    /** Resume state for a session restored from sessionStore.ts (Step 4).
     * `graduatedCount` isn't tracked by individual id in storage - only the
     * count - which is safe because nothing outside advance() ever queries
     * `graduated` by id, only by size (see `progress.done`). */
    resume?: { totalCards: number; graduatedCount: number; answers: number; correct: number; startedAt: number }
  ) {
    this.queue = [...items];
    this.totalCards = resume?.totalCards ?? items.length;
    this.startedAt = resume?.startedAt ?? now.getTime();
    this.answers = resume?.answers ?? 0;
    this.correct = resume?.correct ?? 0;
    if (resume) {
      for (let i = 0; i < resume.graduatedCount; i++) {
        // Synthetic placeholder ids - only .size is ever read for these.
        this.graduated.add(`__resumed_${i}` as unknown as CardId);
      }
    }
  }

  get current(): QueueItem | null {
    return this.queue[0] ?? null;
  }

  get isComplete(): boolean {
    return this.queue.length === 0;
  }

  get progress(): SessionProgress {
    return {
      done: this.graduated.size,
      remaining: this.queue.length,
      total: this.totalCards,
      answers: this.answers,
      correct: this.correct,
    };
  }

  get elapsedMs(): number {
    return Date.now() - this.startedAt;
  }

  /** Cards remaining, for persistence. */
  get remainingCardIds(): CardId[] {
    return this.queue.map((i) => i.card.id);
  }

  /**
   * Record a grade for the current card and advance.
   *
   * Only the grade matters now: the schedule was committed by the caller when
   * it wrote the review, and whether the card comes back this sitting depends
   * on whether it was failed, not on where FSRS put it.
   */
  advance(grade: Grade): void {
    const item = this.queue.shift();
    if (!item) return;

    this.answers++;
    if (grade === Rating.Good || grade === Rating.Easy) this.correct++;

    // Capped so a card answered Forgot repeatedly cannot loop for ever: after
    // the second failure it is left for the next session rather than blocking
    // this one.
    const seen = (this.repeats.get(item.card.id) ?? 0) + 1;
    const staysInSession = grade === Rating.Again && seen <= MAX_REPEATS;

    if (staysInSession) {
      this.repeats.set(item.card.id, seen);
      this.queue.splice(this.reinsertIndex(grade), 0, item);
    } else {
      this.graduated.add(item.card.id);
    }
  }

  /** Far enough back that a few other cards intervene, so the second attempt
   * is a real retrieval rather than an echo of the answer just seen. */
  private reinsertIndex(_grade: Grade): number {
    return Math.min(this.queue.length, 3);
  }
}
