import { CREST_MARKS, CREST_SHAPES } from '../components/Crest';
import type { Action, Crest, GameState, TeamIdx } from '../engine/auction';
import { isUsableSave } from '../engine/save';

/**
 * Online play is host-authoritative: the red corner's device runs the reducer and
 * sends the whole state after every accepted action. The blue corner only sends
 * actions. Bump PROTOCOL whenever a message or GameState changes shape.
 */
export const PROTOCOL = 1;

/** Room codes are public broker ids, so they are namespaced to this game. */
export const PEER_PREFIX = 'star-auction-v1-';

/** No I, O, 0 or 1: codes get read aloud across a room. */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CODE_LENGTH = 5;

export const HOST_SEAT: TeamIdx = 0;
export const GUEST_SEAT: TeamIdx = 1;

const NAME_MAX = 18;

export function newRoomCode(rand: () => number = Math.random): string {
  let code = '';
  for (let i = 0; i < CODE_LENGTH; i++) code += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  return code;
}

/** Uppercases and strips spaces or dashes; null unless it is a well-formed code. */
export function normalizeCode(input: string): string | null {
  const code = input.toUpperCase().replace(/[\s-]/g, '');
  if (code.length !== CODE_LENGTH) return null;
  return [...code].every((c) => ALPHABET.includes(c)) ? code : null;
}

export interface Hello {
  t: 'hello';
  v: number;
  clientId: string;
  name: string;
  crest: Crest;
}

export type GuestMsg = Hello | { t: 'action'; action: Action } | { t: 'again'; fresh: boolean };

export type HostMsg = { t: 'state'; game: GameState } | { t: 'refused'; reason: 'full' | 'version' };

type Obj = Record<string, unknown>;

const isObj = (x: unknown): x is Obj => typeof x === 'object' && x !== null && !Array.isArray(x);
const isTeam = (x: unknown): x is TeamIdx => x === 0 || x === 1;
const isSeq = (x: unknown): x is number => Number.isInteger(x) && (x as number) >= 0;

function parseCrest(x: unknown): Crest | null {
  if (!isObj(x)) return null;
  const { shape, mark } = x;
  return CREST_SHAPES.includes(shape as Crest['shape']) && CREST_MARKS.includes(mark as Crest['mark'])
    ? { shape: shape as Crest['shape'], mark: mark as Crest['mark'] }
    : null;
}

function parseAction(x: unknown): Action | null {
  if (!isObj(x)) return null;
  switch (x.type) {
    case 'bid':
      return isTeam(x.team) && Number.isInteger(x.amount) && isSeq(x.seq)
        ? { type: 'bid', team: x.team, amount: x.amount as number, seq: x.seq }
        : null;
    case 'pass':
      return isTeam(x.team) && isSeq(x.seq) ? { type: 'pass', team: x.team, seq: x.seq } : null;
    case 'timeout':
      return isSeq(x.seq) ? { type: 'timeout', seq: x.seq } : null;
    case 'next':
      return { type: 'next' };
    default:
      return null;
  }
}

/** Everything from the guest is untrusted: rebuild it field by field or drop it. */
export function parseGuestMsg(raw: unknown): GuestMsg | null {
  if (!isObj(raw)) return null;
  switch (raw.t) {
    case 'hello': {
      const crest = parseCrest(raw.crest);
      const name = typeof raw.name === 'string' ? raw.name.trim().slice(0, NAME_MAX).trim() : '';
      const clientId = typeof raw.clientId === 'string' ? raw.clientId.slice(0, 64) : '';
      if (!crest || !name || !clientId || typeof raw.v !== 'number') return null;
      return { t: 'hello', v: raw.v, clientId, name, crest };
    }
    case 'action': {
      const action = parseAction(raw.action);
      return action ? { t: 'action', action } : null;
    }
    case 'again':
      return { t: 'again', fresh: raw.fresh === true };
    default:
      return null;
  }
}

export function parseHostMsg(raw: unknown): HostMsg | null {
  if (!isObj(raw)) return null;
  if (raw.t === 'state') {
    const game = raw.game as GameState | null;
    return isUsableSave(game) && game.config?.mode === 'online' ? { t: 'state', game } : null;
  }
  if (raw.t === 'refused' && (raw.reason === 'full' || raw.reason === 'version')) {
    return { t: 'refused', reason: raw.reason };
  }
  return null;
}

/** The guest may only bid or pass for its own corner; clocks and "next" are shared. */
export function guestAction(action: Action, seat: TeamIdx = GUEST_SEAT): Action | null {
  if ((action.type === 'bid' || action.type === 'pass') && action.team !== seat) return null;
  return action;
}
