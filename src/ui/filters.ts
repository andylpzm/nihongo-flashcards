import { state } from '../state/store';
import type { FilterMode, LevelFilter } from '../state/types';
import { showToast } from './toast';
import { applyDeckFilters } from './card';
import { onLongPress } from './gestures';
import { createModal } from './modal';

/** Wrap a chip's bare text node in a span so it can flex and wrap on its own.
 * As an anonymous flex item it can't be sized, so long labels
 * ("Miscellaneous (その他)") overflowed the chip instead of wrapping in it. */
function wrapChipLabel(btn: HTMLElement): void {
  if (btn.querySelector('.chip-label')) return;
  const label = document.createElement('span');
  label.className = 'chip-label';
  label.textContent = btn.textContent?.trim() ?? '';
  btn.textContent = '';
  btn.appendChild(label);
}

/** Single-select chip group (Progress, JLPT level). Unlike the type/topic
 * grids these are radio-like: exactly one stays active. */
function bindRadioGroup(container: HTMLElement | null): void {
  if (!container) return;
  container.querySelectorAll<HTMLElement>('.filter-chip-btn').forEach(wrapChipLabel);
  container.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('.filter-chip-btn');
    if (!btn || !container.contains(btn)) return;
    container.querySelectorAll('.filter-chip-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
  });
}

function selectedValue(container: HTMLElement | null, attr: string, fallback: string): string {
  const active = container?.querySelector<HTMLElement>('.filter-chip-btn.active');
  return active?.getAttribute(attr) ?? fallback;
}

function isolate(btn: HTMLElement, siblingButtons: NodeListOf<HTMLElement> | HTMLElement[]): void {
  siblingButtons.forEach((b) => b.classList.remove('active'));
  btn.classList.add('active');
}

function toggle(btn: HTMLElement, typeOrTopic: 'type' | 'topic', siblingButtons: NodeListOf<HTMLElement>): void {
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

// Every chip gets three equivalent ways to isolate it - a visible "only"
// button (hover-revealed on desktop, always visible on touch since there's
// no hover state to reveal it there), a long-press (mobile), and a
// double-click (desktop). None of them is the only way in (closes the bug
// class from B14, where the gesture alone was fragile).
function bindChipInteractions(
  btn: HTMLElement,
  typeOrTopic: 'type' | 'topic',
  siblingButtons: NodeListOf<HTMLElement>
): void {
  wrapChipLabel(btn);

  const isolateBtn = document.createElement('span');
  isolateBtn.className = 'chip-isolate-btn';
  isolateBtn.textContent = 'only';
  isolateBtn.setAttribute('aria-hidden', 'true'); // decorative shortcut; the chip itself is the a11y-reachable control
  btn.appendChild(isolateBtn);

  onLongPress(btn, () => isolate(btn, siblingButtons), 500);

  btn.addEventListener('click', (e) => {
    if ((e.target as HTMLElement).closest('.chip-isolate-btn')) {
      isolate(btn, siblingButtons);
      return;
    }
    if (e.detail === 2) {
      isolate(btn, siblingButtons);
    } else {
      toggle(btn, typeOrTopic, siblingButtons);
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

  if (!filterModalOverlay) return;
  const filterModal = createModal(filterModalOverlay);
  const progressGrid = document.getElementById('drawer-progress-grid');
  const levelGrid = document.getElementById('drawer-level-grid');

  const openFilterDrawer = () => {
    // Sync every chip from committed state - the sheet stages changes locally
    // and only writes back on Apply, so reopening must always start from truth.
    progressGrid?.querySelectorAll<HTMLElement>('.filter-chip-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-progress') === state.filterMode);
    });
    levelGrid?.querySelectorAll<HTMLElement>('.filter-chip-btn').forEach((btn) => {
      btn.classList.toggle('active', btn.getAttribute('data-level') === state.levelFilter);
    });

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

    filterModal.open();
  };

  bindRadioGroup(progressGrid);
  bindRadioGroup(levelGrid);

  btnOpenFilters?.addEventListener('click', openFilterDrawer);
  btnCloseDrawer?.addEventListener('click', filterModal.close);

  // Bind type and topic elements
  const typeBtns = filterModalOverlay.querySelectorAll<HTMLElement>('.types-grid .filter-chip-btn');
  typeBtns.forEach((btn) => bindChipInteractions(btn, 'type', typeBtns));

  const topicBtns = filterModalOverlay.querySelectorAll<HTMLElement>('.topics-grid .filter-chip-btn');
  topicBtns.forEach((btn) => bindChipInteractions(btn, 'topic', topicBtns));

  // Clear all category filters (deactivate all topics, leave nouns active for type)
  btnDrawerClear?.addEventListener('click', () => {
    topicBtns.forEach((btn) => btn.classList.remove('active'));
    typeBtns.forEach((btn) => {
      const val = btn.getAttribute('data-type');
      btn.classList.toggle('active', val === 'nouns');
    });
  });

  // Select all category filters. Scoped to the multi-select type/topic grids
  // only - the progress and level grids are radio-like, and marking every
  // chip in them active would make the "first active wins" read in
  // selectedValue() silently snap both back to "all".
  btnDrawerSelectAll?.addEventListener('click', () => {
    typeBtns.forEach((btn) => btn.classList.add('active'));
    topicBtns.forEach((btn) => btn.classList.add('active'));
  });

  // Apply filters button logic
  btnDrawerApply?.addEventListener('click', () => {
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
      showToast('Select at least one word type.');
      return;
    }

    applyDeckFilters({
      filterMode: selectedValue(progressGrid, 'data-progress', 'all') as FilterMode,
      levelFilter: selectedValue(levelGrid, 'data-level', 'all') as LevelFilter,
      selectedVocabTypes: activeTypes,
      selectedVocabTopics: activeTopics,
    });
    filterModal.close();
  });
}
