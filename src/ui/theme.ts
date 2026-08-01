import { state } from '../state/store';
import { loadTheme, saveTheme } from '../state/persistence';

const themeToggleCube = document.getElementById('theme-toggle-cube');

// Initialize theme from localStorage, falling back to OS preference
export function initTheme(): void {
  const savedTheme = loadTheme();

  if (savedTheme) {
    state.isLightTheme = savedTheme === 'light';
  } else {
    state.isLightTheme = window.matchMedia('(prefers-color-scheme: light)').matches;
  }

  document.body.classList.toggle('light-theme', state.isLightTheme);
  syncCubeRotation();
}

// Sync cube 3D rotation based on active theme state
export function syncCubeRotation(): void {
  if (!themeToggleCube) return;
  const cube = themeToggleCube.querySelector('.cube') as HTMLElement | null;
  if (cube) {
    cube.style.transform = state.isLightTheme
      ? 'rotateX(45deg) rotateY(225deg)'
      : 'rotateX(-22deg) rotateY(45deg)';
  }
}

// Toggle light/dark themes with sky/cloud transitions
export function toggleTheme(): void {
  const nextIsLight = !state.isLightTheme;

  if (nextIsLight) {
    const overlay = document.getElementById('sky-transition');
    if (overlay) {
      // Reset overlay states
      overlay.classList.remove('hidden', 'active', 'fade-to-white');

      // Force layout repaint
      void overlay.offsetWidth;

      // Step 1: Slide in clouds on blue sky
      overlay.classList.add('active');

      // Step 2: Swap the theme underneath while covered
      setTimeout(() => {
        state.isLightTheme = true;
        document.body.classList.add('light-theme');
        syncCubeRotation();
        saveTheme('light');
      }, 400);

      // Step 3: Bleach sky and clouds to white
      setTimeout(() => {
        overlay.classList.add('fade-to-white');
      }, 700);

      // Step 4: Fade out the overlay to reveal the new theme
      setTimeout(() => {
        overlay.classList.remove('active');
      }, 1100);

      // Step 5: Put overlay back to hidden
      setTimeout(() => {
        overlay.classList.add('hidden');
        overlay.classList.remove('fade-to-white');
      }, 1500);
    } else {
      state.isLightTheme = true;
      document.body.classList.add('light-theme');
      syncCubeRotation();
      saveTheme('light');
    }
  } else {
    // Standard quick toggle to Dark Mode
    state.isLightTheme = false;
    document.body.classList.remove('light-theme');
    syncCubeRotation();
    saveTheme('dark');
  }
}

// Attach click listener
if (themeToggleCube) {
  themeToggleCube.addEventListener('click', toggleTheme);
}
