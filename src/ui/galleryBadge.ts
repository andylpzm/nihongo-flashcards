// unread badge on the Gallery tab.
//
// unlocking a picture used to be one clause in the session summary, which is
// easy to skim past and asks nothing of you. a count on the tab keeps it
// waiting until you actually go and look.

const KEY = 'gallery-unread';

export function galleryUnread(): number {
  const raw = Number(localStorage.getItem(KEY));
  return Number.isFinite(raw) && raw > 0 ? Math.floor(raw) : 0;
}

export function markGalleryUnread(added: number): void {
  if (added <= 0) return;
  localStorage.setItem(KEY, String(galleryUnread() + added));
  syncGalleryBadge();
}

export function clearGalleryUnread(): void {
  localStorage.removeItem(KEY);
  syncGalleryBadge();
}

/** paints the badge, and pops it when the number goes up */
export function syncGalleryBadge(): void {
  const tab = document.getElementById('bottom-nav-gallery');
  if (!tab) return;
  const count = galleryUnread();
  let badge = tab.querySelector<HTMLElement>('.nav-badge');

  if (count === 0) {
    badge?.remove();
    return;
  }
  const isNew = !badge;
  if (!badge) {
    badge = document.createElement('span');
    badge.className = 'nav-badge';
    tab.appendChild(badge);
  }
  const changed = badge.textContent !== String(count);
  badge.textContent = String(count);

  if ((isNew || changed) && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    badge.animate(
      [
        { transform: 'scale(0)', opacity: 0 },
        { transform: 'scale(1.35)', opacity: 1, offset: 0.55 },
        { transform: 'scale(1)', opacity: 1 },
      ],
      { duration: 460, easing: 'cubic-bezier(.3,.9,.4,1)' }
    );
    tab.querySelector('svg')?.animate(
      [
        { transform: 'rotate(0)' },
        { transform: 'rotate(-9deg)', offset: 0.25 },
        { transform: 'rotate(7deg)', offset: 0.55 },
        { transform: 'rotate(0)' },
      ],
      { duration: 620, easing: 'ease-in-out' }
    );
  }
}
