// Toast Notification (replaces alert())
const toastEl = document.getElementById('toast');
let toastTimer: ReturnType<typeof setTimeout> | null = null;

export function showToast(message: string): void {
  if (!toastEl) return;
  if (toastTimer) clearTimeout(toastTimer);
  toastEl.textContent = message;
  toastEl.classList.remove('hidden');
  // Force reflow so the transition retriggers if a toast is already active
  void toastEl.offsetWidth;
  toastEl.classList.add('active');
  toastTimer = setTimeout(() => {
    toastEl.classList.remove('active');
    toastTimer = setTimeout(() => toastEl.classList.add('hidden'), 250);
  }, 3000);
}
