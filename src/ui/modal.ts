// Shared modal shell used by the story dialogue and the filter drawer
// (index.html + styles/components/modal.css). Handles the mechanics every
// modal needs: focus trap, Escape to close, iOS-safe body scroll lock,
// focus restored to the trigger on close, and drag-to-dismiss on the
// mobile bottom-sheet variant.

export interface ModalController {
  open(): void;
  close(): void;
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export function createModal(overlay: HTMLElement, opts: { onClose?: () => void } = {}): ModalController {
  const sheet = overlay.querySelector<HTMLElement>('.modal-sheet');
  const dragHandle = overlay.querySelector<HTMLElement>('.modal-drag-handle');
  let lastFocused: HTMLElement | null = null;
  let scrollY = 0;

  function getFocusable(): HTMLElement[] {
    if (!sheet) return [];
    return Array.from(sheet.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
      (el) => el.offsetParent !== null
    );
  }

  function onKeydown(e: KeyboardEvent): void {
    if (e.key === 'Escape') {
      e.preventDefault();
      close();
      return;
    }
    if (e.key !== 'Tab') return;
    const focusable = getFocusable();
    if (focusable.length === 0) return;
    const first = focusable[0]!;
    const last = focusable[focusable.length - 1]!;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function onBackdropClick(e: MouseEvent): void {
    if (sheet && !sheet.contains(e.target as Node)) close();
  }

  function open(): void {
    lastFocused = document.activeElement as HTMLElement | null;

    // iOS-safe scroll lock: overflow:hidden alone still lets the background
    // rubber-band scroll behind a fixed overlay on iOS Safari, so pin the
    // body at its current scroll offset instead and restore it on close.
    scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.width = '100%';

    overlay.classList.remove('hidden');
    overlay.addEventListener('keydown', onKeydown);
    overlay.addEventListener('click', onBackdropClick);

    // Focus the dialog itself rather than its first control: focus still
    // enters the trap, but a programmatic focus on a tabindex="-1" container
    // doesn't match :focus-visible, so opening the sheet doesn't slap a
    // keyboard focus ring onto the close button.
    const target = sheet ?? overlay;
    target.setAttribute('tabindex', '-1');
    target.focus();
  }

  function close(): void {
    overlay.classList.add('hidden');
    overlay.removeEventListener('keydown', onKeydown);
    overlay.removeEventListener('click', onBackdropClick);

    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.width = '';
    window.scrollTo(0, scrollY);

    lastFocused?.focus();
    opts.onClose?.();
  }

  if (dragHandle && sheet) {
    setupDragToDismiss(dragHandle, sheet, close);
  }

  return { open, close };
}

function setupDragToDismiss(handle: HTMLElement, sheet: HTMLElement, close: () => void): void {
  let startY = 0;
  let dragging = false;

  const onDown = (e: PointerEvent) => {
    dragging = true;
    startY = e.clientY;
    sheet.style.transition = 'none';
    handle.setPointerCapture(e.pointerId);
  };

  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const dy = Math.max(0, e.clientY - startY);
    sheet.style.transform = `translateY(${dy}px)`;
  };

  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    sheet.style.transition = '';
    const dy = e.clientY - startY;
    sheet.style.transform = '';
    if (dy > 100) close();
  };

  handle.addEventListener('pointerdown', onDown);
  handle.addEventListener('pointermove', onMove);
  handle.addEventListener('pointerup', onUp);
  handle.addEventListener('pointercancel', onUp);
}
