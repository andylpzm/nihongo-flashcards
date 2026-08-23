// device tilt, for a card held in a hand.
//
// the browser reports the phone's attitude in the DEVICE's frame - beta is
// front-back and gamma is left-right of the phone itself, whichever way the
// screen happens to be rotated. the arc cards are meant to be looked at with
// the phone turned sideways, so using beta/gamma raw would tilt those cards
// along the wrong axis. everything here is about getting from that frame into
// the frame of what you are actually looking at.

/** how far you have to lean the phone for the card to reach full tilt */
const RANGE = 22;

/** shortest way round: beta wraps at 180, and a lean across that seam would
    otherwise read as a 360 degree flick */
export function wrap(d: number): number {
  return ((((d + 180) % 360) + 360) % 360) - 180;
}

const clamp1 = (v: number): number => Math.min(Math.max(v, -1), 1);

export interface Attitude {
  beta: number;
  gamma: number;
}

/**
 * device attitude -> where the light should sit, as -1..1 on each screen axis.
 *
 * `screenAngle` is screen.orientation.angle: how far the CONTENT is rotated
 * from the device's natural orientation. the tilt vector is rotated by the same
 * amount so that "lean the top of the screen away from you" always means the
 * same thing, portrait or landscape.
 */
export function tiltFromOrientation(now: Attitude, base: Attitude, screenAngle: number): { x: number; y: number } {
  const g = wrap(now.gamma - base.gamma);
  const b = wrap(now.beta - base.beta);
  const rad = (screenAngle * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return {
    x: clamp1((g * cos + b * sin) / RANGE),
    y: clamp1((-g * sin + b * cos) / RANGE),
  };
}

// ---- the live sensor ----------------------------------------------------

type Listener = (t: { x: number; y: number }) => void;

const listeners = new Set<Listener>();
let bound = false;
let base: Attitude | null = null;

/** ios asks before it will report anything; everyone else just reports */
interface IosDeviceOrientation {
  requestPermission?: () => Promise<'granted' | 'denied' | 'default'>;
}

export function motionAvailable(): boolean {
  // the api is absent outside a secure context, which is exactly what a phone
  // on http over the local network is
  return typeof window !== 'undefined' && 'DeviceOrientationEvent' in window;
}

function screenAngle(): number {
  return screen.orientation?.angle ?? 0;
}

function onOrientation(e: DeviceOrientationEvent): void {
  if (e.beta == null || e.gamma == null || !motionEnabled()) return;
  const now = { beta: e.beta, gamma: e.gamma };
  // the first reading is the rest position: however you happen to be holding
  // the phone when the card opens is "flat", so it works lying down too
  base ??= now;
  const t = tiltFromOrientation(now, base, screenAngle());
  for (const fn of listeners) fn(t);
}

/**
 * asks for the sensor. must be called from inside a real user gesture on ios,
 * or the request is rejected outright. safe to call repeatedly.
 */
export async function requestMotion(): Promise<boolean> {
  if (!motionAvailable() || !motionEnabled()) return false;
  const ctor = window.DeviceOrientationEvent as unknown as IosDeviceOrientation;
  if (typeof ctor.requestPermission === 'function') {
    try {
      if ((await ctor.requestPermission()) !== 'granted') {
        denied = true;
        return false;
      }
      denied = false;
    } catch {
      denied = true;
      return false;
    }
  }
  if (!bound) {
    window.addEventListener('deviceorientation', onOrientation);
    // a turn of the phone changes which axis is which, and the old rest
    // position was recorded in the old frame
    window.addEventListener('orientationchange', resetBase);
    bound = true;
  }
  return true;
}

/** forgets the rest position, so the next reading becomes flat again */
export function resetBase(): void {
  base = null;
}

export function onTilt(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// ---- the preference ------------------------------------------------------
//
// ios only offers the prompt from inside a user gesture, and once it has been
// answered "no" it stops asking for the rest of the page's life - a later
// request just returns denied without showing anything. so a wrong tap is
// sticky, and the only honest cure is to say so and let the app be reopened.

const PREF_KEY = 'nihongo_motion';

export type MotionState = 'unsupported' | 'off' | 'asking' | 'live' | 'denied';

let denied = false;

export function motionEnabled(): boolean {
  try {
    return localStorage.getItem(PREF_KEY) !== 'off';
  } catch {
    return true;
  }
}

export function setMotionEnabled(on: boolean): void {
  try {
    localStorage.setItem(PREF_KEY, on ? 'on' : 'off');
  } catch {
    /* private mode; the session still honours the toggle in memory */
  }
  if (on) void requestMotion();
  else resetBase();
}

export function motionState(): MotionState {
  if (!motionAvailable()) return 'unsupported';
  if (!motionEnabled()) return 'off';
  if (denied) return 'denied';
  return bound ? 'live' : 'asking';
}

/**
 * takes the sensor at the first touch anywhere, so a card is already live when
 * it opens rather than dead until it is prodded - the unlock reveal is the one
 * card that most wants the shine and the one you are least likely to poke.
 */
export function armMotion(): void {
  if (!motionAvailable() || !motionEnabled()) return;
  const go = (): void => {
    document.removeEventListener('pointerdown', go);
    void requestMotion();
  };
  document.addEventListener('pointerdown', go, { once: true });
}
