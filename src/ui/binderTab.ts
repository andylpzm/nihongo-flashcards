// the binder tab, before it is a binder.
//
// chris has been using this app for a while. the binder is new, and telling him
// about it in a changelog or a session summary would spend the surprise on
// text. so the tab starts as a padlock with no name: something is there, it is
// not saying what, and nothing can be done about it yet.
//
// three states, in order, and it only ever moves forwards:
//
//   locked   no picture earned yet. a padlock, no label, taps do nothing.
//   ready    the first picture is earned. the lock lights up and asks to be
//            tapped. that tap reveals the tab - it does NOT open it, because
//            arriving inside the binder is the second beat, not the first.
//   open     a normal tab. this is where it stays forever.

import { FIRST_UNLOCK } from '../srs/gallery';
import { getPointsState, loadProfile, saveProfile } from '../state/profile';
import { FeedbackAudio } from '../audio/feedback';

const LOCK_SVG =
  '<svg viewBox="0 0 24 24" style="fill: currentColor;" aria-hidden="true">' +
  '<path d="M12 17a2 2 0 100-4 2 2 0 000 4zm6-9h-1V6A5 5 0 007 6v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM9 6a3 3 0 016 0v2H9V6z"/>' +
  '</svg>';

type State = 'locked' | 'ready' | 'open';

let state: State = 'open';
let realIcon = '';
let realLabel = '';

const tab = (): HTMLElement | null => document.getElementById('bottom-nav-gallery');
const sideItem = (): HTMLElement | null => document.getElementById('menu-gallery');

function paint(): void {
  const el = tab();
  if (!el) return;
  const icon = el.querySelector('svg');
  const label = el.querySelector('span:not(.nav-badge)');

  el.classList.toggle('is-sealed', state !== 'open');
  el.classList.toggle('is-ready', state === 'ready');
  el.setAttribute('aria-label', state === 'open' ? 'Binder' : 'Locked');

  if (state === 'open') {
    if (icon && realIcon) icon.outerHTML = realIcon;
    if (label) label.textContent = realLabel;
  } else {
    if (icon) icon.outerHTML = LOCK_SVG;
    // no name: a label would answer the question the padlock is asking
    if (label) label.textContent = '';
  }
  // the sidebar is desktop-only, and the same rule applies there
  sideItem()?.classList.toggle('is-sealed', state !== 'open');
}

/** the reveal: the lock gives way to the binder, once. */
async function reveal(): Promise<void> {
  const el = tab();
  if (!el) return;
  state = 'open';
  el.classList.add('is-opening');
  FeedbackAudio.playFanfare();
  paint();
  await saveProfile({ binderRevealed: true });
  window.setTimeout(() => el.classList.remove('is-opening'), 1400);
}

/**
 * whether the tab should let a tap through to the binder.
 *
 * called from the tab's own click handler: a false answer means the tap was
 * spent on the reveal (or on nothing at all, while still locked).
 */
export function binderTapAllowed(): boolean {
  if (state === 'open') return true;
  if (state === 'ready') void reveal();
  return false;
}

/**
 * re-checks the tab. safe to call often - it only ever moves the state
 * forwards, so a session that earns the first picture lights the lock up
 * without waiting for a reload.
 */
export async function refreshBinderTab(): Promise<void> {
  if (state === 'open') return;
  const [profile, points] = await Promise.all([loadProfile(), getPointsState()]);
  if (profile.binderRevealed) state = 'open';
  else state = points.summary.total >= FIRST_UNLOCK ? 'ready' : 'locked';
  paint();
}

export function setupBinderTab(): void {
  const el = tab();
  if (!el) return;
  // remember what the tab is supposed to look like before replacing it
  realIcon = el.querySelector('svg')?.outerHTML ?? '';
  realLabel = el.querySelector('span:not(.nav-badge)')?.textContent ?? 'Binder';
  // assume sealed until the profile says otherwise, so the real tab never
  // flashes into view on a slow boot and gives the game away
  state = 'locked';
  paint();
  void refreshBinderTab();
}
