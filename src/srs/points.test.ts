import { describe, it, expect } from 'vitest';
import { computePoints, previewAward, streakOn, streakMultiplier, SESSION_XP, RANKS, MISSION_XP, SESSION_VALUE, sessionValue, MAX_STREAK_MULTIPLIER, STREAK_RAMP_DAYS, rankFor, promotionLabel } from './points';
import type { SessionRecord } from './types';
import type { SessionLength } from './settings';

/** Local noon on the given day, so nothing here sits near a timezone edge. */
function at(day: string, hour = 12): number {
  return new Date(`${day}T${String(hour).padStart(2, '0')}:00:00`).getTime();
}

function session(
  day: string,
  answers: number,
  completed = true,
  hour = 12,
  length: SessionLength = 'long'
): SessionRecord {
  const startedAt = at(day, hour);
  return { startedAt, endedAt: startedAt + 300_000, deck: 'vocabulary', answers, length, completed };
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

  it('pays the flat amount plus the deck daily on a first session', () => {
    const s = [session('2026-03-30', 30)];
    // Streak is 1 on the very first day, so the multiplier is already slightly
    // above 1 - assert against the formula rather than a magic number.
    // one day of vocabulary also clears that deck's daily mission
    const expected =
      Math.round(SESSION_XP.long * streakMultiplier(1) * RANKS[0]!.mult) + MISSION_XP;
    expect(computePoints(s, new Date(at('2026-03-30'))).total).toBe(expected);
  });

  it('pays a Long more than a Short', () => {
    const now = new Date(at('2026-03-30'));
    const short = computePoints([session('2026-03-30', 10, true, 12, 'short')], now).awards[0]!;
    const long = computePoints([session('2026-03-30', 25, true, 12, 'long')], now).awards[0]!;
    expect(long.points).toBeGreaterThan(short.points);
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

  it('keeps one Long ahead of two Shorts', () => {
    // chris's actual complaint: under per-answer scoring two Shorts earned the
    // same per card as one Long, so doing less was the better play.
    const now = new Date(at('2026-03-30'));
    const long = computePoints([session('2026-03-30', 25, true, 12, 'long')], now).total;
    const twoShorts = computePoints(
      [session('2026-03-30', 10, true, 9, 'short'), session('2026-03-30', 10, true, 17, 'short')],
      now
    ).total;
    expect(long).toBeGreaterThan(twoShorts);
  });

  it('pays more per sitting at higher rank', () => {
    // rank is read from xp earned so far, so a long history earns at the
    // higher rate its own history bought
    expect(RANKS[RANKS.length - 1]!.mult).toBeGreaterThan(RANKS[0]!.mult);
    const now = new Date(at('2026-03-30'));
    const rich = computePoints(
      [...run(120, 50), session('2026-03-30', 25, true, 20)],
      now
    ).awards;
    const poor = computePoints([session('2026-03-30', 25)], now).awards[0]!;
    const lastRich = rich[rich.length - 1]!;
    expect(lastRich.rankMult).toBeGreaterThan(poor.rankMult);
  });

  it('pays an abandoned sitting nothing at all', () => {
    // the sitting is the unit now, and half a sitting is not one. only the
    // deck's daily survives, since the deck was still studied.
    const now = new Date(at('2026-03-30'));
    const finished = computePoints([session('2026-03-30', 30, true)], now);
    const abandoned = computePoints([session('2026-03-30', 30, false)], now);
    expect(finished.total).toBeGreaterThan(abandoned.total);
    expect(abandoned.awards[0]!.points).toBe(0);
    expect(abandoned.total).toBe(MISSION_XP);
  });

  it('cannot be farmed by answering more inside one sitting', () => {
    // the old scoring paid per grade press, so a failed card coming round
    // again paid twice - answering 25 cards badly beat answering them well.
    const now = new Date(at('2026-03-30'));
    const clean = computePoints([session('2026-03-30', 25)], now).total;
    const messy = computePoints([session('2026-03-30', 75)], now).total;
    expect(messy).toBe(clean);
  });

  it('pays a flat amount for the preset, whatever happened inside', () => {
    const now = new Date(at('2026-03-30'));
    const short = computePoints([session('2026-03-30', 99, true, 12, 'short')], now);
    const long = computePoints([session('2026-03-30', 1, true, 12, 'long')], now);
    // streak is 1 on the first day, so both carry the same 1.04x
    expect(short.awards[0]!.points).toBe(Math.round(SESSION_XP.short * streakMultiplier(1)));
    expect(long.awards[0]!.points).toBe(Math.round(SESSION_XP.long * streakMultiplier(1)));
  });

  it('scores a sitting recorded before lengths existed as a Long', () => {
    const now = new Date(at('2026-03-30'));
    const legacy = { ...session('2026-03-30', 30) };
    delete (legacy as { length?: unknown }).length;
    expect(computePoints([legacy], now).awards[0]!.points).toBe(
      Math.round(SESSION_XP.long * streakMultiplier(1))
    );
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

  it('survives a length the store should never have held', () => {
    // read back from IndexedDB, which the user can edit and a restored backup
    // can carry anything into. an unknown preset must not turn the total NaN.
    const now = new Date(at('2026-03-30'));
    const junk = { ...session('2026-03-30', 30), length: 'enormous' as unknown as SessionLength };
    const total = computePoints([junk], now).total;
    expect(Number.isFinite(total)).toBe(true);
    expect(total).toBe(Math.round(SESSION_XP.long * streakMultiplier(1)) + MISSION_XP);
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
    const predicted = previewAward(history, 'long', true, now);
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
