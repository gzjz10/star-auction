import { getClub, getPlayer } from '../data';
import type { Player } from '../data/types';
import { fitPenalty, type SlotKind } from './formations';
import { RULES } from './rules';

export interface ScoringOptions {
  chemistry: boolean;
  cash: boolean;
}

export interface SquadEntry {
  playerId: string;
  kind: SlotKind;
}

export interface ScoreBreakdown {
  /** Sum of effective ratings (overall minus out-of-position penalty). */
  ratings: number;
  fitPenalty: number;
  club: number;
  nation: number;
  league: number;
  cash: number;
  total: number;
}

function pairCount(keys: string[]): number {
  const counts = new Map<string, number>();
  for (const k of keys) counts.set(k, (counts.get(k) ?? 0) + 1);
  let pairs = 0;
  for (const n of counts.values()) pairs += (n * (n - 1)) / 2;
  return pairs;
}

export function effectiveRating(player: Player, kind: SlotKind): number {
  return player.ovr - fitPenalty(player, kind);
}

export function scoreSquad(squad: SquadEntry[], budgetLeft: number, opts: ScoringOptions): ScoreBreakdown {
  const players = squad.map((e) => getPlayer(e.playerId));
  const penalty = squad.reduce((s, e, i) => s + fitPenalty(players[i], e.kind), 0);
  const ratings = players.reduce((s, p) => s + p.ovr, 0) - penalty;

  let club = 0;
  let nation = 0;
  let league = 0;
  if (opts.chemistry) {
    club = Math.min(RULES.clubCap, pairCount(players.map((p) => p.club)) * RULES.clubPairPoints);
    nation = Math.min(RULES.nationCap, pairCount(players.map((p) => p.nation)) * RULES.nationPairPoints);
    const perLeague = new Map<string, number>();
    for (const p of players) {
      const lg = getClub(p.club).league;
      perLeague.set(lg, (perLeague.get(lg) ?? 0) + 1);
    }
    let groups = 0;
    for (const n of perLeague.values()) groups += Math.floor(n / RULES.leagueGroup);
    league = Math.min(RULES.leagueCap, groups * RULES.leaguePoints);
  }
  const cash = opts.cash ? Math.floor(budgetLeft / RULES.cashPerPoint) : 0;

  return {
    ratings,
    fitPenalty: penalty,
    club,
    nation,
    league,
    cash,
    total: ratings + club + nation + league + cash,
  };
}
