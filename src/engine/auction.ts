import { getPlayer, PLAYERS } from '../data';
import { drawLot } from './draw';
import { FORMATIONS, type FormationId, type SlotKind } from './formations';
import { createRng, deriveSeed } from './rng';
import { minRaise, openingPrice, RULES } from './rules';

export type TeamIdx = 0 | 1;
export type Difficulty = 'easy' | 'normal' | 'hard' | 'legend';
export type Controller = 'human' | 'ai';

export type CrestShape = 'shield' | 'round' | 'pennant' | 'diamond';
export type CrestMark = 'star' | 'crescent' | 'falcon' | 'ball' | 'crown' | 'palm';

export interface Crest {
  shape: CrestShape;
  mark: CrestMark;
}

export interface GameConfig {
  mode: 'ai' | 'pvp' | 'online';
  formation: FormationId;
  difficulty: Difficulty;
  /** Seconds per turn, 0 = no timer. */
  timer: number;
  chemistry: boolean;
  cash: boolean;
  seed: number;
}

export interface Pick {
  slot: number;
  playerId: string;
  price: number;
  via: 'won' | 'hidden' | 'unbid';
}

export interface TeamState {
  name: string;
  crest: Crest;
  controller: Controller;
  budget: number;
  picks: Pick[];
}

export interface Lot {
  slot: number;
  kind: SlotKind;
  openId: string;
  hiddenId: string;
  opening: number;
  step: number;
  startedBy: TeamIdx;
}

export interface BidEntry {
  team: TeamIdx;
  amount: number;
}

export interface Settlement {
  openTo: TeamIdx;
  hiddenTo: TeamIdx;
  price: number;
  reason: 'won' | 'unbid';
}

export interface GameState {
  version: 1;
  id: string;
  createdAt: number;
  config: GameConfig;
  teams: [TeamState, TeamState];
  lot: Lot;
  bid: { amount: number; holder: TeamIdx | null; history: BidEntry[] };
  turn: TeamIdx;
  /** Consecutive passes while nobody holds a bid. */
  passes: number;
  phase: 'bidding' | 'sold' | 'finished';
  settlement: Settlement | null;
  /** Bumped on every accepted action; stale actions (timers, AI) are ignored. */
  seq: number;
}

export type Action =
  | { type: 'bid'; team: TeamIdx; amount: number; seq: number }
  | { type: 'pass'; team: TeamIdx; seq: number }
  | { type: 'timeout'; seq: number }
  | { type: 'next' };

export const other = (t: TeamIdx): TeamIdx => (t === 0 ? 1 : 0);

export function slotsOf(config: GameConfig) {
  return FORMATIONS[config.formation].slots;
}

export function totalRounds(config: GameConfig): number {
  return slotsOf(config).length;
}

function usedIds(teams: [TeamState, TeamState]): Set<string> {
  return new Set(teams.flatMap((t) => t.picks.map((p) => p.playerId)));
}

function makeLot(config: GameConfig, slot: number, used: Set<string>): Lot {
  const kind = slotsOf(config)[slot].kind;
  const rng = createRng(deriveSeed(config.seed, slot));
  const { openId, hiddenId } = drawLot(PLAYERS, kind, used, rng);
  const value = getPlayer(openId).value;
  return {
    slot,
    kind,
    openId,
    hiddenId,
    opening: openingPrice(value),
    step: minRaise(value),
    startedBy: (slot % 2) as TeamIdx,
  };
}

export interface NewTeam {
  name: string;
  crest: Crest;
  controller: Controller;
}

export function createGame(config: GameConfig, teams: [NewTeam, NewTeam], now = Date.now()): GameState {
  const team = (x: NewTeam): TeamState => ({ ...x, budget: RULES.budget, picks: [] });
  const t: [TeamState, TeamState] = [team(teams[0]), team(teams[1])];
  const lot = makeLot(config, 0, new Set());
  return {
    version: 1,
    id: `${now.toString(36)}-${config.seed.toString(36)}`,
    createdAt: now,
    config,
    teams: t,
    lot,
    bid: { amount: 0, holder: null, history: [] },
    turn: lot.startedBy,
    passes: 0,
    phase: 'bidding',
    settlement: null,
    seq: 0,
  };
}

