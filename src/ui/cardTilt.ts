// tilt, glare and foil for a gallery card.
//
// the springs, the constants and the pointer maths are from
// simeydotme/pokemon-cards-css (GPL-3.0) - Card.svelte and helpers/Math.js -
// rather than approximated. what used to be here was a hand-rolled
// `v += (t - x) * 0.066; v *= 0.75`, which is svelte's spring with the mass
// term dropped; the settle after you let go was the part that showed it.

/* ---- upstream: src/lib/helpers/Math.js -------------------------------- */
const round = (value: number, precision = 3): number => parseFloat(value.toFixed(precision));
const clamp = (value: number, min = 0, max = 100): number => Math.min(Math.max(value, min), max);
const adjust = (value: number, fromMin: number, fromMax: number, toMin: number, toMax: number): number =>
  round(toMin + ((toMax - toMin) * (value - fromMin)) / (fromMax - fromMin));

/* ---- upstream: svelte/motion, tick_spring() ---------------------------
   ported rather than pulled in: svelte is not a dependency here, and this is
   the only part of it the card needs. `invMass` is what makes `soft` work -
   the spring starts weightless and regains mass over a second, which is the
   slow drift back rather than a snap. */
interface Opts { stiffness: number; damping: number }

// generic over the vector it carries, so `glare.value.o` is a number rather
// than `number | undefined` the way a Record<string, number> index would be
class Spring<T extends Record<string, number>> {
  value: T;
  private last: T;
  private target: T;
  stiffness: number;
  damping: number;
  private invMass = 1;
  private recovery = 0;
  private readonly precision = 0.01;

  constructor(value: T, opts: Opts) {
    this.value = { ...value };
    this.last = { ...value };
    this.target = { ...value };
    this.stiffness = opts.stiffness;
    this.damping = opts.damping;
  }

  set(target: T, opts: { hard?: boolean; soft?: number | boolean } = {}): void {
    this.target = { ...target };
    if (opts.hard) {
      this.value = { ...target };
      this.last = { ...target };
      return;
    }
    if (opts.soft) {
      const rate = typeof opts.soft === 'number' ? opts.soft : 0.5;
      this.recovery = 1 / (rate * 60);
      this.invMass = 0;
    }
  }

  /** true once it has arrived, so the caller can stop the loop */
  tick(dt: number): boolean {
    this.invMass = Math.min(this.invMass + this.recovery, 1);
    let settled = true;
    const next = { ...this.value };
    for (const k of Object.keys(this.target) as (keyof T)[]) {
      // the constraint carries a string index signature, so under
      // noUncheckedIndexedAccess every read here is number|undefined. the three
      // vectors are built in this file and hold nothing but numbers.
      const tgt = this.target[k] as number;
      const cur = this.value[k] as number;
      const prev = this.last[k] as number;
      const delta = tgt - cur;
      const velocity = (cur - prev) / (dt || 1 / 60);
      const acceleration = (this.stiffness * delta - this.damping * velocity) * this.invMass;
      const d = (velocity + acceleration) * dt;
      if (Math.abs(d) < this.precision && Math.abs(delta) < this.precision) {
        next[k] = tgt as T[keyof T];
      } else {
        settled = false;
        next[k] = (cur + d) as T[keyof T];
      }
    }
    this.last = this.value;
    this.value = next;
    return settled;
  }

  /** let go of `soft`, so the next move is at full weight again */
  solid(): void {
    this.invMass = 1;
    this.recovery = 0;
  }
}

const INTERACT: Opts = { stiffness: 0.066, damping: 0.25 };
const SNAP: Opts = { stiffness: 0.01, damping: 0.06 };

/**
 * where a card sits when nothing is touching it.
 *
 * upstream rests at `o: 0` with the pointer dead centre, which turns the
 * finish off TWICE over: --card-opacity goes to zero, and a centred pointer
 * also drives --pointer-from-center to zero, which several of his finishes
 * multiply their own opacity by. right for his site, where a card is one of
 * eighty on a page and should stay quiet until chosen. wrong for our viewer,
 * where the card is the only thing on screen and the finish is the reason it
 * is open - it read as a flat, dark picture until you put a finger on it.
 *
 * so it rests LIT but square: no lean, and the light off to one side rather
 * than centred, because a glare centred on the card has no direction and the
 * from-centre term flattens the foil anyway. raise `o` for more sheen at rest.
 */
const REST = { rot: { x: 0, y: 0 }, glare: { x: 38, y: 32, o: 0.45 }, bg: { x: 44, y: 40 } };

export interface TiltHandle {
  release(): void;
}

