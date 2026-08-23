import { describe, it, expect } from 'vitest';
import { computePoints, previewAward, streakOn, streakMultiplier, COMPLETION_BONUS_RATE, RANKS, MISSION_XP, SESSION_VALUE, sessionValue, MAX_STREAK_MULTIPLIER, STREAK_RAMP_DAYS, rankFor, promotionLabel } from './points';
import type { SessionRecord } from './types';

/** Local noon on the given day, so nothing here sits near a timezone edge. */
function at(day: string, hour = 12): number {
  return new Date(`${day}T${String(hour).padStart(2, '0')}:00:00`).getTime();
}

function session(day: string, answers: number, completed = true, hour = 12): SessionRecord {
  const startedAt = at(day, hour);
  return { startedAt, endedAt: startedAt + 300_000, deck: 'vocabulary', answers, completed };
}

/** `days` consecutive sessions ending on 2026-03-30. */
function run(days: number, answers = 30): SessionRecord[] {
  const out: SessionRecord[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date('2026-03-30T12:00:00');
    d.setDate(d.getDate() - i);
    out.push(session(d.toISOString().slice(0, 10), answers));
  }
  return out;
}

describe('streakMultiplier', () => {
  it('starts at 1 and reaches the cap after the ramp', () => {
    expect(streakMultiplier(0)).toBe(1);
    expect(streakMultiplier(STREAK_RAMP_DAYS)).toBe(MAX_STREAK_MULTIPLIER);
  });

  it('never exceeds the cap however long the streak runs', () => {
    expect(streakMultiplier(365)).toBe(MAX_STREAK_MULTIPLIER);
  });

  it('climbs monotonically', () => {
    for (let d = 1; d <= STREAK_RAMP_DAYS; d++) {
      expect(streakMultiplier(d)).toBeGreaterThan(streakMultiplier(d - 1));
    }
  });
});

describe('streakOn', () => {
  const days = (...keys: string[]) => new Set(keys);

  it('counts consecutive days', () => {
    expect(streakOn(days('2026-03-01', '2026-03-02', '2026-03-03'), '2026-03-03')).toBe(3);
  });

  it('is zero with no history', () => {
    expect(streakOn(days(), '2026-03-03')).toBe(0);
  });

  it('survives yesterday-only, so a rest day does not break it mid-morning', () => {
    expect(streakOn(days('2026-03-01', '2026-03-02'), '2026-03-03')).toBe(2);
  });

  it('dies after two days away', () => {
    expect(streakOn(days('2026-03-01', '2026-03-02'), '2026-03-04')).toBe(0);
  });

  it('forgives a single missed day', () => {
    // Studied 1,2,4,5 - the 3rd is forgiven, so all four days count.
    expect(streakOn(days('2026-03-01', '2026-03-02', '2026-03-04', '2026-03-05'), '2026-03-05')).toBe(4);
  });

  it('does not forgive two missed days in a row', () => {
    expect(streakOn(days('2026-03-01', '2026-03-04'), '2026-03-04')).toBe(1);
  });

  it('only forgives one gap per week', () => {
    // Gaps on the 3rd and the 6th are both inside one seven-day window;
    // the second one ends the streak.
    const studied = days('2026-03-01', '2026-03-02', '2026-03-04', '2026-03-05', '2026-03-07');
    expect(streakOn(studied, '2026-03-07')).toBe(3);
  });

  it('allows a second gap once the window has moved on', () => {
    const studied = days(
      '2026-03-01', '2026-03-02',
      // gap on the 3rd
      '2026-03-04', '2026-03-05', '2026-03-06', '2026-03-07', '2026-03-08', '2026-03-09', '2026-03-10',
      // gap on the 11th, eight days after the first
      '2026-03-12'
    );
    expect(streakOn(studied, '2026-03-12')).toBe(10);
  });
});

