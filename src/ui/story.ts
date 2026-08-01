import type { StoryChapter } from '../data/types';
import { loadStory } from '../data/loader';
import { FeedbackAudio } from '../audio/feedback';
import { state } from '../state/store';
import { switchSection, btnBackToStory } from './nav';
import { applyFiltersAndShuffle, renderCard, updateStats } from './card';

const storyRoadmap = document.getElementById('story-roadmap');
const storyModal = document.getElementById('story-modal');
const storyDialogueBody = document.getElementById('story-dialogue-body');
const btnCloseStoryModal = document.getElementById('btn-close-story-modal');
const btnCloseStoryModalFooter = document.getElementById('btn-close-story-modal-footer');

const levelFilterGroup = document.getElementById('level-filter-group');
const vocabDropdownFilters = document.getElementById('vocab-dropdown-filters');

// Story data loads lazily on first navigation to the Story section rather
// than at boot; every entry point below awaits this (loadStory() memoizes,
// so it's instant on every call after the first).
let chaptersCache: StoryChapter[] = [];
async function ensureChaptersLoaded(): Promise<StoryChapter[]> {
  if (chaptersCache.length === 0) {
    chaptersCache = await loadStory();
  }
  return chaptersCache;
}

// Render the interactive roadmap
export async function renderStoryRoadmap(): Promise<void> {
  if (!storyRoadmap) return;
  const chapters = await ensureChaptersLoaded();
  storyRoadmap.innerHTML = '';

  chapters.forEach((chapter) => {
    const isLocked = chapter.id > state.storyUnlockedChapter;
    const isCleared = chapter.id < state.storyUnlockedChapter;
    const isActive = chapter.id === state.storyUnlockedChapter;

    // Calculate progress inside chapter deck
    const totalCards = chapter.deck.length;
    const masteredCount = chapter.deck.filter((card) => state.storyMasteredIds.has(card.id)).length;
    const percent = Math.round((masteredCount / totalCards) * 100);

    const node = document.createElement('div');
    node.className = `story-node ${isLocked ? 'locked' : ''} ${isCleared ? 'cleared' : ''}`;

    let badgeClass = 'locked-badge';
    let badgeText = 'Locked';
    if (isCleared) {
      badgeClass = 'cleared-badge';
      badgeText = '🏆 Cleared';
    } else if (isActive) {
      badgeClass = 'active-badge';
      badgeText = '🟢 Active Quest';
    }

    // Determine actions html
    let actionsHtml = '';
    if (!isLocked) {
      if (isCleared) {
        actionsHtml = `
          <button class="btn btn-story-read" data-action="read-story" data-chapter-id="${chapter.id}">
            Read Story
          </button>
          <button class="btn btn-story-review" data-action="start-chapter" data-chapter-id="${chapter.id}" data-mode="review">
            Review Deck
          </button>
        `;
      } else {
        actionsHtml = `
          <button class="btn btn-story-start" data-action="start-chapter" data-chapter-id="${chapter.id}" data-mode="study">
            Start Chapter (${masteredCount}/${totalCards})
          </button>
        `;
      }
    } else {
      actionsHtml = `
        <button class="btn btn-story-locked" disabled>
          🔒 Locked
        </button>
      `;
    }

    node.innerHTML = `
      <div class="story-node-info">
        <div class="story-node-header">
          <h4 class="story-node-title">${isLocked ? `Chapter ${chapter.id}: Locked 🔒` : chapter.title}</h4>
          <span class="story-node-badge ${badgeClass}">${badgeText}</span>
        </div>
        <p class="story-node-desc">
          ${isLocked ? 'Master the previous chapters to unlock this story quest.' : chapter.description}
        </p>
        ${!isLocked ? `<div class="story-node-progress">Mastery Progress: ${percent}%</div>` : ''}
      </div>
      <div class="story-node-actions">
        ${actionsHtml}
      </div>
    `;

    storyRoadmap.appendChild(node);
  });
}

// Delegated click handler for roadmap action buttons (replaces inline onclick=)
if (storyRoadmap) {
  storyRoadmap.addEventListener('click', (e) => {
    const target = (e.target as HTMLElement).closest<HTMLElement>('[data-action]');
    if (!target) return;

    const chapterId = Number(target.dataset.chapterId);
    if (Number.isNaN(chapterId)) return;

    if (target.dataset.action === 'read-story') {
      void showStoryDialogue(chapterId);
    } else if (target.dataset.action === 'start-chapter') {
      const mode = target.dataset.mode === 'review' ? 'review' : 'study';
      void startStoryChapter(chapterId, mode);
    }
  });
}

// Start studying/reviewing a story chapter
export async function startStoryChapter(chapterId: number, _mode: 'study' | 'review'): Promise<void> {
  const chapters = await ensureChaptersLoaded();
  const chapter = chapters.find((ch) => ch.id === chapterId);
  if (!chapter) return;

  state.isStoryModeActive = true;
  state.activeStoryChapterId = chapterId;
  state.activeDeck = 'story';
  state.cards = chapter.deck;

  // Disable/hide normal JLPT level selector
  if (levelFilterGroup) levelFilterGroup.classList.add('hidden');
  if (vocabDropdownFilters) vocabDropdownFilters.classList.add('hidden');

  // Show back to story map button
  if (btnBackToStory) btnBackToStory.classList.remove('hidden');

  // Reload the study deck
  applyFiltersAndShuffle();
  state.currentIndex = 0;

  updateStats();
  renderCard();
  switchSection('vocabulary', 'story');
}

// Display dialogue scene modal popup
export async function showStoryDialogue(chapterId: number): Promise<void> {
  const chapters = await ensureChaptersLoaded();
  const chapter = chapters.find((ch) => ch.id === chapterId);
  if (!chapter) return;

  if (!storyDialogueBody || !storyModal) return;

  // Play dialogue unlock celebration chime
  FeedbackAudio.playSuccess();

  storyDialogueBody.innerHTML = '';
  const titleEl = document.getElementById('story-modal-title');
  if (titleEl) titleEl.textContent = `${chapter.title} - Dialogue`;

  chapter.dialogue.forEach((line) => {
    const bubbleRow = document.createElement('div');

    // Class names: chris-kun, chiyo-chan, father
    let speakerClass = 'father';
    if (line.speaker.toLowerCase().includes('chris')) {
      speakerClass = 'chris-kun';
    } else if (line.speaker.toLowerCase().includes('chiyo')) {
      speakerClass = 'chiyo-chan';
    }

    bubbleRow.className = `story-bubble-row ${speakerClass}`;
    bubbleRow.innerHTML = `
      <span class="story-bubble-speaker">${line.speaker}</span>
      <div class="story-bubble">${line.text}</div>
    `;
    storyDialogueBody.appendChild(bubbleRow);
  });

  storyModal.classList.remove('hidden');

  // Auto-scroll to bottom of conversation
  setTimeout(() => {
    storyDialogueBody.scrollTop = storyDialogueBody.scrollHeight;
  }, 50);
}

// Close dialogue modal popup
export function closeStoryModal(): void {
  if (storyModal) {
    storyModal.classList.add('hidden');
  }
}

if (btnCloseStoryModal) btnCloseStoryModal.addEventListener('click', closeStoryModal);
if (btnCloseStoryModalFooter) btnCloseStoryModalFooter.addEventListener('click', closeStoryModal);