export function mountTilt(card: HTMLElement): TiltHandle {
  const rotate = new Spring({ ...REST.rot }, INTERACT);
  const glare = new Spring({ ...REST.glare }, INTERACT);
  const background = new Spring({ ...REST.bg }, INTERACT);
  // a common supertype so the three can be tuned together
  const springs: { stiffness: number; damping: number; solid(): void; tick(dt: number): boolean }[] =
    [rotate, glare, background];

  // the loop stops when the springs arrive. his site keeps a raf running for
  // every card on screen; one card that has settled should cost nothing, and
  // every one of these writes is a gradient stop on a blended, card-sized
  // layer - a repaint, not a cheap property.
  let raf = 0;
  let lastTime = 0;

  // written only when the value actually changes. rounded no finer than the
  // screen can show, or a gyro that never sits still pays a full repaint for a
  // thousandth of a percent.
  const last = new Map<string, string>();
  const put = (name: string, value: string): void => {
    if (last.get(name) === value) return;
    last.set(name, value);
    // on the CARD, not on the `.card` scope above it: our own .gc rule
    // declares --card-opacity, --pointer-x and the rest, and a value set on an
    // ancestor is shadowed by that declaration before it reaches his layers.
    card.style.setProperty(name, value);
  };

  const paint = (): void => {
    const g = glare.value;
    const r = rotate.value;
    const b = background.value;
    put('--pointer-x', `${round(g.x, 1)}%`);
    put('--pointer-y', `${round(g.y, 1)}%`);
    put(
      '--pointer-from-center',
      String(round(clamp(Math.hypot(g.x - 50, g.y - 50) / 50, 0, 1), 2))
    );
    put('--pointer-from-top', String(round(g.y / 100, 2)));
    put('--pointer-from-left', String(round(g.x / 100, 2)));
    put('--card-opacity', String(round(g.o, 2)));
    put('--rotate-x', `${round(r.x, 2)}deg`);
    put('--rotate-y', `${round(r.y, 2)}deg`);
    put('--background-x', `${round(b.x, 1)}%`);
    put('--background-y', `${round(b.y, 1)}%`);
  };

  const tick = (now: number): void => {
    // svelte measures dt in sixtieths of a second, and tick_spring is written
    // against that scale - passing seconds or milliseconds changes the feel
    const dt = lastTime ? ((now - lastTime) * 60) / 1000 : 1;
    lastTime = now;
    let settled = true;
    for (const s of springs) settled = s.tick(dt) && settled;
    paint();
    if (settled) {
      raf = 0;
      lastTime = 0;
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  const wake = (): void => {
    if (!raf) {
      lastTime = 0;
      raf = requestAnimationFrame(tick);
    }
  };
  paint();

  /* ---- upstream: Card.svelte interact() / interactEnd() ---------------
     his interact() does not touch the springs directly - it stashes the
     latest pointer position and schedules ONE spring update per frame. safari
     coalesces pointermove and can deliver several per frame, and each one
     here would otherwise re-target six springs and re-read the card's rect.
     the rect read is the expensive half: getBoundingClientRect forces layout,
     and doing it twice in a frame is two forced layouts for one paint. */
  let pending: PointerEvent | null = null;
  let inputRaf = 0;
  const aim = (e: PointerEvent): void => {
    pending = e;
    if (inputRaf) return;
    inputRaf = requestAnimationFrame(() => {
      inputRaf = 0;
      const ev = pending;
      pending = null;
      if (ev) apply(ev);
    });
  };

  const apply = (e: PointerEvent): void => {
    const rect = card.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const percent = {
      x: clamp(round((100 / rect.width) * (e.clientX - rect.left))),
      y: clamp(round((100 / rect.height) * (e.clientY - rect.top))),
    };
    const center = { x: percent.x - 50, y: percent.y - 50 };

    for (const s of springs) {
      s.stiffness = INTERACT.stiffness;
      s.damping = INTERACT.damping;
      s.solid();
    }
    background.set({ x: adjust(percent.x, 0, 100, 37, 63), y: adjust(percent.y, 0, 100, 33, 67) });
    rotate.set({ x: round(-(center.x / 3.5)), y: round(center.y / 3.5) });
    glare.set({ x: percent.x, y: percent.y, o: 1 });
    wake();
  };

  const rest = (): void => {
    for (const s of springs) {
      s.stiffness = SNAP.stiffness;
      s.damping = SNAP.damping;
    }
    rotate.set({ ...REST.rot }, { soft: 1 });
    glare.set({ ...REST.glare }, { soft: 1 });
    background.set({ ...REST.bg }, { soft: 1 });
    wake();
  };

  let dragging = false;
  const onDown = (e: PointerEvent): void => {
    dragging = true;
    // capture, or a drag stops tracking the moment the finger leaves the card
    try {
      card.setPointerCapture(e.pointerId);
    } catch {
      /* a synthetic event has no real pointer to capture */
    }
    aim(e);
  };
  const onMove = (e: PointerEvent): void => {
    // press to tilt. a mouse used to lean the card on hover, the way his site
    // does, but the card is handled here rather than browsed past - a pointer
    // crossing it on the way somewhere else lit it up and left it leaning.
    // mouse and finger now behave the same: nothing moves until you press.
    if (dragging) aim(e);
  };
  const onUp = (): void => {
    if (!dragging) return;
    dragging = false;
    rest();
  };
  // hovering away has to settle the card too, or a mouse leaves it leaning
  const onLeave = (): void => {
    if (!dragging) rest();
  };

  // a card cannot be handled while the tab is in the background, and his
  // Card.svelte gates on exactly this. it also matters on ios, where coming
  // back to a backgrounded tab otherwise resumes a half-finished lean.
  const onHidden = (): void => {
    if (document.visibilityState !== 'visible') {
      dragging = false;
      rest();
    }
  };
  document.addEventListener('visibilitychange', onHidden);

  card.addEventListener('pointerdown', onDown);
  card.addEventListener('pointermove', onMove);
  card.addEventListener('pointerup', onUp);
  // ios drops pointercancel when a sheet is swiped away, and the card would
  // stay stuck mid-lean without the blur
  card.addEventListener('pointercancel', onUp);
  card.addEventListener('pointerleave', onLeave);
  window.addEventListener('blur', rest);

  return {
    release(): void {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(inputRaf);
      document.removeEventListener('visibilitychange', onHidden);
      card.removeEventListener('pointerdown', onDown);
      card.removeEventListener('pointermove', onMove);
      card.removeEventListener('pointerup', onUp);
      card.removeEventListener('pointercancel', onUp);
      card.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', rest);
    },
  };
}
