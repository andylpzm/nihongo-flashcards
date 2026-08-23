// the Progress tab's two cues: how far through the day you are, and xp waiting.
//
// a bare dot only ever said "something" - a ring says how much of the day is
// left, which is the thing worth acting on before you study.

const RADIUS = 6.2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ensureRing(tab: HTMLElement): SVGCircleElement | null {
  let mark = tab.querySelector<HTMLElement>('.nav-ring');
  if (!mark) {
    mark = document.createElement('span');
    mark.className = 'nav-ring';
    mark.innerHTML = `<svg viewBox="0 0 16 16" aria-hidden="true"><g transform="rotate(-90 8 8)">
      <circle class="nav-ring-track" cx="8" cy="8" r="${RADIUS}" fill="none" stroke-width="2.6"/>
      <circle class="nav-ring-fill" cx="8" cy="8" r="${RADIUS}" fill="none" stroke-width="2.6"
              stroke-linecap="round" stroke-dasharray="${CIRCUMFERENCE}" stroke-dashoffset="${CIRCUMFERENCE}"/>
    </g></svg>`;
    tab.appendChild(mark);
  }
  return mark.querySelector<SVGCircleElement>('.nav-ring-fill');
}

/**
 * the day's progress as a ring, and a pop when the last deck lands.
 *
 * the ring is removed once the day is done and collected, so a finished day
 * leaves the tab bar clean rather than permanently marked.
 */
export function syncDailyRing(done: number, total: number, keepWhenFull: boolean): void {
  const tab = document.getElementById('bottom-nav-stats');
  if (!tab) return;

  if (done === 0 || (done >= total && !keepWhenFull)) {
    tab.querySelector('.nav-ring')?.remove();
    return;
  }

  const mark = tab.querySelector('.nav-ring');
  const wasFull = mark?.classList.contains('is-full') ?? false;
  const fill = ensureRing(tab);
  if (!fill) return;

  const fraction = total > 0 ? Math.min(1, done / total) : 0;
  fill.style.strokeDashoffset = String(CIRCUMFERENCE - CIRCUMFERENCE * fraction);

  const holder = tab.querySelector<HTMLElement>('.nav-ring');
  holder?.classList.toggle('is-full', done >= total);

  // the seal only fires on the transition, not on every repaint
  if (done >= total && !wasFull && holder && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    holder.animate(
      [{ transform: 'scale(1)' }, { transform: 'scale(1.3)', offset: 0.4 }, { transform: 'scale(1)' }],
      { duration: 540, easing: 'cubic-bezier(.3,.9,.4,1)' }
    );
  }
}

/** xp banked while you were elsewhere, waiting to be counted up on Progress */
export function syncPendingXp(pending: number): void {
  const tab = document.getElementById('bottom-nav-stats');
  if (!tab) return;
  let pill = tab.querySelector<HTMLElement>('.nav-pill');

  if (pending <= 0) {
    pill?.remove();
    return;
  }
  const isNew = !pill;
  if (!pill) {
    pill = document.createElement('span');
    pill.className = 'nav-pill';
    tab.appendChild(pill);
  }
  const label = `+${pending.toLocaleString()}`;
  const changed = pill.textContent !== label;
  pill.textContent = label;

  if ((isNew || changed) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    pill.animate(
      [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1.3)', opacity: 1, offset: 0.55 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      { duration: 460, easing: 'cubic-bezier(.3,.9,.4,1)' }
    );
  }
}
