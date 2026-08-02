// Pointer Events unify mouse and touch, replacing the old hand-rolled
// touchstart/click long-press hack (B14) that needed a 1000ms click-suppression
// window to avoid double-firing. Long-press here suppresses only the exact
// click that pointerup would otherwise generate for that same gesture.

const MOVE_CANCEL_THRESHOLD = 10;

export interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  /** Live drag-follow while the pointer is down, dx in CSS px from the start point. */
  onDragMove?: (dx: number) => void;
  /** Fired on pointerup/cancel; `committed` is true when a swipe threshold was crossed. */
  onDragEnd?: (committed: boolean) => void;
  threshold?: number;
}

export function onSwipe(el: HTMLElement, handlers: SwipeHandlers): () => void {
  const threshold = handlers.threshold ?? 60;
  let startX = 0;
  let startY = 0;
  let active = false;
  let horizontal = false;
  let suppressNextClick = false;

  const onClick = (e: MouseEvent) => {
    if (suppressNextClick) {
      suppressNextClick = false;
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!e.isPrimary) return;
    startX = e.clientX;
    startY = e.clientY;
    active = true;
    horizontal = false;
    el.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!active) return;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    if (!horizontal) {
      // Decide gesture direction once past a small dead zone, so a mostly
      // vertical drag is left alone for the page (touch-action: pan-y) to
      // scroll instead of being captured as a swipe.
      if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
      horizontal = Math.abs(dx) > Math.abs(dy);
      if (!horizontal) {
        active = false;
        return;
      }
    }
    handlers.onDragMove?.(dx);
  };

  const endGesture = (e: PointerEvent) => {
    if (!active) return;
    active = false;
    const dx = e.clientX - startX;
    const committed = horizontal && Math.abs(dx) > threshold;
    if (committed) {
      suppressNextClick = true;
      if (dx < 0) handlers.onSwipeLeft?.();
      else handlers.onSwipeRight?.();
    }
    handlers.onDragEnd?.(committed);
  };

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', endGesture);
  el.addEventListener('pointercancel', endGesture);
  // Capture phase so a committed swipe's synthetic click never reaches the
  // element's own bubble-phase listeners (e.g. the flip-on-click handler).
  el.addEventListener('click', onClick, true);

  return () => {
    el.removeEventListener('pointerdown', onPointerDown);
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerup', endGesture);
    el.removeEventListener('pointercancel', endGesture);
    el.removeEventListener('click', onClick, true);
  };
}

export function onLongPress(el: HTMLElement, fn: (e: PointerEvent) => void, delay = 500): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  let startX = 0;
  let startY = 0;
  let suppressNextClick = false;

  const clear = () => {
    if (timer) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const onPointerDown = (e: PointerEvent) => {
    if (!e.isPrimary) return;
    startX = e.clientX;
    startY = e.clientY;
    clear();
    timer = setTimeout(() => {
      timer = null;
      suppressNextClick = true;
      if ('vibrate' in navigator) navigator.vibrate(50);
      fn(e);
    }, delay);
  };

  const onPointerMove = (e: PointerEvent) => {
    if (!timer) return;
    if (Math.abs(e.clientX - startX) > MOVE_CANCEL_THRESHOLD || Math.abs(e.clientY - startY) > MOVE_CANCEL_THRESHOLD) {
      clear();
    }
  };

  const onClick = (e: MouseEvent) => {
    if (suppressNextClick) {
      suppressNextClick = false;
      e.preventDefault();
      e.stopImmediatePropagation();
    }
  };

  el.addEventListener('pointerdown', onPointerDown);
  el.addEventListener('pointermove', onPointerMove);
  el.addEventListener('pointerup', clear);
  el.addEventListener('pointercancel', clear);
  // Capture phase so this runs before other click listeners bound in the
  // bubble phase (e.g. the toggle/isolate click handler on the same chip).
  el.addEventListener('click', onClick, true);

  return () => {
    clear();
    el.removeEventListener('pointerdown', onPointerDown);
    el.removeEventListener('pointermove', onPointerMove);
    el.removeEventListener('pointerup', clear);
    el.removeEventListener('pointercancel', clear);
    el.removeEventListener('click', onClick, true);
  };
}
