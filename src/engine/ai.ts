import { getPlayer, PLAYERS } from '../data';
import { minBid, other, totalRounds, type Difficulty, type GameState, type TeamIdx } from './auction';
import { isEligible } from './formations';
import { createRng, deriveSeed } from './rng';
import { roundTo5, RULES } from './rules';
import { effectiveRating } from './scoring';

export type AiMove = { type: 'bid'; amount: number } | { type: 'pass' };

const PROFILE: Record<Difficulty, { factor: number; noise: number; jumpChance: number }> = {
  easy: { factor: 0.6, noise: 0.35, jumpChance: 0.1 },
  normal: { factor: 0.85, noise: 0.2, jumpChance: 0.2 },
  hard: { factor: 1, noise: 0.1, jumpChance: 0.3 },
  legend: { factor: 1.1, noise: 0.05, jumpChance: 0.35 },
};

/** What the AI expects the hidden card to be worth: the average of the weaker 60% of the pool. */
function expectedHiddenRating(state: GameState): number {
  const { lot } = state;
  const used = new Set(state.teams.flatMap((t) => t.picks.map((p) => p.playerId)));
  used.add(lot.openId);
  const pool = PLAYERS.filter((p) => !used.has(p.id) && isEligible(p, lot.kind))
    .map((p) => effectiveRating(p, lot.kind))
    .sort((a, b) => a - b);
  if (pool.length === 0) return 70;
  const weak = pool.slice(0, Math.max(1, Math.ceil(pool.length * 0.6)));
  return weak.reduce((s, r) => s + r, 0) / weak.length;
}

/**
 * The most this AI will pay for the open card this round, in €M.
 * Fixed per round (seeded), so the AI never changes its mind between turns.
 */
export function aiCeiling(state: GameState, team: TeamIdx): number {
  const { lot, config } = state;
  const me = state.teams[team];
  const open = getPlayer(lot.openId);
  const profile = PROFILE[config.difficulty];

  const gap = effectiveRating(open, lot.kind) - expectedHiddenRating(state);
  let chemistry = 0;
  if (config.chemistry) {
    for (const p of me.picks) {
      const q = getPlayer(p.playerId);
      if (q.club === open.club) chemistry += RULES.clubPairPoints;
      if (q.nation === open.nation) chemistry += RULES.nationPairPoints;
    }
  }
  // Winning the open card swings the score twice: we gain it and the rival does not.
  const swing = 2 * gap + chemistry;
  if (swing <= 0) return 0;

  const breakEven = config.cash ? swing * RULES.cashPerPoint : Infinity;
  const roundsLeft = totalRounds(config) - lot.slot;
  const pacing = (me.budget / roundsLeft) * (1 + Math.max(0, gap) / 6);

  const rng = createRng(deriveSeed(config.seed ^ 0x5eed, lot.slot * 2 + team));
  const mood = profile.factor + (rng() * 2 - 1) * profile.noise;
  let ceiling = Math.min(breakEven, pacing) * mood;

  if (config.difficulty === 'legend') {
    // Never pay more than the rival could possibly match.
    const rivalBudget = state.teams[other(team)].budget;
    ceiling = Math.min(ceiling, rivalBudget + lot.step);
  }
  return Math.max(0, Math.min(me.budget, roundTo5(ceiling)));
}

export function aiDecide(state: GameState, team: TeamIdx, rand: () => number = Math.random): AiMove {
  if (state.phase !== 'bidding' || state.turn !== team) return { type: 'pass' };
  const ceiling = aiCeiling(state, team);
  const floor = minBid(state);
  const budget = state.teams[team].budget;
  if (floor > ceiling || floor > budget) return { type: 'pass' };

  const profile = PROFILE[state.config.difficulty];
  let amount = floor;
  const headroom = ceiling - floor;
  if (headroom >= state.lot.step * 3 && rand() < profile.jumpChance) {
    amount = floor + state.lot.step * (rand() < 0.5 ? 1 : 2);
  }
  amount = Math.min(amount, ceiling, budget);
  return { type: 'bid', amount };
}

/** Human-feeling think time in ms; shorter when the decision is obvious. */
export function aiThinkMs(state: GameState, team: TeamIdx, rand: () => number = Math.random): number {
  const ceiling = aiCeiling(state, team);
  const close = Math.abs(ceiling - minBid(state)) <= state.lot.step * 2;
  return Math.round((close ? 1400 : 700) + rand() * 900);
}