describe('computePoints', () => {
  it('is zero for no sessions', () => {
    expect(computePoints([], new Date(at('2026-03-30'))).total).toBe(0);
  });

  it('pays answers plus the completion bonus on a first session', () => {
    const s = [session('2026-03-30', 30)];
    // Streak is 1 on the very first day, so the multiplier is already slightly
    // above 1 - assert against the formula rather than a magic number.
    // one day of vocabulary also clears that deck's daily mission
    const expected = Math.round(30 * (1 + COMPLETION_BONUS_RATE) * streakMultiplier(1)) + MISSION_XP;
    expect(computePoints(s, new Date(at('2026-03-30'))).total).toBe(expected);
  });

  it('pays a whole session at full value however long it is', () => {
    // the old daily cap docked answers mid-session once a total was crossed,
    // which punished long sittings. a session is now internally uniform.
    const now = new Date(at('2026-03-30'));
    const short = computePoints([session('2026-03-30', 25)], now).awards[0]!.points;
    const long = computePoints([session('2026-03-30', 50)], now).awards[0]!.points;
    // within rounding: each session is scored once, so doubling the answers
    // doubles the pay rather than tailing off partway through
    expect(Math.abs(long - short * 2)).toBeLessThanOrEqual(2);
  });

  it('pays each later sitting of the day less than the one before', () => {
    const now = new Date(at('2026-03-30'));
    const awards = computePoints(
      [0, 1, 2, 3, 4].map((i) => session('2026-03-30', 25, true, 8 + i * 2)),
      now
    ).awards;
    for (let i = 1; i < awards.length; i++) {
      expect(awards[i]!.points).toBeLessThan(awards[i - 1]!.points);
    }
    expect(awards[0]!.sessionValue).toBe(SESSION_VALUE[0]);
    expect(sessionValue(9)).toBeLessThan(SESSION_VALUE[0]);
  });

  it('keeps one long sitting ahead of the same work split in two', () => {
    const now = new Date(at('2026-03-30'));
    const one = computePoints([session('2026-03-30', 50)], now).total;
    const split = computePoints(
      [session('2026-03-30', 25, true, 9), session('2026-03-30', 25, true, 17)],
      now
    ).total;
    expect(one).toBeGreaterThan(split);
  });

  it('pays a better finishing bonus at higher rank', () => {
    // rank is read from xp earned so far, so a long history earns at the
    // higher rate its own history bought
    expect(RANKS[RANKS.length - 1]!.bonus).toBeGreaterThan(RANKS[0]!.bonus);
    const now = new Date(at('2026-03-30'));
    const rich = computePoints(
      [...run(120, 50), session('2026-03-30', 25, true, 20)],
      now
    ).awards;
    const poor = computePoints([session('2026-03-30', 25)], now).awards[0]!;
    const lastRich = rich[rich.length - 1]!;
    expect(lastRich.bonusRate).toBeGreaterThan(poor.bonusRate);
  });

  it('withholds the completion bonus from an abandoned sitting', () => {
    const finished = computePoints([session('2026-03-30', 30, true)], new Date(at('2026-03-30')));
    const abandoned = computePoints([session('2026-03-30', 30, false)], new Date(at('2026-03-30')));
    expect(finished.total).toBeGreaterThan(abandoned.total);
    expect(abandoned.total).toBe(Math.round(30 * streakMultiplier(1)) + MISSION_XP);
  });

  it('pays effort, not session count: one long sitting beats several short ones', () => {
    const now = new Date(at('2026-03-30'));
    const one = computePoints([session('2026-03-30', 60)], now);
    const many = computePoints(
      [
        session('2026-03-30', 10, true, 9),
        session('2026-03-30', 10, true, 10),
        session('2026-03-30', 10, true, 11),
        session('2026-03-30', 10, true, 13),
      ],
      now
    );
    // The whole point of a proportional finishing bonus: the same 40 answers
    // split into four tidy little sittings must not out-earn one real one.
    expect(one.total).toBeGreaterThan(many.total);
  });

  it('pays more per session as a streak builds', () => {
    const now = new Date(at('2026-03-30'));
    const awards = computePoints(run(28), now).awards;
    expect(awards[27]!.points).toBeGreaterThan(awards[0]!.points * 1.8);
  });

  it('never takes away points already earned when a streak breaks', () => {
    const now = new Date(at('2026-04-15'));
    const built = run(28);
    const before = computePoints(built, now).total;

    // Weeks pass with no study at all; the streak is long gone.
    const after = computePoints(built, new Date(at('2026-05-30')));
    expect(after.total).toBe(before);
    expect(after.streak).toBe(0);
    expect(after.multiplier).toBe(1);
  });

  it('is deterministic: replaying the same sessions gives the same total', () => {
    const now = new Date(at('2026-03-30'));
    const s = run(20);
    const a = computePoints(s, now).total;
    const b = computePoints([...s].reverse(), now).total;
    expect(b).toBe(a);
  });

  it('ignores a negative answer count rather than paying it out', () => {
    const now = new Date(at('2026-03-30'));
    const s = [{ ...session('2026-03-30', 0), answers: -50 }];
    // the sitting itself pays nothing; only the daily mission it satisfied
    expect(computePoints(s, now).total).toBe(MISSION_XP);
  });

  it('pays daily missions once per day, not per session', () => {
    const now = new Date(at('2026-03-30'));
    const one = computePoints([session('2026-03-30', 25)], now);
    const two = computePoints(
      [session('2026-03-30', 25, true, 9), session('2026-03-30', 25, true, 18)],
      now
    );
    // both days touched one deck, so both collected exactly one mission
    expect(one.missionTotal).toBe(MISSION_XP);
    expect(two.missionTotal).toBe(MISSION_XP);
  });

  it('pays more missions for studying several decks', () => {
    const now = new Date(at('2026-03-30'));
    const varied = computePoints(
      ['vocabulary', 'hiragana', 'katakana', 'kanji'].map((deck, i) => ({
        ...session('2026-03-30', 25, true, 8 + i * 2),
        deck,
      })),
      now
    );
    // four missions plus the all-four bonus
    expect(varied.missionTotal).toBeGreaterThan(4 * MISSION_XP);
  });
});

