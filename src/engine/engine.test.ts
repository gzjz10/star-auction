import { describe, expect, it } from 'vitest';
import { getPlayer } from '../data';
import { aiDecide } from './ai';
import {
  createGame,
  minBid,
  reduce,
  squadOf,
  totalRounds,
  type GameConfig,
  type GameState,
  type NewTeam,
} from './auction';
import { FORMATION_IDS, isEligible } from './formations';
import { simulateMatch } from './match';
import { createRng } from './rng';
import { RULES } from './rules';
import { scoreSquad } from './scoring';

const teams: [NewTeam, NewTeam] = [
  { name: 'Red', crest: { shape: 'shield', mark: 'star' }, controller: 'human' },
  { name: 'Blue', crest: { shape: 'round', mark: 'falcon' }, controller: 'ai' },
];

const cfg = (over: Partial<GameConfig> = {}): GameConfig => ({
  mode: 'ai',
  formation: '4-3-3',
  difficulty: 'hard',
  timer: 20,
  chemistry: true,
  cash: true,
  seed: 1234,
  ...over,
});

/** Play a whole auction with both corners driven by the AI. */
function playOut(state: GameState, seed = 7): GameState {
  const rand = createRng(seed);
  let s = state;
  let guard = 0;
  while (s.phase !== 'finished') {
    if (++guard > 2000) throw new Error('auction did not finish');
    if (s.phase === 'sold') {
      s = reduce(s, { type: 'next' });
      continue;
    }
    const move = aiDecide(s, s.turn, rand);
    s =
      move.type === 'bid'
        ? reduce(s, { type: 'bid', team: s.turn, amount: move.amount, seq: s.seq })
        : reduce(s, { type: 'pass', team: s.turn, seq: s.seq });
  }
  return s;
}

describe('auction', () => {
  it('draws the same lots for the same seed', () => {
    const a = playOut(createGame(cfg(), teams));
    const b = playOut(createGame(cfg(), teams));
    expect(a.teams[0].picks.map((p) => p.playerId)).toEqual(b.teams[0].picks.map((p) => p.playerId));
  });

  it.each(FORMATION_IDS)('completes a full %s auction with legal, position-strict squads', (formation) => {
    for (let seed = 1; seed <= 25; seed++) {
      for (const difficulty of ['easy', 'normal', 'hard', 'legend'] as const) {
        const end = playOut(createGame(cfg({ formation, seed, difficulty }), teams), seed);
        const rounds = totalRounds(end.config);
        const all = end.teams.flatMap((t) => t.picks.map((p) => p.playerId));
        expect(new Set(all).size).toBe(rounds * 2);
        for (const t of [0, 1] as const) {
          expect(end.teams[t].picks).toHaveLength(rounds);
          expect(end.teams[t].budget).toBeGreaterThanOrEqual(0);
          for (const e of squadOf(end, t)) expect(isEligible(getPlayer(e.playerId), e.kind)).toBe(true);
        }
      }
    }
  });

  it('opens at the opening price, raises by the step and settles on pass', () => {
    let s = createGame(cfg(), teams);
    const first = s.turn;
    const second = first === 0 ? 1 : 0;
    expect(minBid(s)).toBe(s.lot.opening);
    // Below the opening price is refused.
    expect(reduce(s, { type: 'bid', team: first, amount: s.lot.opening - 5, seq: s.seq })).toBe(s);
    s = reduce(s, { type: 'bid', team: first, amount: s.lot.opening, seq: s.seq });
    expect(s.bid.holder).toBe(first);
    expect(s.turn).toBe(second);
    expect(minBid(s)).toBe(s.lot.opening + s.lot.step);
    s = reduce(s, { type: 'pass', team: second, seq: s.seq });
    expect(s.phase).toBe('sold');
    expect(s.settlement).toMatchObject({ openTo: first, hiddenTo: second, price: s.lot.opening, reason: 'won' });
    expect(s.teams[first].budget).toBe(RULES.budget - s.lot.opening);
    expect(s.teams[second].budget).toBe(RULES.budget);
    expect(s.teams[second].picks[0].via).toBe('hidden');
  });

  it('ignores stale actions, so a late timer or AI move can never act twice', () => {
    let s = createGame(cfg(), teams);
    const staleSeq = s.seq;
    s = reduce(s, { type: 'bid', team: s.turn, amount: s.lot.opening, seq: s.seq });
    const after = s;
    expect(reduce(s, { type: 'timeout', seq: staleSeq })).toBe(after);
    expect(reduce(s, { type: 'pass', team: s.turn, seq: staleSeq })).toBe(after);
    expect(reduce(s, { type: 'bid', team: s.turn, amount: 400, seq: staleSeq })).toBe(after);
  });

  it('refuses bids out of turn or above the budget', () => {
    const s = createGame(cfg(), teams);
    const off = s.turn === 0 ? 1 : 0;
    expect(reduce(s, { type: 'bid', team: off, amount: s.lot.opening, seq: s.seq })).toBe(s);
    expect(reduce(s, { type: 'bid', team: s.turn, amount: RULES.budget + 5, seq: s.seq })).toBe(s);
  });

  it('gives an unbid open card to the poorer corner and the hidden card to the other', () => {
    let s = createGame(cfg(), teams);
    s = { ...s, teams: [{ ...s.teams[0], budget: 100 }, s.teams[1]] };
    s = reduce(s, { type: 'pass', team: s.turn, seq: s.seq });
    expect(s.phase).toBe('bidding');
    s = reduce(s, { type: 'timeout', seq: s.seq });
    expect(s.phase).toBe('sold');
    expect(s.settlement).toMatchObject({ openTo: 0, hiddenTo: 1, price: 0, reason: 'unbid' });
  });
});

