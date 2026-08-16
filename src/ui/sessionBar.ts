// Owns every visibility decision for the session status bar so no other
// module can leave it in the all-hidden dead end (D2). Exactly one state is
// rendered at a time; every branch below sets all three action buttons
// explicitly, visible or not.

export type SessionBarState =
  | { kind: 'active'; remaining: number; total: number; answers: number; learned: number }
  | { kind: 'available'; dueCount: number; newCount: number }
  | { kind: 'waiting'; nextDueAt: Date }
  | { kind: 'deck-empty' }
  | { kind: 'complete'; answers: number; elapsedMs: number; endedEarly: boolean; canStartAnother: boolean };

let countdownTimer: ReturnType<typeof setInterval> | null = null;

export function renderSessionBar(state: SessionBarState, onCountdownElapsed: () => void): void {
  stopCountdown();
  const line = document.getElementById('session-status-line');
  const sub = document.getElementById('session-status-sub');
  const start = document.getElementById('btn-start-session');
  const end = document.getElementById('btn-end-session');
  const lengthGroup = document.getElementById('session-length-group');
  if (!line || !sub || !start || !end) return;

  const show = (el: HTMLElement, visible: boolean) => el.classList.toggle('hidden', !visible);

  switch (state.kind) {
    case 'active':
      // The sub-line counts *answers*, not graduations. A new card graded Good
      // is re-queued inside the learn-ahead window and only graduates on a
      // later pass, so "N of M done" sat frozen at 0 for the whole first pass
      // through the queue - roughly 25 answers of no visible progress, which
      // reads as a broken counter.
      line.textContent = `${state.remaining} left`;
      sub.textContent =
        `${state.answers} answer${state.answers === 1 ? '' : 's'}` +
        (state.learned > 0 ? ` · ${state.learned} learned` : '');
      show(start, false);
      show(end, true);
      lengthGroup?.classList.add('hidden');
      break;

    case 'available': {
      // Plain count, no "due"/"new" jargon - on a fresh deck "0 due" was a
      // fact about nothing, and the split meant nothing to a learner.
      const total = state.dueCount + state.newCount;
      line.textContent = `${total} card${total === 1 ? '' : 's'} ready`;
      sub.textContent = '';
      // Reset: the complete state relabels this to "Continue studying".
      start.textContent = 'Start session';
      show(start, true);
      show(end, false);
      lengthGroup?.classList.remove('hidden');
      break;
    }

    case 'waiting':
      line.textContent = 'Nothing due yet';
      sub.textContent = `Next review ${formatCountdown(state.nextDueAt)}`;
      show(start, false);
      show(end, false);
      lengthGroup?.classList.add('hidden');
      startCountdown(state.nextDueAt, sub, onCountdownElapsed);
      break;

    case 'deck-empty':
      line.textContent = 'Nothing left in this deck';
      sub.textContent = 'Try Browse, or pick another deck.';
      show(start, false);
      show(end, false);
      lengthGroup?.classList.add('hidden');
      break;

    case 'complete': {
      const mins = Math.floor(state.elapsedMs / 60000);
      const secs = Math.round((state.elapsedMs % 60000) / 1000);
      // Must match the card face: ending early is not completing.
      line.textContent = state.endedEarly ? 'Session ended' : 'Session complete';
      // No accuracy: grades are self-reported and the old figure counted Hard
      // as an error, so answering honestly lowered the score.
      sub.textContent = mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
      // After bailing out, the remaining cards go straight back into the pool,
      // so starting again genuinely continues where you left off - say so
      // rather than "Start session", which reads like starting over.
      if (state.canStartAnother) start.textContent = state.endedEarly ? 'Continue studying' : 'Start session';
      show(start, state.canStartAnother);
      show(end, false);
      lengthGroup?.classList.toggle('hidden', !state.canStartAnother);
      break;
    }
  }
}

/** Used outside Study Session mode (Browse), where the status bar has
 * nothing to say and no timers should be running. */
export function clearSessionBar(): void {
  stopCountdown();
  const line = document.getElementById('session-status-line');
  const sub = document.getElementById('session-status-sub');
  const start = document.getElementById('btn-start-session');
  const end = document.getElementById('btn-end-session');
  const lengthGroup = document.getElementById('session-length-group');
  if (line) line.textContent = '';
  if (sub) sub.textContent = '';
  start?.classList.add('hidden');
  end?.classList.add('hidden');
  lengthGroup?.classList.add('hidden');
}

function formatCountdown(at: Date): string {
  const ms = at.getTime() - Date.now();
  if (ms <= 0) return 'now';
  const mins = Math.ceil(ms / 60000);
  if (mins < 60) return `in ${mins}m`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `in ${hours}h`;
  return `in ${Math.round(hours / 24)}d`;
}

function startCountdown(at: Date, sub: HTMLElement, onElapsed: () => void): void {
  countdownTimer = setInterval(() => {
    if (at.getTime() - Date.now() <= 0) {
      stopCountdown();
      onElapsed();
      return;
    }
    const text = sub.textContent ?? '';
    sub.textContent = text.replace(/(in \d+[mhd]|now)$/, formatCountdown(at));
  }, 15_000);
}

function stopCountdown(): void {
  if (countdownTimer) clearInterval(countdownTimer);
  countdownTimer = null;
}