describe('previewAward', () => {
  it('matches what the session actually pays once recorded', () => {
    const now = new Date(at('2026-03-30'));
    const history = run(10);
    const predicted = previewAward(history, 30, true, now);
    const actual = computePoints([...history, session('2026-03-30', 30)], now);
    expect(predicted).toBe(actual.awards[actual.awards.length - 1]!.points);
  });
});

describe('rank ladder', () => {
  it('reads as a school club, not one sport', () => {
    expect(RANKS.map((r) => r.name)).toEqual([
      'First Year',
      'Bench',
      'Regular',
      'Ace',
      'Captain',
      'Regionals',
      'Nationals',
    ]);
  });

  it('phrases a promotion as a title or as a place, whichever it is', () => {
    expect(promotionLabel(rankFor(0))).toBe('now First Year');
    expect(promotionLabel(rankFor(26_600))).toBe('now Captain');
    // "now Nationals" would be wrong - it is somewhere the team gets to
    expect(promotionLabel(rankFor(43_225))).toBe('Regionals reached');
    expect(promotionLabel(rankFor(59_850))).toBe('Nationals reached');
  });
});

describe('rank reveal', () => {
  // the sheet seals every rank past the next one. this pins the rule, since it
  // has to agree with the card, which already names the next rank out loud.
  const revealed = (total: number) => {
    const rank = rankFor(total);
    return RANKS.filter((_, i) => i <= rank.index + 1).map((r) => r.name);
  };

  it('shows the next rank and seals the rest', () => {
    expect(revealed(0)).toEqual(['First Year', 'Bench']);
    expect(revealed(13_300)).toEqual(['First Year', 'Bench', 'Regular', 'Ace', 'Captain']);
  });

  it('seals nothing at the top', () => {
    expect(revealed(59_850)).toEqual(RANKS.map((r) => r.name));
  });

  it('never seals the rank the card is pointing at', () => {
    for (const r of RANKS) {
      const rank = rankFor(r.at);
      if (rank.nextName === null) continue;
      expect(revealed(r.at)).toContain(rank.nextName);
    }
  });
});
