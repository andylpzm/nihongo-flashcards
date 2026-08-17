// Page-card pager.
//
// Replaces the small pill switchers (Study/Browse, Hiragana/Katakana/Kanji)
// with a big page title, a dot indicator, and a long horizontal swipe. The
// incoming page slides in *over* the outgoing one like a card being dealt,
// rather than the two sliding together as a filmstrip - the outgoing page
// stays put and dims, so the movement reads as "a new page arrived" instead
// of "the world scrolled".
//
// Why the swipe is long (SWIPE_THRESHOLD, ~36% of the viewport): paging is
// destructive-ish navigation - it throws away what you were looking at - and
// the card viewport already claims short horizontal swipes for next/previous
// card. A long, deliberate drag can't be triggered by a sloppy card flick.

import { onSwipe } from './gestures';

/** Fraction of viewport width a drag must cross to commit a page change. */
const SWIPE_THRESHOLD_RATIO = 0.36;
/** How far the outgoing page follows the finger, as a fraction of the drag. */
const DRAG_DAMPING = 0.22;
const ANIM_MS = 340;

export interface PagerPage {
  /** Stable id handed back to onChange. */
  id: string;
  /** Big heading shown when this page is active. */
  title: string;
  /** Optional label for the dot's accessible name (defaults to title). */
  label?: string;
}

export interface PagerOptions {
  pages: PagerPage[];
  initial?: string;
  /** The element whose content is animated. Its contents are cloned mid-swipe. */
  content: HTMLElement;
  /** Called after the active page changes; render the new page's content here. */
  onChange: (id: string, previousId: string) => void;
  /** Return true to refuse page changes (e.g. a session is running). */
  isLocked?: () => boolean;
}

export interface PagerController {
  /** Switch pages programmatically. Animates unless `animate` is false. */
  goTo: (id: string, animate?: boolean) => void;
  getActive: () => string;
  /** Re-read the title for the active page (after a language/label change). */
  refresh: () => void;
}

