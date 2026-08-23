// Settings sheet. Deliberately small: session length lives in the session bar
// where it's chosen, and the old new-per-day / max-reviews-per-day /
// learn-ahead inputs are gone - they were algorithm plumbing that silently
// overrode the session length the user had just picked. What's left is Theme,
// with room for backup/restore later.

import { createModal } from './modal';
import { setTheme } from './theme';
import { state } from '../state/store';
import { setupBackupPanel } from './backupPanel';
import { motionState, setMotionEnabled, requestMotion } from './motion';

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

  // Card tilt. The button says what tapping it will DO, and the line above it
  // says where things currently stand - a single "Motion: on/off" toggle
  // cannot express "you said no and iOS will not ask again this session",
  // which is the state a mis-tap actually leaves you in.
  const motionLabel = document.getElementById('motion-state');
  const motionNote = document.getElementById('motion-note');
  const motionBtn = document.getElementById('btn-motion');

  function syncMotion(): void {
    if (!motionLabel || !motionNote || !motionBtn) return;
    const s = motionState();
    const note = {
      unsupported: 'No tilt sensor here, or the page is not on https. Cards still tilt to your finger.',
      off: 'Cards tilt to your finger only.',
      asking: 'Tap a card once and allow motion access.',
      live: 'Move the light across a card by tilting.',
      denied: 'Motion access was declined. Reopen the app to be asked again — iPhone will not ask twice in one visit.',
    }[s];
    motionNote.textContent = note;
    motionBtn.setAttribute('aria-checked', String(s === 'live' || s === 'asking'));
    // a switch that cannot move is a lie; when there is no sensor at all it
    // goes flat and stops taking taps
    motionBtn.toggleAttribute('disabled', s === 'unsupported');
    motionBtn.style.opacity = s === 'unsupported' ? '0.4' : '';
  }

  motionBtn?.addEventListener('click', () => {
    const s = motionState();
    // 'denied' is worth one more try in case this is a fresh page life; if iOS
    // is still refusing it comes straight back denied and the note says so
    if (s === 'denied') void requestMotion().then(syncMotion);
    else setMotionEnabled(s === 'off');
    syncMotion();
  });

  setupBackupPanel();

  document.querySelectorAll<HTMLElement>('.btn-open-settings').forEach((btn) => {
    btn.addEventListener('click', () => {
      syncThemeChips();
      syncMotion();
      modal.open();
    });
  });

  closeBtn?.addEventListener('click', modal.close);
  doneBtn?.addEventListener('click', modal.close);
}
