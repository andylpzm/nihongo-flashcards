export type SessionLength = 'short' | 'long';

/** Distinct cards per sitting. Answers run a little above this: a card leaves
 * on its first grade, but one answered Forgot comes back for a second look. */
export const SESSION_SIZES: Record<SessionLength, number> = {
  short: 10,
  long: 25,
};


/**
 * Session length is the only study knob. There is intentionally no
 * new-cards-per-day or max-reviews-per-day limit: those silently overrode the
 * length the user had just chosen (picking "Long" still produced a 25-card
 * session because the daily cap won), which made the presets look broken.
 * The size of the sitting is now exactly what was asked for.
 *
 * Two lengths, not three. The 50-card sitting was longer than one sitting's
 * attention and nobody finished it, and an unfinished sitting forfeits the
 * completion bonus - so the longest option paid the worst.
 */
export interface StudySettings {
  sessionLength: SessionLength;
}

export const DEFAULT_SETTINGS: StudySettings = {
  sessionLength: 'long',
};

const KEY = 'nihongo_study_settings';

export function loadSettings(): StudySettings {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<StudySettings>;
      // 'medium' is what the 25-card sitting used to be called, and the old
      // 'long' was 50 cards - dropped for being more than one sitting's
      // attention. Both land on today's 25-card Long rather than resetting
      // someone's choice to the default.
      const length = parsed.sessionLength as string | undefined;
      if (length === 'short') return { sessionLength: 'short' };
      if (length === 'long' || length === 'medium') return { sessionLength: 'long' };
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
