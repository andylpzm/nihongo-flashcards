import { Rating, State } from './scheduler';
import type { FsrsCard, Grade } from './types';
import type { QueueItem } from './queue';
import type { CardId } from '../state/types';

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
 * The key rule: a card leaves the session only when its next due time is beyond
 * the learn-ahead window. FSRS learning steps schedule a new card ~10 minutes out,
 * which means "show me again this sitting" - the previous implementation dropped
 * the card instead, so a session was over after `newPerDay` cards and could never
 * teach anything (see D1 in the plan).
 */
export class StudySession {
  private readonly queue: QueueItem[] = [];
  private readonly totalCards: number;
  private readonly graduated = new Set<CardId>();
  private readonly startedAt: number;
  private answers = 0;
  private correct = 0;

  constructor(
    items: QueueItem[],
    private readonly learnAheadMs: number,
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
   * @param scheduled the FSRS card produced by scheduleReview() for this grade -
   *        the caller has already persisted it, we only need its `due` to decide
   *        whether the card stays in this sitting.
   */
  advance(grade: Grade, scheduled: FsrsCard, now: Date = new Date()): void {
    const item = this.queue.shift();
    if (!item) return;

    this.answers++;
    if (grade === Rating.Good || grade === Rating.Easy) this.correct++;

    const dueInMs = scheduled.due.getTime() - now.getTime();
    const staysInSession =
      dueInMs <= this.learnAheadMs &&
      (scheduled.state === State.Learning || scheduled.state === State.Relearning);

    if (staysInSession) {
      this.queue.splice(this.reinsertIndex(grade), 0, item);
    } else {
      this.graduated.add(item.card.id);
    }
  }

  /** Again comes back soon; anything else goes to the back of the working set. */
  private reinsertIndex(grade: Grade): number {
    if (grade === Rating.Again) {
      return Math.min(this.queue.length, 3);
    }
    return this.queue.length;
  }
}
