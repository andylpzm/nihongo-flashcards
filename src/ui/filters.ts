import { state } from '../state/store';
import { showToast } from './toast';
import { applyFiltersAndShuffle, renderCard, persistFilters } from './card';

// Helper to bind desktop double-clicks and mobile touch long-presses to filter chips
function bindIsolateGesture(
  btn: HTMLElement,
  typeOrTopic: 'type' | 'topic',
  siblingButtons: NodeListOf<HTMLElement>
): void {
  let touchTimer: ReturnType<typeof setTimeout> | null = null;
  let lastLongPressTime = 0;
  let startX = 0;
  let startY = 0;

  // Mobile touchstart event
  btn.addEventListener(
    'touchstart',
    (e) => {
      const touch = e.touches[0];
      if (!touch) return;
      startX = touch.clientX;
      startY = touch.clientY;

      touchTimer = setTimeout(() => {
        lastLongPressTime = Date.now();
        // Vibration pulse feedback
        if ('vibrate' in navigator) {
          navigator.vibrate(50);
        }
        // Isolate this chip
        siblingButtons.forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
      }, 600); // 600ms long-press threshold
    },
    { passive: true }
  );

  // Cancel timer if finger drags/scrolls
  btn.addEventListener('touchmove', (e) => {
    const touch = e.touches[0];
    if (!touch) return;
    if (Math.abs(touch.clientX - startX) > 10 || Math.abs(touch.clientY - startY) > 10) {
      if (touchTimer) clearTimeout(touchTimer);
    }
  });

  // Handle touchend
  btn.addEventListener('touchend', () => {
    if (touchTimer) clearTimeout(touchTimer);
  });

  btn.addEventListener('touchcancel', () => {
    if (touchTimer) clearTimeout(touchTimer);
  });

  // Pointer click event
  btn.addEventListener('click', (e) => {
    // If a touch long-press just fired within the last 1000ms, suppress this click trigger
    if (Date.now() - lastLongPressTime < 1000) {
      return;
    }

    if (e.detail === 2) {
      // Desktop Double Click: Isolate
      siblingButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
    } else {
      // Single Click: Toggle
      if (typeOrTopic === 'type') {
        const activeBtns = Array.from(siblingButtons).filter((b) => b.classList.contains('active'));
        if (btn.classList.contains('active')) {
          if (activeBtns.length <= 1) return; // Prevent empty Word Types
          btn.classList.remove('active');
        } else {
          btn.classList.add('active');
        }
      } else {
        btn.classList.toggle('active');
      }
    }
  });
}

// Vocabulary Filter Drawer (Concept B Refined) Event Handlers
export function setupFilterDrawer(): void {
  const btnOpenFilters = document.getElementById('btn-open-filters');
  const filterModalOverlay = document.getElementById('filter-modal-overlay');
  const btnCloseDrawer = document.getElementById('btn-close-drawer');
  const btnDrawerClear = document.getElementById('btn-drawer-clear');
  const btnDrawerSelectAll = document.getElementById('btn-drawer-select-all');
  const btnDrawerApply = document.getElementById('btn-drawer-apply');
  const filterDrawer = document.getElementById('filter-drawer');

  // Helper to open the drawer and sync UI state with variables
  const openFilterDrawer = () => {
    if (!filterModalOverlay) return;

    // Sync chip button states with active variable arrays
    const typeBtns = filterModalOverlay.querySelectorAll<HTMLElement>('.types-grid .filter-chip-btn');
    typeBtns.forEach((btn) => {
      const val = btn.getAttribute('data-type');
      btn.classList.toggle('active', !!val && state.selectedVocabTypes.includes(val));
    });

    const topicBtns = filterModalOverlay.querySelectorAll<HTMLElement>('.topics-grid .filter-chip-btn');
    topicBtns.forEach((btn) => {
      const val = btn.getAttribute('data-topic');
      btn.classList.toggle('active', !!val && state.selectedVocabTopics.includes(val));
    });

    filterModalOverlay.classList.remove('hidden');
  };

  // Helper to close the drawer
  const closeFilterDrawer = () => {
    if (filterModalOverlay) {
      filterModalOverlay.classList.add('hidden');
    }
  };

  if (btnOpenFilters) {
    btnOpenFilters.addEventListener('click', openFilterDrawer);
  }

  if (btnCloseDrawer) {
    btnCloseDrawer.addEventListener('click', closeFilterDrawer);
  }

  // Close when clicking on overlay backdrop (excluding the drawer container itself)
  if (filterModalOverlay) {
    filterModalOverlay.addEventListener('click', (e) => {
      if (filterDrawer && !filterDrawer.contains(e.target as Node)) {
        closeFilterDrawer();
      }
    });
  }

  // Bind type and topic elements
  if (filterModalOverlay) {
    const typeBtns = filterModalOverlay.querySelectorAll<HTMLElement>('.types-grid .filter-chip-btn');
    typeBtns.forEach((btn) => bindIsolateGesture(btn, 'type', typeBtns));

    const topicBtns = filterModalOverlay.querySelectorAll<HTMLElement>('.topics-grid .filter-chip-btn');
    topicBtns.forEach((btn) => bindIsolateGesture(btn, 'topic', topicBtns));
  }

  // Clear all category filters (deactivate all topics, leave nouns active for type)
  if (btnDrawerClear) {
    btnDrawerClear.addEventListener('click', () => {
      if (!filterModalOverlay) return;
      filterModalOverlay.querySelectorAll<HTMLElement>('.topics-grid .filter-chip-btn').forEach((btn) => {
        btn.classList.remove('active');
      });
      filterModalOverlay.querySelectorAll<HTMLElement>('.types-grid .filter-chip-btn').forEach((btn) => {
        const val = btn.getAttribute('data-type');
        btn.classList.toggle('active', val === 'nouns');
      });
    });
  }

  // Select all category filters
  if (btnDrawerSelectAll) {
    btnDrawerSelectAll.addEventListener('click', () => {
      if (!filterModalOverlay) return;
      filterModalOverlay.querySelectorAll<HTMLElement>('.filter-chip-btn').forEach((btn) => {
        btn.classList.add('active');
      });
    });
  }

  // Apply filters button logic
  if (btnDrawerApply) {
    btnDrawerApply.addEventListener('click', () => {
      if (!filterModalOverlay) return;

      const activeTypes = Array.from(
        filterModalOverlay.querySelectorAll<HTMLElement>('.types-grid .filter-chip-btn.active')
      )
        .map((btn) => btn.getAttribute('data-type'))
        .filter((v): v is string => v !== null);

      const activeTopics = Array.from(
        filterModalOverlay.querySelectorAll<HTMLElement>('.topics-grid .filter-chip-btn.active')
      )
        .map((btn) => btn.getAttribute('data-topic'))
        .filter((v): v is string => v !== null);

      // Prevent blank deck states
      if (activeTypes.length === 0) {
        showToast('Please select at least one Word Type.');
        return;
      }

      // Update state arrays
      state.selectedVocabTypes = activeTypes;
      state.selectedVocabTopics = activeTopics;
      persistFilters();

      state.currentIndex = 0;
      applyFiltersAndShuffle();
      renderCard();
      closeFilterDrawer();
    });
  }

  // Close drawer on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && filterModalOverlay && !filterModalOverlay.classList.contains('hidden')) {
      closeFilterDrawer();
    }
  });
}
