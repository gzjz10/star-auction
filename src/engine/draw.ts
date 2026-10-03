import type { Player } from '../data/types';
import { isEligible, type SlotKind } from './formations';
import { pickWeighted, type Rng } from './rng';

export interface DrawnLot {
  openId: string;
  hiddenId: string;
}

/**
 * Draw the two cards for one round, strictly by position.
 * The open card leans towards the stronger part of the pool. The hidden card leans
 * towards the weaker part, but any player can turn up, so it can be a gem.
 */
export function drawLot(pool: readonly Player[], kind: SlotKind, used: ReadonlySet<string>, rng: Rng): DrawnLot {
  const eligible = pool.filter((p) => !used.has(p.id) && isEligible(p, kind));
  if (eligible.length < 2) {
    throw new Error(`Not enough ${kind} players left to draw a lot`);
  }
  const sorted = [...eligible].sort((a, b) => b.ovr - a.ovr);
  const rank = new Map(sorted.map((p, i) => [p.id, i / Math.max(1, sorted.length - 1)]));

  // Natural-position players are preferred so a CB slot mostly draws real centre-backs.
  const natural = (p: Player) => (p.positions[0] === kind ? 1 : 0.45);

  const open = pickWeighted(rng, sorted, (p) => {
    const r = rank.get(p.id)!; // 0 = best
    return natural(p) * (r < 0.55 ? 3 : 0.6);
  });

  const rest = sorted.filter((p) => p.id !== open.id);
  const hidden = pickWeighted(rng, rest, (p) => {
    const r = rank.get(p.id)!;
    return natural(p) * (r >= 0.4 ? 2.2 : 0.7);
  });

  return { openId: open.id, hiddenId: hidden.id };
}
