import type { CardId, FilterMode, LevelFilter } from './types';

function loadIdSet(key: string): Set<CardId> {
  try {
    const saved = localStorage.getItem(key);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        return new Set(parsed);
      }
    }
  } catch (e) {
    console.warn(`Could not load "${key}" from localStorage:`, e);
  }
  return new Set();
}

function saveIdSet(key: string, ids: Set<CardId>): void {
  try {
    localStorage.setItem(key, JSON.stringify(Array.from(ids)));
  } catch (e) {
    console.error(`Failed to write "${key}" to localStorage:`, e);
  }
}

export function loadMasteredIds(): Set<CardId> {
  return loadIdSet('nihongo_mastered_ids');
}

export function saveMasteredIds(ids: Set<CardId>): void {
  saveIdSet('nihongo_mastered_ids', ids);
}

export function loadStoryMasteredIds(): Set<CardId> {
  return loadIdSet('nihongo_story_mastered_ids');
}

export function saveStoryMasteredIds(ids: Set<CardId>): void {
  saveIdSet('nihongo_story_mastered_ids', ids);
}

export function loadStoryUnlockedChapter(): number {
  try {
    const saved = localStorage.getItem('nihongo_story_unlocked');
    if (saved) {
      return parseInt(saved, 10);
    }
  } catch {
    // ignore, fall back to default
  }
  return 1;
}

export function saveStoryUnlockedChapter(chapter: number): void {
  try {
    localStorage.setItem('nihongo_story_unlocked', String(chapter));
  } catch {
    // ignore
  }
}

export type ThemePreference = 'light' | 'dark';

export function loadTheme(): ThemePreference | null {
  try {
    const saved = localStorage.getItem('nihongo_theme');
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
  } catch {
    // ignore
  }
  return null;
}

export function saveTheme(theme: ThemePreference): void {
  try {
    localStorage.setItem('nihongo_theme', theme);
  } catch {
    // ignore
  }
}

export interface PersistedFilters {
  filterMode: FilterMode;
  levelFilter: LevelFilter;
  selectedVocabTypes: string[];
  selectedVocabTopics: string[];
}

export function loadFilters(): Partial<PersistedFilters> {
  try {
    const saved = localStorage.getItem('nihongo_filters');
    if (saved) {
      return JSON.parse(saved) as Partial<PersistedFilters>;
    }
  } catch {
    // ignore, fall back to defaults
  }
  return {};
}

export function saveFilters(filters: PersistedFilters): void {
  try {
    localStorage.setItem('nihongo_filters', JSON.stringify(filters));
  } catch {
    // ignore
  }
}
