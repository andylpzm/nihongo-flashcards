import { describe, it, expect, beforeEach } from 'vitest';
import { loadSettings, saveSettings, DEFAULT_SETTINGS } from './settings';

describe('settings', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('returns defaults on a clean profile', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('round-trips a save', () => {
    const custom = { sessionLength: 'long' as const };
    saveSettings(custom);
    expect(loadSettings()).toEqual(custom);
  });

  it('ignores legacy tuning keys left in storage', () => {
    // Older builds persisted newPerDay / maxReviewsPerDay / learnAheadMinutes.
    // Those are constants now; a stale payload must not resurrect them.
    localStorage.setItem(
      'nihongo_study_settings',
      JSON.stringify({ sessionLength: 'long', newPerDay: 5, maxReviewsPerDay: 10, learnAheadMinutes: 1 })
    );
    const settings = loadSettings();
    expect(settings.sessionLength).toBe('long');
    expect(Object.keys(settings)).toEqual(['sessionLength']);
  });

  it('falls back to the default sessionLength for an invalid value', () => {
    localStorage.setItem('nihongo_study_settings', JSON.stringify({ sessionLength: 'huge' }));
    expect(loadSettings().sessionLength).toBe('medium');
  });

  it('falls back to defaults entirely on corrupt JSON', () => {
    localStorage.setItem('nihongo_study_settings', '{not json');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });
});
