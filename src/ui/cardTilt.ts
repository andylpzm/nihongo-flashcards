// tilt, glare and foil for a gallery card.
//
// numbers lifted from simeydotme/pokemon-cards-css: the glare tracks the finger
// 1:1 while the foil travels only 37-63% across and 33-67% down. that lag is
// the whole effect - two layers sliding at different rates read as a surface,
// one layer moving alone reads as a sticker.


interface Spring {
  v: number;
  x: number;
  t: number;
}
const spring = (x = 0): Spring => ({ v: 0, x, t: x });

const round = (v: number, p = 3): number => parseFloat(v.toFixed(p));
const clamp = (v: number, a = 0, b = 100): number => Math.min(Math.max(v, a), b);

export interface TiltHandle {
  release(): void;
}

export function mountTilt(card: HTMLElement): TiltHandle {
  const S = {
    rx: spring(),
    ry: spring(),
    gx: spring(50),
    gy: spring(50),
    go: spring(),
    fc: spring(),
  };

  // the loop STOPS when the springs have arrived.
  //
  // it used to run for as long as the card was on screen, writing eight custom
  // properties a frame whether or not anything had moved. four of those feed
  // gradients - the glare, both foils - so a card lying perfectly still was
  // repainting several blended full-card layers sixty times a second. free on a
  // laptop; on an iphone it is the choppiness, and it is also the battery.
  // anything that moves a target calls wake().
  let raf = 0;
  const settled = (): boolean => {
    for (const k of Object.keys(S) as (keyof typeof S)[]) {
      const s = S[k];
      if (Math.abs(s.t - s.x) > 0.01 || Math.abs(s.v) > 0.01) return false;
    }
    return true;
  };
  // every one of these is a gradient stop or an opacity, so a write is a repaint
  // of a blended, card-sized layer. written only when the value actually
  // changes, and rounded no finer than the screen can show: the glare was being
  // nudged by a thousandth of a percent on a gyro that never sits perfectly
  // still, and paying a full repaint for it.
  const last = new Map<string, string>();
  const put = (name: string, value: string): void => {
    if (last.get(name) === value) return;
    last.set(name, value);
    card.style.setProperty(name, value);
  };
  const paint = (): void => {
    put('--rotate-x', `${round(S.rx.x, 2)}deg`);
    put('--rotate-y', `${round(S.ry.x, 2)}deg`);
    put('--pointer-x', `${round(S.gx.x, 1)}%`);
    put('--pointer-y', `${round(S.gy.x, 1)}%`);
    put('--card-opacity', String(round(S.go.x, 2)));
    put('--pointer-from-center', String(round(S.fc.x, 2)));
    put('--foil-x', `${round(37 + S.gx.x * 0.26, 1)}%`);
    put('--foil-y', `${round(33 + S.gy.x * 0.34, 1)}%`);
  };
  const tick = (): void => {
    for (const k of Object.keys(S) as (keyof typeof S)[]) {
      const s = S[k];
      s.v += (s.t - s.x) * 0.066;
      s.v *= 0.75;
      s.x += s.v;
    }
    if (settled()) {
      // land exactly on the target, so the last frame is not a fraction short
      for (const k of Object.keys(S) as (keyof typeof S)[]) {
        S[k].x = S[k].t;
        S[k].v = 0;
      }
      paint();
      raf = 0;
      return;
    }
    paint();
    raf = requestAnimationFrame(tick);
  };
  const wake = (): void => {
    if (!raf) raf = requestAnimationFrame(tick);
  };
  paint();

  const point = (px: number, py: number): void => {
    S.rx.t = round(-((px - 50) / 3.5));
    S.ry.t = round((py - 50) / 3.5);
    S.gx.t = px;
    S.gy.t = py;
    S.go.t = 1;
    // a .35 floor so a card held flat still has some life in it, blooming to 1
    // as it leans - a foil at full strength from the first pixel looks painted on
    S.fc.t = round(0.35 + Math.min(1, Math.hypot(px - 50, py - 50) / 50) * 0.65, 3);
    wake();
  };
  const rest = (): void => {
    S.rx.t = 0;
    S.ry.t = 0;
    S.gx.t = 50;
    S.gy.t = 50;
    S.go.t = 0;
    S.fc.t = 0;
    wake();
  };

  let dragging = false;
  const aim = (e: PointerEvent): void => {
    const r = card.getBoundingClientRect();
    point(clamp(round((100 / r.width) * (e.clientX - r.left))), clamp(round((100 / r.height) * (e.clientY - r.top))));
  };

  const onDown = (e: PointerEvent): void => {
    dragging = true;
    card.setPointerCapture(e.pointerId);
    aim(e);
  };
  const onMove = (e: PointerEvent): void => {
    if (dragging) aim(e);
  };
  const onUp = (): void => {
    dragging = false;
    rest();
  };

  card.addEventListener('pointerdown', onDown);
  card.addEventListener('pointermove', onMove);
  card.addEventListener('pointerup', onUp);
  // ios drops pointercancel when a sheet is swiped away, and the card would
  // stay stuck mid-lean without the blur
  card.addEventListener('pointercancel', onUp);
  window.addEventListener('blur', rest);

  return {
    release(): void {
      cancelAnimationFrame(raf);
      card.removeEventListener('pointerdown', onDown);
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerup', onUp);
      card.removeEventListener('pointercancel', onUp);
      window.removeEventListener('blur', rest);
    },
  };
}
