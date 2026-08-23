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

export interface DailyProgress {
  date: string; // YYYY-MM-DD
  newCount: number;
  reviewCount: number;
  /** One-off top-up granted by "Learn more" (D3/Step 6) - added to
   * newPerDay for the rest of the calendar day. */
  extraNew: number;
}

/** Replaces the old loadDailyNewProgress/saveDailyNewProgress pair. Keeps the
 * legacy key readable so an in-flight day isn't lost when this ships. */
export function loadDailyProgress(): DailyProgress {
  try {
    const raw = localStorage.getItem('nihongo_daily_progress');
    if (raw) {
      const p = JSON.parse(raw) as Partial<DailyProgress>;
      if (typeof p.date === 'string') {
        return {
          date: p.date,
          newCount: typeof p.newCount === 'number' ? p.newCount : 0,
          reviewCount: typeof p.reviewCount === 'number' ? p.reviewCount : 0,
          extraNew: typeof p.extraNew === 'number' ? p.extraNew : 0,
        };
      }
    }
    // One-time read of the pre-existing key so today's new-card count survives.
    const legacy = localStorage.getItem('nihongo_daily_new_progress');
    if (legacy) {
      const p = JSON.parse(legacy) as { date?: string; count?: number };
      if (typeof p.date === 'string' && typeof p.count === 'number') {
        return { date: p.date, newCount: p.count, reviewCount: 0, extraNew: 0 };
      }
    }
  } catch {
    // ignore
  }
  return { date: '', newCount: 0, reviewCount: 0, extraNew: 0 };
}

export function saveDailyProgress(progress: DailyProgress): void {
  try {
    localStorage.setItem('nihongo_daily_progress', JSON.stringify(progress));
  } catch {
    // ignore
  }
}