export function createPager(host: HTMLElement, opts: PagerOptions): PagerController {
  const { pages, content } = opts;
  // The page is a physical card sitting on a stack; the stage owns the stack
  // edges peeking out behind it and the direction of the current deal.
  content.classList.add('pager-card');
  const stage = content.parentElement;
  let activeId = opts.initial ?? pages[0]!.id;
  let animating = false;

  // ---- header: big title + dots -------------------------------------------
  const header = document.createElement('div');
  header.className = 'pager-header';

  const titleEl = document.createElement('h2');
  titleEl.className = 'pager-title';

  const dots = document.createElement('div');
  dots.className = 'pager-dots';
  dots.setAttribute('role', 'tablist');

  // Dots are real buttons, not decoration: the swipe is an accelerator, and
  // every gesture in this app needs a tappable equivalent.
  const dotEls = pages.map((page) => {
    const dot = document.createElement('button');
    dot.className = 'pager-dot';
    dot.type = 'button';
    dot.setAttribute('role', 'tab');
    dot.setAttribute('aria-label', page.label ?? page.title);
    dot.addEventListener('click', () => goTo(page.id));
    dots.appendChild(dot);
    return dot;
  });

  header.append(titleEl, dots);
  host.prepend(header);

  function indexOf(id: string): number {
    return Math.max(0, pages.findIndex((p) => p.id === id));
  }

  function syncHeader(): void {
    const i = indexOf(activeId);
    // The deck is a ring, so there is always another card behind this one -
    // the stack must not thin out, or the last page would look like a dead
    // end right where it still swipes round to the first.
    // One peek edge per other card in the deck, capped at two. A two-card
    // deck must show one edge, not two - the stack has to match the dots.
    stage?.setAttribute('data-remaining', String(Math.min(2, pages.length - 1)));
    const nextTitle = pages[i]!.title;
    if (titleEl.textContent !== nextTitle) {
      titleEl.textContent = nextTitle;
      // Restart the cross-fade: removing the class alone won't replay an
      // animation without a reflow between the two writes.
      titleEl.classList.remove('is-changing');
      void titleEl.offsetWidth;
      titleEl.classList.add('is-changing');
    }
    dotEls.forEach((dot, n) => {
      dot.classList.toggle('is-active', n === i);
      dot.setAttribute('aria-selected', String(n === i));
    });
  }

  // ---- the deal-a-card transition -----------------------------------------
  // The outgoing content is frozen as a clone pinned under the live content,
  // so the live content can be re-rendered immediately and then slid over the
  // top. One code path covers both "pages are separate DOM sections" (kana)
  // and "same section, different state" (study/browse).
  function animateTo(id: string, direction: 1 | -1): void {
    const previousId = activeId;
    activeId = id;
    animating = true;

    const rect = content.getBoundingClientRect();
    const ghost = content.cloneNode(true) as HTMLElement;
    ghost.classList.add('pager-ghost');
    ghost.style.height = `${rect.height}px`;
    ghost.setAttribute('aria-hidden', 'true');
    // Strip every id from the clone. The ghost sits *before* the live content,
    // so a duplicated id makes getElementById resolve to the ghost's copy -
    // which silently sent the async kanji grid render into the throwaway clone
    // and left the real container empty.
    ghost.removeAttribute('id');
    ghost.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    ghost.querySelectorAll('input,button,a,[tabindex]').forEach((el) => {
      el.setAttribute('tabindex', '-1');
    });
    content.parentElement?.insertBefore(ghost, content);

    syncHeader();
    opts.onChange(id, previousId);

    const dirClass = direction === 1 ? 'is-forward' : 'is-back';
    stage?.classList.add(dirClass);
    content.classList.add('pager-incoming');

    const done = () => {
      content.classList.remove('pager-incoming');
      stage?.classList.remove('is-forward', 'is-back');
      ghost.remove();
      animating = false;
    };
    // Belt and braces: animationend can be missed if the element is hidden
    // mid-flight (switching sections during a swipe), which would strand the
    // ghost on screen forever.
    content.addEventListener('animationend', done, { once: true });
    window.setTimeout(done, ANIM_MS + 120);
  }

  function goTo(id: string, animate = true, forced?: 1 | -1): void {
    if (id === activeId || animating) return;
    if (opts.isLocked?.()) return;
    // On a wrap the index comparison lies - going from the last card to the
    // first is forwards, even though the index drops - so a stepped swipe
    // passes its own direction.
    const direction: 1 | -1 = forced ?? (indexOf(id) > indexOf(activeId) ? 1 : -1);
    if (!animate) {
      const previousId = activeId;
      activeId = id;
      syncHeader();
      opts.onChange(id, previousId);
      return;
    }
    animateTo(id, direction);
  }

  /** Steps wrap: the deck is a ring, so the last card leads back to the first. */
  function step(delta: number): void {
    if (pages.length < 2) return;
    const next = (indexOf(activeId) + delta + pages.length) % pages.length;
    goTo(pages[next]!.id, true, delta > 0 ? 1 : -1);
  }

  // ---- swipe --------------------------------------------------------------
  // Bound to the whole section. The card viewport owns its own short swipe
  // (next/previous card), so gestures starting inside it are ignored here -
  // that's the rule that lets both gestures coexist: the card keeps its
  // swipe, everything around it pages.
  onSwipe(host, {
    threshold: Math.max(96, Math.round(window.innerWidth * SWIPE_THRESHOLD_RATIO)),
    // Only elements that own a competing horizontal gesture opt out. The kana
    // grid does not - excluding it would leave a thin strip as the only
    // swipeable part of the page.
    ignoreFrom: '.card-viewport, .modal-overlay',
    onDragMove: (dx) => {
      if (animating || opts.isLocked?.()) return;
      const damped = dx * DRAG_DAMPING;
      content.style.transform = `translateX(${damped}px)`;
      header.style.transform = `translateX(${damped * 0.5}px)`;
    },
    onDragEnd: () => {
      content.style.transform = '';
      header.style.transform = '';
    },
    onSwipeLeft: () => step(1),
    onSwipeRight: () => step(-1),
  });

  // Keyboard equivalent for the swipe.
  host.addEventListener('keydown', (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey) return;
    const target = e.target as HTMLElement;
    if (target.closest('input, textarea, .card-viewport')) return;
    if (e.key === 'ArrowRight') step(1);
    else if (e.key === 'ArrowLeft') step(-1);
  });

  syncHeader();

  return {
    goTo,
    getActive: () => activeId,
    refresh: syncHeader,
  };
}
