import type { DataConnection, Peer, PeerOptions } from 'peerjs';
import { newRoomCode, PEER_PREFIX, type GuestMsg, type HostMsg } from './protocol';

/**
 * Transport only: a direct WebRTC data channel between two browsers, introduced by
 * the free public PeerJS broker. No game server and no keys. Game logic lives in
 * useOnline; this file knows nothing about auctions.
 */

const PING = { t: 'ping' };
const PING_MS = 4000;
/** A phone that locks its screen keeps the channel "open" but silent; treat silence as a drop. */
const SILENCE_MS = 13000;
const CONNECT_TIMEOUT_MS = 15000;
const RETRY_MS = 2500;

function peerOptions(): PeerOptions {
  // STUN only by default. Set VITE_ICE_SERVERS (JSON array of RTCIceServer) to add a TURN relay
  // for networks that block direct links, such as some mobile carriers.
  let iceServers: RTCIceServer[] = [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }];
  const raw = import.meta.env.VITE_ICE_SERVERS as string | undefined;
  if (raw) {
    try {
      iceServers = JSON.parse(raw) as RTCIceServer[];
    } catch {
      // keep the defaults
    }
  }
  return { config: { iceServers }, debug: 0 };
}

const loadPeer = () => import('peerjs').then((m) => m.Peer);

/** Heartbeat both ways; calls onSilent once if the other side goes quiet. */
function keepAlive(conn: DataConnection, onSilent: () => void) {
  let last = Date.now();
  const touch = () => {
    last = Date.now();
  };
  conn.on('data', touch);
  const id = window.setInterval(() => {
    if (!conn.open) return;
    if (Date.now() - last > SILENCE_MS) {
      window.clearInterval(id);
      onSilent();
      return;
    }
    void conn.send(PING);
  }, PING_MS);
  return () => window.clearInterval(id);
}

const isPing = (d: unknown) => typeof d === 'object' && d !== null && (d as { t?: unknown }).t === 'ping';

/* ---------- Host ---------- */

export interface HostLink {
  code: string;
  send(connId: string, msg: HostMsg): void;
  drop(connId: string): void;
  close(): void;
}

export interface HostEvents {
  onMessage(connId: string, data: unknown): void;
  onClose(connId: string): void;
}

async function claimRoom(PeerCtor: typeof Peer): Promise<{ peer: Peer; code: string }> {
  for (let attempt = 0; attempt < 6; attempt++) {
    const code = newRoomCode();
    const peer = new PeerCtor(PEER_PREFIX + code, peerOptions());
    const ok = await new Promise<boolean>((resolve, reject) => {
      peer.once('open', () => resolve(true));
      peer.once('error', (err) => (err.type === 'unavailable-id' ? resolve(false) : reject(err)));
    }).catch((err) => {
      peer.destroy();
      throw err;
    });
    if (ok) return { peer, code };
    peer.destroy();
  }
  throw new Error('no free room code');
}

export async function openHost(ev: HostEvents): Promise<HostLink> {
  const PeerCtor = await loadPeer();
  const { peer, code } = await claimRoom(PeerCtor);
  const conns = new Map<string, { conn: DataConnection; stop: () => void }>();
  let closed = false;

  const forget = (id: string) => {
    const c = conns.get(id);
    if (!c) return;
    conns.delete(id);
    c.stop();
    c.conn.close();
    ev.onClose(id);
  };

  peer.on('connection', (conn) => {
    const id = conn.connectionId;
    conn.on('open', () => {
      conns.set(id, { conn, stop: keepAlive(conn, () => forget(id)) });
    });
    conn.on('data', (d) => {
      if (!isPing(d)) ev.onMessage(id, d);
    });
    conn.on('close', () => forget(id));
    conn.on('error', () => forget(id));
  });
  // Losing the broker does not drop open data channels; reconnect so new guests can still find us.
  peer.on('disconnected', () => {
    if (!closed) peer.reconnect();
  });
  peer.on('error', () => {
    // Per-connection failures surface on the connection; nothing to do here.
  });

  return {
    code,
    send(connId, msg) {
      const c = conns.get(connId);
      if (c?.conn.open) void c.conn.send(msg);
    },
    drop(connId) {
      // Let the refusal message flush before hanging up.
      window.setTimeout(() => forget(connId), 300);
    },
    close() {
      closed = true;
      for (const id of [...conns.keys()]) forget(id);
      peer.destroy();
    },
  };
}

/* ---------- Guest ---------- */

export interface GuestLink {
  send(msg: GuestMsg): void;
  close(): void;
}

export interface GuestEvents {
  /** The channel is open (first time or after a reconnect): say hello. */
  onOpen(): void;
  onMessage(data: unknown): void;
  /** Was connected, now lost; retrying in the background. */
  onLost(): void;
  /** Never connected and the code matches no room. */
  onNotFound(): void;
  /** Never connected and could not get through. */
  onFailed(): void;
}

export async function openGuest(code: string, ev: GuestEvents): Promise<GuestLink> {
  const PeerCtor = await loadPeer();
  const peer = new PeerCtor(peerOptions());
  let conn: DataConnection | null = null;
  let stop = () => {};
  let everOpen = false;
  let closed = false;
  let retry = 0;

  const scheduleRetry = () => {
    if (closed) return;
    window.clearTimeout(retry);
    retry = window.setTimeout(connect, RETRY_MS);
  };

  const lost = () => {
    stop();
    conn?.close();
    conn = null;
    if (closed) return;
    ev.onLost();
    scheduleRetry();
  };

  function connect() {
    if (closed) return;
    if (peer.disconnected) {
      peer.reconnect();
      scheduleRetry();
      return;
    }
    const c = peer.connect(PEER_PREFIX + code, { reliable: true, serialization: 'json' });
    conn = c;
    const timeout = window.setTimeout(() => {
      if (c.open || conn !== c) return;
      c.close();
      conn = null;
      if (everOpen) scheduleRetry();
      else if (!closed) ev.onFailed();
    }, CONNECT_TIMEOUT_MS);
    c.on('open', () => {
      window.clearTimeout(timeout);
      everOpen = true;
      stop = keepAlive(c, () => conn === c && lost());
      ev.onOpen();
    });
    c.on('data', (d) => {
      if (!isPing(d)) ev.onMessage(d);
    });
    c.on('close', () => conn === c && everOpen && lost());
    c.on('error', () => conn === c && everOpen && lost());
  }

  peer.on('open', connect);
  peer.on('disconnected', () => {
    if (!closed) peer.reconnect();
  });
  peer.on('error', (err) => {
    if (closed) return;
    if (err.type === 'peer-unavailable') {
      // The host is gone (or never existed). Before the first link that means a wrong code.
      conn = null;
      if (everOpen) scheduleRetry();
      else ev.onNotFound();
    } else if (err.type === 'browser-incompatible') {
      ev.onFailed();
    } else if (!everOpen && (err.type === 'network' || err.type === 'server-error' || err.type === 'socket-error')) {
      ev.onFailed();
    }
  });

  return {
    send(msg) {
      if (conn?.open) void conn.send(msg);
    },
    close() {
      closed = true;
      window.clearTimeout(retry);
      stop();
      conn?.close();
      peer.destroy();
    },
  };
}
