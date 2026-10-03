import { CLUBS } from './clubs';
import { LEAGUES } from './leagues';
import { NATIONS } from './nations';
import { DATA_AS_OF, PLAYERS } from './players';
import type { Club, League, Nation, Player } from './types';

export type { Club, League, Nation, Player } from './types';
export { CLUBS, LEAGUES, NATIONS, PLAYERS, DATA_AS_OF };

const playerMap = new Map<string, Player>(PLAYERS.map((p) => [p.id, p]));
const clubMap = new Map<string, Club>(CLUBS.map((c) => [c.code, c]));
const nationMap = new Map<string, Nation>(NATIONS.map((n) => [n.code, n]));
const leagueMap = new Map<string, League>(LEAGUES.map((l) => [l.code, l]));

export function getPlayer(id: string): Player {
  const p = playerMap.get(id);
  if (!p) throw new Error(`Unknown player ${id}`);
  return p;
}

export function getClub(code: string): Club {
  const c = clubMap.get(code);
  if (!c) throw new Error(`Unknown club ${code}`);
  return c;
}

export function getNation(code: string): Nation {
  const n = nationMap.get(code);
  if (!n) throw new Error(`Unknown nation ${code}`);
  return n;
}

export function getLeague(code: string): League {
  const l = leagueMap.get(code);
  if (!l) throw new Error(`Unknown league ${code}`);
  return l;
}

export function hasPlayer(id: string): boolean {
  return playerMap.has(id);
}
