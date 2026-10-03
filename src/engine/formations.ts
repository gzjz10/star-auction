import type { Player, Position } from '../data/types';

export type SlotKind = Position;
export type FormationId = '4-3-3' | '4-4-2' | '3-5-2' | '4-2-3-1';

export interface Slot {
  kind: SlotKind;
  /** Pitch coordinates in %, x across (left wing = 0), y up from own goal (0) to opposition goal (100). */
  x: number;
  y: number;
}

export interface Formation {
  id: FormationId;
  /** Slots in auction order: one round per slot. */
  slots: Slot[];
}

/** Which player positions may fill a slot. The first entry is the natural position. */
export const ELIGIBLE: Record<SlotKind, Position[]> = {
  GK: ['GK'],
  LB: ['LB'],
  RB: ['RB'],
  CB: ['CB'],
  DM: ['DM', 'CM'],
  CM: ['CM', 'DM', 'AM'],
  AM: ['AM', 'CM'],
  LM: ['LM', 'LW'],
  RM: ['RM', 'RW'],
  LW: ['LW', 'LM'],
  RW: ['RW', 'RM'],
  ST: ['ST'],
};

const s = (kind: SlotKind, x: number, y: number): Slot => ({ kind, x, y });

export const FORMATIONS: Record<FormationId, Formation> = {
  '4-3-3': {
    id: '4-3-3',
    slots: [
      s('GK', 50, 6),
      s('CB', 37, 24),
      s('CB', 63, 24),
      s('LB', 13, 30),
      s('RB', 87, 30),
      s('DM', 50, 44),
      s('CM', 30, 54),
      s('CM', 70, 54),
      s('LW', 16, 78),
      s('RW', 84, 78),
      s('ST', 50, 86),
    ],
  },
  '4-4-2': {
    id: '4-4-2',
    slots: [
      s('GK', 50, 6),
      s('CB', 37, 24),
      s('CB', 63, 24),
      s('LB', 13, 30),
      s('RB', 87, 30),
      s('CM', 38, 50),
      s('CM', 62, 50),
      s('LM', 12, 58),
      s('RM', 88, 58),
      s('ST', 38, 84),
      s('ST', 62, 84),
    ],
  },
  '3-5-2': {
    id: '3-5-2',
    slots: [
      s('GK', 50, 6),
      s('CB', 26, 24),
      s('CB', 50, 22),
      s('CB', 74, 24),
      s('DM', 50, 42),
      s('LM', 10, 54),
      s('RM', 90, 54),
      s('CM', 32, 58),
      s('CM', 68, 58),
      s('ST', 38, 84),
      s('ST', 62, 84),
    ],
  },
  '4-2-3-1': {
    id: '4-2-3-1',
    slots: [
      s('GK', 50, 6),
      s('CB', 37, 24),
      s('CB', 63, 24),
      s('LB', 13, 30),
      s('RB', 87, 30),
      s('DM', 36, 44),
      s('DM', 64, 44),
      s('AM', 50, 64),
      s('LW', 16, 72),
      s('RW', 84, 72),
      s('ST', 50, 87),
    ],
  },
};

export const FORMATION_IDS = Object.keys(FORMATIONS) as FormationId[];

export function isEligible(player: Player, kind: SlotKind): boolean {
  return player.positions.some((p) => ELIGIBLE[kind].includes(p));
}

/**
 * Rating penalty for playing a player in a slot.
 * 0 when the slot is their main position, 1 when listed as a secondary position,
 * 3 when the slot only accepts them through a neighbouring role.
 */
export function fitPenalty(player: Player, kind: SlotKind): number {
  if (player.positions[0] === kind) return 0;
  if (player.positions.includes(kind)) return 1;
  return 3;
}

export type Line = 'GK' | 'DEF' | 'MID' | 'ATT';

export function lineOf(kind: SlotKind): Line {
  switch (kind) {
    case 'GK':
      return 'GK';
    case 'LB':
    case 'RB':
    case 'CB':
      return 'DEF';
    case 'DM':
    case 'CM':
    case 'AM':
    case 'LM':
    case 'RM':
      return 'MID';
    default:
      return 'ATT';
  }
}
