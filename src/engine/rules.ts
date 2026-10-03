/**
 * Every number the game plays by. The "How to play" page is generated from these
 * constants, so the rules text can never drift from the engine.
 */
export const RULES = {
  /** Starting budget per corner, € millions. */
  budget: 450,
  /** Opening price is this share of market value… */
  openingShare: 0.15,
  /** …rounded to 5 and clamped to this range (€M). */
  openingMin: 5,
  openingMax: 40,
  /** Minimum raise is 10 for lots valued at or above this, otherwise 5 (€M). */
  bigLotValue: 60,
  smallStep: 5,
  bigStep: 10,
  /** Raise buttons offer these multiples of the minimum raise. */
  raiseMultiples: [1, 2, 5] as const,
  /** Allowed turn timers in seconds (0 = off). */
  timerOptions: [0, 10, 20, 30] as const,
  defaultTimer: 20,
  /** Chemistry: points per same-club pair and per same-nation pair, with caps. */
  clubPairPoints: 2,
  clubCap: 10,
  nationPairPoints: 1,
  nationCap: 6,
  /** League chemistry: points for every full group of this many players from one league. */
  leagueGroup: 3,
  leaguePoints: 1,
  leagueCap: 4,
  /** Leftover cash: one point per this many €M left. */
  cashPerPoint: 20,
} as const;

export function roundTo5(n: number): number {
  return Math.round(n / 5) * 5;
}

export function openingPrice(value: number): number {
  return Math.min(RULES.openingMax, Math.max(RULES.openingMin, roundTo5(value * RULES.openingShare)));
}

export function minRaise(value: number): number {
  return value >= RULES.bigLotValue ? RULES.bigStep : RULES.smallStep;
}
