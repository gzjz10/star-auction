import { getPlayer } from '../data';
import type { GoalkeeperStats, OutfieldStats, Player } from '../data/types';
import type { TeamIdx } from './auction';
import { lineOf, type SlotKind } from './formations';
import { createRng, pickWeighted, type Rng } from './rng';
import type { SquadEntry } from './scoring';

export interface TeamStrength {
  attack: number;
  control: number;
  defence: number;
  keeper: number;
}

/** `plus` is stoppage time: minute 45 + plus 2 reads as 45+2. */
export type MatchEvent = { minute: number; plus?: number } & (
  | { type: 'kickoff' | 'half' | 'full' }
  | { type: 'goal'; team: TeamIdx; scorer: string; assist: string | null; score: [number, number] }
  | { type: 'save'; team: TeamIdx; shooter: string; keeper: string }
  | { type: 'miss'; team: TeamIdx; shooter: string }
  | { type: 'yellow'; team: TeamIdx; player: string }
);

export interface MatchResult {
  events: MatchEvent[];
  score: [number, number];
  shots: [number, number];
  onTarget: [number, number];
  possession: [number, number];
  strength: [TeamStrength, TeamStrength];
  /** Total minutes including stoppage time. */
  length: number;
}

const isGk = (s: OutfieldStats | GoalkeeperStats): s is GoalkeeperStats => 'div' in s;

function out(p: Player): OutfieldStats {
  if (isGk(p.stats)) return { pac: 40, sho: 20, pas: 50, dri: 30, def: 30, phy: 60 };
  return p.stats;
}

const attackOf = (p: Player) => {
  const s = out(p);
  return 0.38 * s.sho + 0.24 * s.dri + 0.2 * s.pac + 0.18 * s.pas;
};
const controlOf = (p: Player) => {
  const s = out(p);
  return 0.45 * s.pas + 0.3 * s.dri + 0.15 * s.def + 0.1 * s.phy;
};
const defenceOf = (p: Player) => {
  const s = out(p);
  return 0.62 * s.def + 0.28 * s.phy + 0.1 * s.pac;
};

function weights(kind: SlotKind): { att: number; ctl: number; def: number } {
  if (kind === 'AM') return { att: 0.8, ctl: 1, def: 0.2 };
  if (kind === 'DM') return { att: 0.2, ctl: 0.9, def: 0.7 };
  switch (lineOf(kind)) {
    case 'ATT':
      return { att: 1, ctl: 0.35, def: 0.1 };
    case 'MID':
      return { att: 0.5, ctl: 1, def: 0.4 };
    case 'DEF':
      return { att: 0.12, ctl: 0.3, def: 1 };
    default:
      return { att: 0, ctl: 0, def: 0 };
  }
}

function weightedMean(entries: { w: number; v: number }[]): number {
  const tw = entries.reduce((s, e) => s + e.w, 0);
  return tw === 0 ? 50 : entries.reduce((s, e) => s + e.w * e.v, 0) / tw;
}

export function teamStrength(squad: SquadEntry[], chemistryPoints = 0): TeamStrength {
  const rows = squad.map((e) => ({ p: getPlayer(e.playerId), kind: e.kind }));
  const outfield = rows.filter((r) => r.kind !== 'GK');
  const gk = rows.find((r) => r.kind === 'GK');
  const bonus = chemistryPoints * 0.12;
  // A player's overall also counts, so elite players lift every line a little.
  const blend = (stat: number, p: Player) => 0.7 * stat + 0.3 * p.ovr;
  return {
    attack: weightedMean(outfield.map((r) => ({ w: weights(r.kind).att, v: blend(attackOf(r.p), r.p) }))) + bonus,
    control: weightedMean(outfield.map((r) => ({ w: weights(r.kind).ctl, v: blend(controlOf(r.p), r.p) }))) + bonus,
    defence: weightedMean(outfield.map((r) => ({ w: weights(r.kind).def, v: blend(defenceOf(r.p), r.p) }))) + bonus,
    keeper: gk ? gk.p.ovr : 50,
  };
}

const sigmoid = (x: number) => 1 / (1 + Math.exp(-x));

