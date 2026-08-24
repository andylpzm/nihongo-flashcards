// Settings sheet. Deliberately small: session length lives in the session bar
// where it's chosen, and the old new-per-day / max-reviews-per-day /
// learn-ahead inputs are gone - they were algorithm plumbing that silently
// overrode the session length the user had just picked. What's left is Theme,
// with room for backup/restore later.

import { createModal } from './modal';
import { setTheme } from './theme';
import { state } from '../state/store';
import { setupBackupPanel } from './backupPanel';

function wrapChipLabel(btn: HTMLElement): void {
  if (btn.querySelector('.chip-label')) return;
  const label = document.createElement('span');
  label.className = 'chip-label';
  label.textContent = btn.textContent?.trim() ?? '';
  btn.textContent = '';
  btn.appendChild(label);
}

export function setupSettingsSheet(): void {
  const overlay = document.getElementById('settings-modal-overlay');
  if (!overlay) return;

  const modal = createModal(overlay);
  const themeGrid = document.getElementById('settings-theme-grid');
  const doneBtn = document.getElementById('btn-settings-save');
  const closeBtn = document.getElementById('btn-close-settings');

  const themeChips = themeGrid ? Array.from(themeGrid.querySelectorAll<HTMLElement>('.filter-chip-btn')) : [];
  themeChips.forEach(wrapChipLabel);

  function syncThemeChips(): void {
    themeChips.forEach((b) => {
      const wantsLight = b.getAttribute('data-theme-choice') === 'light';
      b.classList.toggle('active', wantsLight === state.isLightTheme);
    });
  }

  themeGrid?.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.filter-chip-btn');
    if (!btn || !themeGrid.contains(btn)) return;
    setTheme(btn.getAttribute('data-theme-choice') === 'light');
    // Highlight the choice, not the current state: the dark->light path defers
    // the actual flip by 400ms behind the sky transition, so reading
    // state.isLightTheme here would still return the old value.
    themeChips.forEach((b) => b.classList.toggle('active', b === btn));
  });

  setupBackupPanel();

  document.querySelectorAll<HTMLElement>('.btn-open-settings').forEach((btn) => {
    btn.addEventListener('click', () => {
      syncThemeChips();
      modal.open();
    });
  });

  closeBtn?.addEventListener('click', modal.close);
  doneBtn?.addEventListener('click', modal.close);
}
