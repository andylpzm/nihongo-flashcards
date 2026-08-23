// tilt, glare and foil for a gallery card.
//
// numbers lifted from simeydotme/pokemon-cards-css: the glare tracks the finger
// 1:1 while the foil travels only 37-63% across and 33-67% down. that lag is
// the whole effect - two layers sliding at different rates read as a surface,
// one layer moving alone reads as a sticker.

import { onTilt, resetBase } from './motion';

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

  let raf = 0;
  const tick = (): void => {
    for (const k of Object.keys(S) as (keyof typeof S)[]) {
      const s = S[k];
      s.v += (s.t - s.x) * 0.066;
      s.v *= 0.75;
      s.x += s.v;
    }
    card.style.setProperty('--rotate-x', `${round(S.rx.x, 2)}deg`);
    card.style.setProperty('--rotate-y', `${round(S.ry.x, 2)}deg`);
    card.style.setProperty('--pointer-x', `${round(S.gx.x, 1)}%`);
    card.style.setProperty('--pointer-y', `${round(S.gy.x, 1)}%`);
    card.style.setProperty('--card-opacity', String(round(S.go.x, 3)));
    card.style.setProperty('--pointer-from-center', String(round(S.fc.x, 3)));
    card.style.setProperty('--foil-x', `${round(37 + S.gx.x * 0.26, 1)}%`);
    card.style.setProperty('--foil-y', `${round(33 + S.gy.x * 0.34, 1)}%`);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  const point = (px: number, py: number): void => {
    S.rx.t = round(-((px - 50) / 3.5));
    S.ry.t = round((py - 50) / 3.5);
    S.gx.t = px;
    S.gy.t = py;
    S.go.t = 1;
    // a .35 floor so a card held flat still has some life in it, blooming to 1
    // as it leans - a foil at full strength from the first pixel looks painted on
    S.fc.t = round(0.35 + Math.min(1, Math.hypot(px - 50, py - 50) / 50) * 0.65, 3);
  };
  const rest = (): void => {
    S.rx.t = 0;
    S.ry.t = 0;
    S.gx.t = 50;
    S.gy.t = 50;
    S.go.t = 0;
    S.fc.t = 0;
  };

  let dragging = false;
  const aim = (e: PointerEvent): void => {
    const r = card.getBoundingClientRect();
    point(clamp(round((100 / r.width) * (e.clientX - r.left))), clamp(round((100 / r.height) * (e.clientY - r.top))));
  };

  // the phone's own tilt, when it is allowed to tell us. the finger outranks
  // it: while a thumb is down the card follows the thumb, because a hand
  // resting on the glass is a clearer statement of intent than the wrist.
  let gyro = false;
  // whatever angle the phone is at as this card arrives is its flat
  resetBase();
  const stopTilt = onTilt(({ x, y }) => {
    if (dragging) return;
    gyro = true;
    point(clamp(50 + x * 50), clamp(50 + y * 50));
  });
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
    // with the sensor live the card should not fall flat - the next reading is
    // a frame away and will pick it back up
    if (!gyro) rest();
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
      stopTilt();
      card.removeEventListener('pointerdown', onDown);
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerup', onUp);
      card.removeEventListener('pointercancel', onUp);
      window.removeEventListener('blur', rest);
    },
  };
}
