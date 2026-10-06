import { describe, expect, it } from 'vitest';
import { createGame, type GameConfig } from '../engine/auction';
import { CODE_LENGTH, guestAction, newRoomCode, normalizeCode, parseGuestMsg, parseHostMsg, PROTOCOL } from './protocol';

const config: GameConfig = { mode: 'online', formation: '4-3-3', difficulty: 'normal', timer: 20, chemistry: true, cash: true, seed: 42 };
const crest = { shape: 'shield', mark: 'falcon' } as const;

describe('room codes', () => {
  it('generates readable codes that normalize to themselves', () => {
    for (let i = 0; i < 200; i++) {
      const code = newRoomCode();
      expect(code).toHaveLength(CODE_LENGTH);
      expect(code).not.toMatch(/[IO01]/);
      expect(normalizeCode(code)).toBe(code);
    }
  });

  it('accepts lowercase, spaces and dashes, rejects lookalikes and wrong lengths', () => {
    expect(normalizeCode(' ab-c 23 ')).toBe('ABC23');
    expect(normalizeCode('ABCD')).toBeNull();
    expect(normalizeCode('ABCDEF')).toBeNull();
    expect(normalizeCode('ABC0O')).toBeNull();
  });
});

describe('guest messages', () => {
  it('accepts a hello and trims the team name', () => {
    const msg = parseGuestMsg({ t: 'hello', v: PROTOCOL, clientId: 'c1', name: '  Lions of the Gulf Coast FC  ', crest });
    expect(msg).toEqual({ t: 'hello', v: PROTOCOL, clientId: 'c1', name: 'Lions of the Gulf', crest });
  });

  it('rejects a hello with a bad crest or empty name', () => {
    expect(parseGuestMsg({ t: 'hello', v: 1, clientId: 'c1', name: 'A', crest: { shape: 'hexagon', mark: 'star' } })).toBeNull();
    expect(parseGuestMsg({ t: 'hello', v: 1, clientId: 'c1', name: '   ', crest })).toBeNull();
  });

  it('rebuilds actions and drops malformed ones', () => {
    expect(parseGuestMsg({ t: 'action', action: { type: 'bid', team: 1, amount: 25, seq: 3, extra: 'x' } })).toEqual({
      t: 'action',
      action: { type: 'bid', team: 1, amount: 25, seq: 3 },
    });
    expect(parseGuestMsg({ t: 'action', action: { type: 'bid', team: 2, amount: 25, seq: 3 } })).toBeNull();
    expect(parseGuestMsg({ t: 'action', action: { type: 'bid', team: 1, amount: 2.5, seq: 3 } })).toBeNull();
    expect(parseGuestMsg({ t: 'action', action: { type: 'steal' } })).toBeNull();
    expect(parseGuestMsg('hello')).toBeNull();
  });

  it('lets the guest act only for the blue corner', () => {
    expect(guestAction({ type: 'bid', team: 0, amount: 25, seq: 0 })).toBeNull();
    expect(guestAction({ type: 'pass', team: 0, seq: 0 })).toBeNull();
    expect(guestAction({ type: 'pass', team: 1, seq: 0 })).toEqual({ type: 'pass', team: 1, seq: 0 });
    expect(guestAction({ type: 'timeout', seq: 4 })).toEqual({ type: 'timeout', seq: 4 });
    expect(guestAction({ type: 'next' })).toEqual({ type: 'next' });
  });
});

describe('host messages', () => {
  const game = createGame(config, [
    { name: 'Falcons', crest, controller: 'human' },
    { name: 'Lions', crest, controller: 'human' },
  ]);

  it('accepts an online game state', () => {
    expect(parseHostMsg({ t: 'state', game })).toEqual({ t: 'state', game });
  });

  it('rejects a local game, a broken state and unknown messages', () => {
    expect(parseHostMsg({ t: 'state', game: { ...game, config: { ...config, mode: 'pvp' } } })).toBeNull();
    expect(parseHostMsg({ t: 'state', game: { ...game, lot: { ...game.lot, openId: 'nobody' } } })).toBeNull();
    expect(parseHostMsg({ t: 'refused', reason: 'full' })).toEqual({ t: 'refused', reason: 'full' });
    expect(parseHostMsg({ t: 'refused', reason: 'bored' })).toBeNull();
  });
});