function shooterPick(rng: Rng, squad: SquadEntry[]): SquadEntry {
  const outfield = squad.filter((e) => e.kind !== 'GK');
  return pickWeighted(rng, outfield, (e) => {
    const w = weights(e.kind).att;
    return w * w * Math.pow(attackOf(getPlayer(e.playerId)) / 70, 3);
  });
}

function assistPick(rng: Rng, squad: SquadEntry[], scorer: string): string | null {
  if (rng() < 0.22) return null;
  const others = squad.filter((e) => e.kind !== 'GK' && e.playerId !== scorer);
  return pickWeighted(rng, others, (e) => {
    const s = out(getPlayer(e.playerId));
    return (weights(e.kind).ctl + weights(e.kind).att) * Math.pow(s.pas / 70, 3);
  }).playerId;
}

export function simulateMatch(
  squads: [SquadEntry[], SquadEntry[]],
  seed: number,
  chemistry: [number, number] = [0, 0],
): MatchResult {
  const rng = createRng(seed);
  const strength: [TeamStrength, TeamStrength] = [teamStrength(squads[0], chemistry[0]), teamStrength(squads[1], chemistry[1])];
  const keepers = squads.map((s) => s.find((e) => e.kind === 'GK')?.playerId ?? s[0].playerId);

  const c0 = Math.pow(strength[0].control, 5);
  const c1 = Math.pow(strength[1].control, 5);
  const share0 = c0 / (c0 + c1);

  const firstStoppage = 1 + Math.floor(rng() * 3);
  const secondStoppage = 2 + Math.floor(rng() * 5);
  const length = 90 + secondStoppage;

  const events: MatchEvent[] = [{ minute: 0, type: 'kickoff' }];
  const score: [number, number] = [0, 0];
  const shots: [number, number] = [0, 0];
  const onTarget: [number, number] = [0, 0];
  let possessionTicks0 = 0;
  let ticks = 0;

  const play = (minute: number, plus?: number) => {
    ticks++;
    const attacking: TeamIdx = rng() < share0 ? 0 : 1;
    if (attacking === 0) possessionTicks0++;
    const defending: TeamIdx = attacking === 0 ? 1 : 0;

    if (rng() < 0.022) {
      const squad = squads[defending].filter((e) => e.kind !== 'GK');
      const offender = pickWeighted(rng, squad, (e) => weights(e.kind).def + 0.2);
      events.push({ minute, plus, type: 'yellow', team: defending, player: offender.playerId });
    }

    if (rng() >= 0.24) return;
    const att = strength[attacking].attack;
    const def = strength[defending].defence;
    const quality = sigmoid((att - def) / 5);
    const shooter = shooterPick(rng, squads[attacking]);
    shots[attacking]++;
    if (rng() > 0.36 + 0.22 * quality) {
      events.push({ minute, plus, type: 'miss', team: attacking, shooter: shooter.playerId });
      return;
    }
    onTarget[attacking]++;
    const keeper = strength[defending].keeper;
    const goalChance = Math.min(0.62, Math.max(0.12, 0.24 + 0.3 * (quality - 0.5) - (keeper - 80) / 90));
    if (rng() < goalChance) {
      score[attacking]++;
      events.push({
        minute,
        plus,
        type: 'goal',
        team: attacking,
        scorer: shooter.playerId,
        assist: assistPick(rng, squads[attacking], shooter.playerId),
        score: [score[0], score[1]],
      });
    } else {
      events.push({ minute, plus, type: 'save', team: attacking, shooter: shooter.playerId, keeper: keepers[defending] });
    }
  };

  for (let m = 1; m <= 45 + firstStoppage; m++) play(Math.min(m, 45), m > 45 ? m - 45 : undefined);
  events.push({ minute: 45, plus: firstStoppage, type: 'half' });
  for (let m = 46; m <= length; m++) play(Math.min(m, 90), m > 90 ? m - 90 : undefined);
  events.push({ minute: 90, plus: secondStoppage, type: 'full' });

  const pos0 = Math.round((possessionTicks0 / Math.max(1, ticks)) * 100);
  return {
    events,
    score,
    shots,
    onTarget,
    possession: [pos0, 100 - pos0],
    strength,
    length,
  };
}