/** Lowest legal bid for the team on turn, or null when they cannot afford one. */
export function minBid(state: GameState): number {
  return state.bid.holder === null ? state.lot.opening : state.bid.amount + state.lot.step;
}

export function canBid(state: GameState, team: TeamIdx, amount: number): boolean {
  return (
    state.phase === 'bidding' &&
    state.turn === team &&
    Number.isInteger(amount) &&
    amount % 5 === 0 &&
    amount >= minBid(state) &&
    amount <= state.teams[team].budget
  );
}

function settle(state: GameState, s: Settlement): GameState {
  const teams = state.teams.map((t) => ({ ...t, picks: [...t.picks] })) as [TeamState, TeamState];
  const { lot } = state;
  teams[s.openTo].picks.push({ slot: lot.slot, playerId: lot.openId, price: s.price, via: s.reason });
  teams[s.openTo].budget -= s.price;
  teams[s.hiddenTo].picks.push({ slot: lot.slot, playerId: lot.hiddenId, price: 0, via: 'hidden' });
  return { ...state, teams, phase: 'sold', settlement: s, seq: state.seq + 1 };
}

function applyPass(state: GameState, team: TeamIdx): GameState {
  if (state.bid.holder !== null) {
    const winner = state.bid.holder;
    return settle(state, { openTo: winner, hiddenTo: other(winner), price: state.bid.amount, reason: 'won' });
  }
  const passes = state.passes + 1;
  if (passes >= 2) {
    // Nobody wanted the open card: it goes free to the corner with less money left.
    // On equal budgets it goes to the corner that did not open the round.
    const [a, b] = state.teams;
    const openTo: TeamIdx = a.budget < b.budget ? 0 : b.budget < a.budget ? 1 : other(state.lot.startedBy);
    return settle({ ...state, passes }, { openTo, hiddenTo: other(openTo), price: 0, reason: 'unbid' });
  }
  return { ...state, passes, turn: other(team), seq: state.seq + 1 };
}

export function reduce(state: GameState, action: Action): GameState {
  switch (action.type) {
    case 'bid': {
      if (action.seq !== state.seq || !canBid(state, action.team, action.amount)) return state;
      return {
        ...state,
        bid: {
          amount: action.amount,
          holder: action.team,
          history: [...state.bid.history, { team: action.team, amount: action.amount }],
        },
        turn: other(action.team),
        passes: 0,
        seq: state.seq + 1,
      };
    }
    case 'pass': {
      if (action.seq !== state.seq || state.phase !== 'bidding' || state.turn !== action.team) return state;
      return applyPass(state, action.team);
    }
    case 'timeout': {
      if (action.seq !== state.seq || state.phase !== 'bidding') return state;
      return applyPass(state, state.turn);
    }
    case 'next': {
      if (state.phase !== 'sold') return state;
      const nextSlot = state.lot.slot + 1;
      if (nextSlot >= totalRounds(state.config)) {
        return { ...state, phase: 'finished', seq: state.seq + 1 };
      }
      const lot = makeLot(state.config, nextSlot, usedIds(state.teams));
      return {
        ...state,
        lot,
        bid: { amount: 0, holder: null, history: [] },
        turn: lot.startedBy,
        passes: 0,
        phase: 'bidding',
        settlement: null,
        seq: state.seq + 1,
      };
    }
  }
}

/** Raise options offered as buttons for the team on turn, filtered to what they can afford. */
export function raiseOptions(state: GameState): number[] {
  const team = state.teams[state.turn];
  const base = minBid(state);
  const opts = RULES.raiseMultiples.map((m) =>
    state.bid.holder === null ? state.lot.opening + (m - 1) * state.lot.step : state.bid.amount + m * state.lot.step,
  );
  const unique = [...new Set([base, ...opts])].filter((a) => a <= team.budget);
  return unique.sort((a, b) => a - b);
}

export function squadOf(state: GameState, team: TeamIdx) {
  const slots = slotsOf(state.config);
  return state.teams[team].picks.map((p) => ({ playerId: p.playerId, kind: slots[p.slot].kind }));
}
