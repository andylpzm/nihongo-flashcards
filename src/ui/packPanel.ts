// connecting the picture pack: the settings row, and the screen the gallery
// shows in its place.
//
// the first ask happens on the opening screen (ui/splash.ts), which is the
// honest place for it - the app genuinely cannot finish loading its pictures
// without the file. everything here shares that one picker.

import { connectPack, isConnected } from '../state/vault';

const LISTENERS = new Set<() => void>();
export function onPackChange(fn: () => void): void {
  LISTENERS.add(fn);
}
const announce = (): void => LISTENERS.forEach((fn) => fn());

/**
 * the file picker, shared by every entry point.
 *
 * `done` is called with the pack in place. every caller dismisses itself there
 * rather than leaving that to whoever re-renders next: the panel that just said
 * "found your pictures" is the one thing that must not still be on screen.
 */
export function pickPack(onDone: (msg: string, ok: boolean) => void, done?: () => void): void {
  const input = document.createElement('input');
  input.type = 'file';
  // no accept filter: ios files hides unknown extensions behind "all files"
  // anyway, and a filter here made the pack ungreyed-out but unselectable
  input.style.display = 'none';
  document.body.appendChild(input);
  input.addEventListener('change', () => {
    const file = input.files?.[0];
    input.remove();
    if (!file) return;
    onDone('Opening…', true);
    void connectPack(file)
      .then(() => {
        // no count: how many pictures there are is the thing being saved up for
        onDone('Connected.', true);
        announce();
        done?.();
      })
      .catch((e: unknown) => onDone(e instanceof Error ? e.message : String(e), false));
  });
  input.click();
}

export function setupPackPanel(): void {
  const title = document.getElementById('pack-state');
  const note = document.getElementById('pack-note');
  const btn = document.getElementById('btn-pack');

  const sync = (): void => {
    if (!title || !note || !btn) return;
    const on = isConnected();
    title.textContent = on ? 'Connected' : 'Not connected';
    note.textContent = on
      ? 'Your cards are on this phone.'
      : 'The cards live in a file of their own. Choose it once and it stays.';
    btn.textContent = on ? 'Replace' : 'Connect';
  };

  btn?.addEventListener('click', () =>
    pickPack(
      (msg) => {
        if (note) note.textContent = msg;
      },
      () => {
        sync();
        // the gallery behind the sheet has just filled in; staying open hides it
        setTimeout(() => document.getElementById('btn-close-settings')?.click(), 900);
      },
    ),
  );

  onPackChange(sync);
  document.querySelectorAll<HTMLElement>('.btn-open-settings').forEach((b) => b.addEventListener('click', sync));
  sync();
}

/**
 * whether the gallery can show anything.
 *
 * in the repo the artwork is still sitting in public/, so the gallery works
 * without a pack and there is nothing to gate. the built app ships none of it.
 */
export function picturesReady(): boolean {
  return isConnected() || import.meta.env.DEV;
}

/**
 * what the gallery shows instead of itself when there is no pack. the binder is
 * not worth opening empty - three hundred blank frames is a broken app, not a
 * gallery waiting to be filled.
 */
export function packGate(): HTMLElement {
  const el = document.createElement('div');
  el.className = 'pack-gate';
  el.innerHTML =
    '<div class="pack-gate-art" aria-hidden="true"></div>' +
    '<h3>Your cards live in their own file</h3>' +
    '<p>It came with the app, so nobody else can open them. Choose it once and it stays on this phone.</p>' +
    '<button class="btn btn-primary">Choose the file</button>' +
    '<span class="pack-gate-note"></span>';
  el.querySelector('button')!.addEventListener('click', () =>
    pickPack(
      (msg, ok) => {
        const note = el.querySelector('.pack-gate-note')!;
        note.textContent = msg;
        note.classList.toggle('is-bad', !ok);
      },
      () => el.remove(),
    ),
  );
  return el;
}
