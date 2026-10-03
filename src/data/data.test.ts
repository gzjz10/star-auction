/// <reference types="node" />
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { PLAYERS, DATA_AS_OF } from './players';
import { CLUBS } from './clubs';
import { NATIONS } from './nations';
import { LEAGUES } from './leagues';
import type { GoalkeeperStats, OutfieldStats, Position } from './types';

const OUTFIELD_KEYS = ['pac', 'sho', 'pas', 'dri', 'def', 'phy'];
const GK_KEYS = ['div', 'han', 'kic', 'ref', 'spd', 'pos'];

/** Engine slot eligibility: which listed positions may fill each slot. */
const SLOT_ELIGIBILITY: Record<string, Position[]> = {
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

const countListing = (...pos: Position[]) =>
  PLAYERS.filter((p) => p.positions.some((x) => pos.includes(x))).length;

describe('player database', () => {
  it('has a data stamp and a sane size', () => {
    expect(DATA_AS_OF).toMatch(/^\d{4}-\d{2}$/);
    expect(PLAYERS.length).toBeGreaterThanOrEqual(180);
    expect(PLAYERS.length).toBeLessThanOrEqual(200);
  });

  it('has unique, kebab-case ids', () => {
    const ids = PLAYERS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const id of ids) expect(id).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
  });

  it('has unique club, nation and league codes', () => {
    expect(new Set(CLUBS.map((c) => c.code)).size).toBe(CLUBS.length);
    expect(new Set(NATIONS.map((n) => n.code)).size).toBe(NATIONS.length);
    expect(new Set(LEAGUES.map((l) => l.code)).size).toBe(LEAGUES.length);
  });

  it('resolves every club, nation and league reference', () => {
    const clubs = new Set(CLUBS.map((c) => c.code));
    const nations = new Set(NATIONS.map((n) => n.code));
    const leagues = new Set(LEAGUES.map((l) => l.code));
    for (const p of PLAYERS) {
      expect(clubs.has(p.club), `${p.id} club ${p.club}`).toBe(true);
      expect(nations.has(p.nation), `${p.id} nation ${p.nation}`).toBe(true);
    }
    for (const c of CLUBS) {
      expect(leagues.has(c.league), `${c.code} league`).toBe(true);
      for (const col of c.colors) expect(col).toMatch(/^#[0-9a-f]{6}$/i);
    }
  });

  it('has a flag-icons SVG for every nation', () => {
    const dir = path.resolve(process.cwd(), 'node_modules/flag-icons/flags/4x3');
    for (const n of NATIONS) {
      expect(fs.existsSync(path.join(dir, `${n.code}.svg`)), `flag ${n.code}`).toBe(true);
    }
  });

  it('has bilingual names everywhere', () => {
    for (const p of PLAYERS) {
      for (const l of [p.name, p.short]) {
        expect(l.ar.trim().length, p.id).toBeGreaterThan(0);
        expect(l.en.trim().length, p.id).toBeGreaterThan(0);
      }
    }
  });

  it('lists GKs only as GK and uses the right stat shape', () => {
    for (const p of PLAYERS) {
      const isGk = p.positions.includes('GK');
      if (isGk) expect(p.positions, p.id).toEqual(['GK']);
      expect(p.positions.length, p.id).toBeGreaterThan(0);
      expect(new Set(p.positions).size, p.id).toBe(p.positions.length);
      const keys = Object.keys(p.stats).sort();
      expect(keys, p.id).toEqual([...(isGk ? GK_KEYS : OUTFIELD_KEYS)].sort());
    }
  });

  it('keeps ratings, stats, ages and values in range', () => {
    for (const p of PLAYERS) {
      expect(Number.isInteger(p.ovr) && p.ovr >= 1 && p.ovr <= 99, p.id).toBe(true);
      for (const v of Object.values(p.stats as OutfieldStats | GoalkeeperStats)) {
        expect(Number.isInteger(v) && v >= 1 && v <= 99, `${p.id} stat ${v}`).toBe(true);
      }
      expect(p.value, p.id).toBeGreaterThan(0);
      if (p.value >= 20) expect(p.value % 5, `${p.id} value rounding`).toBe(0);
      else expect(Number.isInteger(p.value), p.id).toBe(true);
      expect(p.age >= 15 && p.age <= 45, p.id).toBe(true);
    }
  });

  it('keeps ovr close to a position-weighted mean of the face stats', () => {
    // Weights in stat order: outfield [pac, sho, pas, dri, def, phy]; GK [div, han, kic, ref, spd, pos].
    const W: Record<string, number[]> = {
      ST: [0.2, 0.45, 0, 0.2, 0, 0.15],
      WING: [0.25, 0.2, 0.15, 0.4, 0, 0],
      AM: [0, 0.2, 0.4, 0.4, 0, 0],
      CM: [0, 0.1, 0.4, 0.3, 0.1, 0.1],
      DM: [0, 0, 0.3, 0.05, 0.45, 0.2],
      FB: [0.25, 0, 0.15, 0.15, 0.45, 0],
      CB: [0.05, 0, 0.05, 0, 0.7, 0.2],
      GK: [0.25, 0.2, 0.05, 0.3, 0, 0.2],
    };
    const group: Partial<Record<Position, string>> = { LW: 'WING', RW: 'WING', LM: 'WING', RM: 'WING', LB: 'FB', RB: 'FB' };
    const order = (p: (typeof PLAYERS)[number]) => (p.positions[0] === 'GK' ? GK_KEYS : OUTFIELD_KEYS);
    for (const p of PLAYERS) {
      const w = W[group[p.positions[0]] ?? p.positions[0]];
      const s = p.stats as unknown as Record<string, number>;
      const mean = order(p).reduce((acc, k, i) => acc + s[k] * w[i], 0);
      expect(Math.abs(p.ovr - mean), `${p.id} ovr ${p.ovr} vs ${mean.toFixed(1)}`).toBeLessThanOrEqual(3.5);
    }
    // Goalkeepers are not sprinters, centre-backs defend, wingers are quick.
    for (const p of PLAYERS) {
      const s = p.stats as unknown as Record<string, number>;
      if (p.positions[0] === 'GK') expect(s.spd, p.id).toBeLessThan(70);
      if (p.positions[0] === 'CB') expect(s.def, p.id).toBeGreaterThanOrEqual(75);
      if (['LW', 'RW'].includes(p.positions[0])) expect(s.pac, p.id).toBeGreaterThanOrEqual(70);
    }
  });

  it('meets the depth minimum for every slot', () => {
    const minimums: Record<string, number> = {
      GK: 16, CB: 30, LB: 14, RB: 14, DM: 14, CM: 24, AM: 14, ST: 26,
    };
    // Depth is counted by listed position; LW/LM and RW/RM are counted as wing groups.
    const direct: Record<string, Position[]> = {
      GK: ['GK'], CB: ['CB'], LB: ['LB'], RB: ['RB'], DM: ['DM'], CM: ['CM'], AM: ['AM'], ST: ['ST'],
    };
    for (const [slot, min] of Object.entries(minimums)) {
      expect(countListing(...direct[slot]), `depth ${slot}`).toBeGreaterThanOrEqual(min);
    }
    expect(countListing('LW', 'LM'), 'depth LW/LM').toBeGreaterThanOrEqual(18);
    expect(countListing('RW', 'RM'), 'depth RW/RM').toBeGreaterThanOrEqual(18);
    // Every engine slot must also be fillable many times over via the eligibility map.
    for (const [slot, eligible] of Object.entries(SLOT_ELIGIBILITY)) {
      expect(countListing(...eligible), `eligible ${slot}`).toBeGreaterThanOrEqual(minimums[slot] ?? 18);
    }
  });
});