describe('scoring', () => {
  it('adds ratings, chemistry and cash', () => {
    const end = playOut(createGame(cfg(), teams));
    const sq = squadOf(end, 0);
    const on = scoreSquad(sq, end.teams[0].budget, { chemistry: true, cash: true });
    const off = scoreSquad(sq, end.teams[0].budget, { chemistry: false, cash: false });
    expect(on.total).toBe(on.ratings + on.club + on.nation + on.league + on.cash);
    expect(off.total).toBe(off.ratings);
    expect(on.club).toBeLessThanOrEqual(RULES.clubCap);
    expect(on.cash).toBe(Math.floor(end.teams[0].budget / RULES.cashPerPoint));
  });
});

describe('match simulation', () => {
  it('produces plausible, unscripted results', () => {
    const end = playOut(createGame(cfg(), teams));
    const squads = [squadOf(end, 0), squadOf(end, 1)] as const;
    let goals = 0;
    const outcomes = new Set<string>();
    for (let seed = 1; seed <= 300; seed++) {
      const m = simulateMatch([squads[0], squads[1]], seed);
      goals += m.score[0] + m.score[1];
      outcomes.add(m.score[0] > m.score[1] ? 'home' : m.score[0] < m.score[1] ? 'away' : 'draw');
      const goalEvents = m.events.filter((e) => e.type === 'goal').length;
      expect(goalEvents).toBe(m.score[0] + m.score[1]);
      expect(m.possession[0] + m.possession[1]).toBe(100);
    }
    const avg = goals / 300;
    expect(avg).toBeGreaterThan(1.4);
    expect(avg).toBeLessThan(4.2);
    expect(outcomes.size).toBe(3);
  });

  it('is deterministic for a seed', () => {
    const end = playOut(createGame(cfg(), teams));
    const sq: [ReturnType<typeof squadOf>, ReturnType<typeof squadOf>] = [squadOf(end, 0), squadOf(end, 1)];
    expect(simulateMatch(sq, 99)).toEqual(simulateMatch(sq, 99));
  });
});
