import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { createGame, reduce, type Action, type GameConfig, type GameState, type NewTeam, type TeamIdx } from '../engine/auction';
import { GUEST_SEAT, guestAction, HOST_SEAT, parseGuestMsg, parseHostMsg, PROTOCOL } from './protocol';
import { openGuest, openHost, type GuestLink, type HostLink } from './room';

export type OnlineStatus =
  | 'opening' // host: claiming a room code
  | 'waiting' // host: room open, no guest yet
  | 'connecting' // guest: dialling the host
  | 'live'
  | 'lost' // was live, the other side dropped; reconnecting
  | 'notFound'
  | 'full'
  | 'version'
  | 'failed';

export interface OnlineSession {
  role: 'host' | 'guest';
  code: string | null;
  seat: TeamIdx;
  status: OnlineStatus;
}

const CLIENT_KEY = 'star-auction:client:v1';

/** Stable per browser, so a guest who reloads gets their corner back. */
function clientId(): string {
  try {
    let id = localStorage.getItem(CLIENT_KEY);
    if (!id) {
      id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem(CLIENT_KEY, id);
    }
    return id;
  } catch {
    return Math.random().toString(36).slice(2);
  }
}

interface Options {
  game: GameState | null;
  setGame: Dispatch<SetStateAction<GameState | null>>;
  /** A game arrived or began that this device has not shown yet. */
  onNewGame: (game: GameState) => void;
  /** Host only: the guest asked for another auction from the results bill. */
  onAgain: (fresh: boolean) => void;
}

export function useOnline({ game, setGame, onNewGame, onAgain }: Options) {
  const [session, setSession] = useState<OnlineSession | null>(null);
  const host = useRef<HostLink | null>(null);
  const guest = useRef<GuestLink | null>(null);
  /** Host: the guest's identity and current connection. */
  const seated = useRef<{ clientId: string; connId: string } | null>(null);
  /** Host: rules and red corner, held until the guest arrives. */
  const pending = useRef<{ config: GameConfig; team: NewTeam } | null>(null);
  /** Bumped by leave(), so a room that finishes opening after a cancel is closed at once. */
  const epoch = useRef(0);
  const gameRef = useRef(game);
  const cb = useRef({ onNewGame, onAgain });
  useEffect(() => {
    gameRef.current = game;
    cb.current = { onNewGame, onAgain };
  });

  const status = (s: OnlineStatus) => setSession((x) => (x ? { ...x, status: s } : x));

  const leave = useCallback(() => {
    epoch.current++;
    host.current?.close();
    guest.current?.close();
    host.current = guest.current = null;
    seated.current = pending.current = null;
    setSession(null);
  }, []);

  useEffect(() => leave, [leave]);

  const hostRoom = useCallback(
    async (config: GameConfig, team: NewTeam) => {
      leave();
      pending.current = { config: { ...config, mode: 'online' }, team: { ...team, controller: 'human' } };
      setSession({ role: 'host', code: null, seat: HOST_SEAT, status: 'opening' });
      const mine = epoch.current;
      try {
        const link = await openHost({
          onMessage(connId, raw) {
            const msg = parseGuestMsg(raw);
            if (!msg) return;
            if (msg.t === 'hello') {
              if (msg.v !== PROTOCOL) {
                link.send(connId, { t: 'refused', reason: 'version' });
                link.drop(connId);
                return;
              }
              if (seated.current && seated.current.clientId !== msg.clientId) {
                link.send(connId, { t: 'refused', reason: 'full' });
                link.drop(connId);
                return;
              }
              const prev = seated.current?.connId;
              seated.current = { clientId: msg.clientId, connId };
              if (prev && prev !== connId) link.drop(prev);
              status('live');
              const p = pending.current;
              if (p) {
                pending.current = null;
                const fresh = createGame(p.config, [p.team, { name: msg.name, crest: msg.crest, controller: 'human' }]);
                setGame(fresh);
                cb.current.onNewGame(fresh);
                link.send(connId, { t: 'state', game: fresh });
              } else if (gameRef.current) {
                // A returning guest: hand them the table as it stands.
                link.send(connId, { t: 'state', game: gameRef.current });
              }
              return;
            }
            if (seated.current?.connId !== connId) return;
            if (msg.t === 'action') {
              const action = guestAction(msg.action, GUEST_SEAT);
              if (action) setGame((g) => (g ? reduce(g, action) : g));
            } else {
              cb.current.onAgain(msg.fresh);
            }
          },
          onClose(connId) {
            if (seated.current?.connId === connId) status('lost');
          },
        });
        if (epoch.current !== mine) {
          link.close();
          return;
        }
        host.current = link;
        setSession((x) => (x?.role === 'host' ? { ...x, code: link.code, status: 'waiting' } : x));
      } catch {
        if (epoch.current === mine) status('failed');
      }
    },
    [leave, setGame],
  );

  const joinRoom = useCallback(
    async (code: string, team: Omit<NewTeam, 'controller'>) => {
      leave();
      setSession({ role: 'guest', code, seat: GUEST_SEAT, status: 'connecting' });
      const me = clientId();
      const mine = epoch.current;
      try {
        const link = await openGuest(code, {
          onOpen() {
            link.send({ t: 'hello', v: PROTOCOL, clientId: me, name: team.name, crest: team.crest });
          },
          onMessage(raw) {
            const msg = parseHostMsg(raw);
            if (!msg) return;
            if (msg.t === 'refused') {
              status(msg.reason);
              link.close();
              return;
            }
            const before = gameRef.current;
            status('live');
            setGame(msg.game);
            if (!before || before.id !== msg.game.id) cb.current.onNewGame(msg.game);
          },
          onLost: () => status('lost'),
          onNotFound: () => status('notFound'),
          onFailed: () => status('failed'),
        });
        if (epoch.current !== mine) {
          link.close();
          return;
        }
        guest.current = link;
      } catch {
        if (epoch.current === mine) status('failed');
      }
    },
    [leave, setGame],
  );

  // Host: every accepted change goes to the guest.
  useEffect(() => {
    const s = seated.current;
    if (session?.role === 'host' && game?.config.mode === 'online' && s) host.current?.send(s.connId, { t: 'state', game });
  }, [game, session?.role]);

  /** Guest actions travel to the host; the host's state is the only truth. */
  const send = useCallback((action: Action) => guest.current?.send({ t: 'action', action }), []);
  const askAgain = useCallback((fresh: boolean) => guest.current?.send({ t: 'again', fresh }), []);

  return { session, hostRoom, joinRoom, leave, send, askAgain };
}
