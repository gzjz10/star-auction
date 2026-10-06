import { hasPlayer } from '../data';
import type { GameConfig, GameState } from './auction';
import type { MatchResult } from './match';
import type { ScoreBreakdown } from './scoring';

const SAVE_KEY = 'star-auction:save:v1';
const HISTORY_KEY = 'star-auction:history:v1';
const SETTINGS_KEY = 'star-auction:settings:v1';
const HISTORY_LIMIT = 30;

export interface HistoryEntry {
  id: string;
  finishedAt: number;
  mode: GameConfig['mode'];
  formation: string;
  difficulty: string;
  names: [string, string];
  scores: [ScoreBreakdown, ScoreBreakdown];
  /** Final score of the match, when it was played. */
  match: [number, number] | null;
  /** Each corner's best signing: player id and price. */
  stars: [{ id: string; price: number } | null, { id: string; price: number } | null];
}

export interface Settings {
  lang: 'ar' | 'en';
  theme: 'system' | 'day' | 'night';
  sound: boolean;
}

export const DEFAULT_SETTINGS: Settings = { lang: 'ar', theme: 'system', sound: true };

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage full or blocked: the game still plays, it just won't resume.
  }
}

function remove(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

/** A save is only usable if it is our version and every player still exists in the database. */
export function isUsableSave(s: GameState | null): s is GameState {
  if (!s || s.version !== 1 || !s.lot || !Array.isArray(s.teams)) return false;
  const ids = [s.lot.openId, s.lot.hiddenId, ...s.teams.flatMap((t) => t.picks.map((p) => p.playerId))];
  return ids.every(hasPlayer);
}

export const storage = {
  loadGame(): GameState | null {
    const s = read<GameState>(SAVE_KEY);
    return isUsableSave(s) ? s : null;
  },
  saveGame(state: GameState): void {
    write(SAVE_KEY, state);
  },
  clearGame(): void {
    remove(SAVE_KEY);
  },
  loadHistory(): HistoryEntry[] {
    const h = read<HistoryEntry[]>(HISTORY_KEY);
    return Array.isArray(h) ? h : [];
  },
  addHistory(entry: HistoryEntry): HistoryEntry[] {
    const list = [entry, ...this.loadHistory().filter((e) => e.id !== entry.id)].slice(0, HISTORY_LIMIT);
    write(HISTORY_KEY, list);
    return list;
  },
  updateHistoryMatch(id: string, match: MatchResult['score']): HistoryEntry[] {
    const list = this.loadHistory().map((e) => (e.id === id ? { ...e, match } : e));
    write(HISTORY_KEY, list);
    return list;
  },
  clearHistory(): void {
    remove(HISTORY_KEY);
  },
  loadSettings(): Settings {
    return { ...DEFAULT_SETTINGS, ...(read<Partial<Settings>>(SETTINGS_KEY) ?? {}) };
  },
  saveSettings(s: Settings): void {
    write(SETTINGS_KEY, s);
  },
};
