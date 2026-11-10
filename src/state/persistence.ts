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

export function loadMasteredIds(): Set<CardId> {
  return loadIdSet('nihongo_mastered_ids');
}

export function loadStoryMasteredIds(): Set<CardId> {
  return loadIdSet('nihongo_story_mastered_ids');
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

