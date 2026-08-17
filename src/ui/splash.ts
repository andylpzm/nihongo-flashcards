// Opening screen.
//
// The counter is not pure theatre: it eases toward 90% on its own, then only
// completes once init() actually resolves (deck loaded, migration done). So
// the number never claims to be finished while the app is still working, and
// on a slow phone the screen holds instead of flashing past. A floor of
// MIN_MS stops it flickering on a fast reload, where init finishes in ~40ms
// and an instant splash would read as a glitch.

const MIN_MS = 1500;
/** Where the self-driven ease parks until real readiness lands. */
const CREEP_CEILING = 90;

export interface SplashHandle {
  /** Run the counter to 100, play the exit, and remove the element. */
  finish: () => Promise<void>;
}

export function startSplash(): SplashHandle {
  const el = document.getElementById('splash');
  const pctEl = document.getElementById('splash-pct');
  const fillEl = document.getElementById('splash-fill');

  if (!el || !pctEl || !fillEl) {
    return { finish: () => Promise.resolve() };
  }

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const startedAt = performance.now();
  let shown = 0;
  let raf = 0;

  const paint = (v: number) => {
    shown = v;
    pctEl.textContent = `${Math.round(v)}%`;
    fillEl.style.width = `${v}%`;
  };

  const creep = () => {
    const t = Math.min(1, (performance.now() - startedAt) / MIN_MS);
    // Decelerating: quick to feel responsive, slow as it approaches the
    // ceiling so it never sits visibly stuck on one number.
    paint(CREEP_CEILING * (1 - Math.pow(1 - t, 3)));
    if (shown < CREEP_CEILING) raf = requestAnimationFrame(creep);
  };

  if (reduced) paint(CREEP_CEILING);
  else raf = requestAnimationFrame(creep);

  const finish = async (): Promise<void> => {
    const heldFor = performance.now() - startedAt;
    if (heldFor < MIN_MS) await new Promise((r) => setTimeout(r, MIN_MS - heldFor));

    cancelAnimationFrame(raf);

    if (!reduced) {
      // Run out the last stretch so 100% is actually seen, not skipped.
      await new Promise<void>((resolve) => {
        const from = shown;
        const t0 = performance.now();
        const run = () => {
          const t = Math.min(1, (performance.now() - t0) / 260);
          paint(from + (100 - from) * t);
          if (t < 1) requestAnimationFrame(run);
          else resolve();
        };
        requestAnimationFrame(run);
      });
      await new Promise((r) => setTimeout(r, 180));
    } else {
      paint(100);
    }

    el.classList.add('is-leaving');
    await new Promise((r) => setTimeout(r, reduced ? 0 : 1250));
    el.remove();
    document.body.classList.remove('splash-open');
  };

  return { finish };
}
