export type SessionLength = 'short' | 'medium' | 'long';

/** Distinct cards per sitting. Answers run roughly 2x this, because a new card
 * needs about two presses to graduate out of the learning steps. */
export const SESSION_SIZES: Record<SessionLength, number> = {
  short: 10,
  medium: 25,
  long: 50,
};


/**
 * Session length is the only study knob. There is intentionally no
 * new-cards-per-day or max-reviews-per-day limit: those silently overrode the
 * length the user had just chosen (picking "Long" still produced a 25-card
 * session because the daily cap won), which made the presets look broken.
 * The size of the sitting is now exactly what was asked for.
 */
export interface StudySettings {
  sessionLength: SessionLength;
}

export const DEFAULT_SETTINGS: StudySettings = {
  sessionLength: 'medium',
};

const KEY = 'nihongo_study_settings';

export function loadSettings(): StudySettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StudySettings>;
      const length = parsed.sessionLength;
      if (length === 'short' || length === 'medium' || length === 'long') {
        return { sessionLength: length };
      }
    }
  } catch {
    // fall through to defaults
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: StudySettings): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(settings));
  } catch {
    // ignore quota errors - settings are not critical data
  }
}
