/** Bilingual label. Arabic is the primary language of the game. */
export interface Label {
  ar: string;
  en: string;
}

/** Playing positions. A player lists every position they can play, best first. */
export type Position =
  | 'GK'
  | 'LB'
  | 'CB'
  | 'RB'
  | 'DM'
  | 'CM'
  | 'AM'
  | 'LM'
  | 'RM'
  | 'LW'
  | 'RW'
  | 'ST';

export type LeagueCode = 'EPL' | 'LIGA' | 'SA' | 'BL' | 'L1' | 'SPL' | 'EGY' | 'TSL' | 'POR' | 'MLS' | 'OTHER';

export interface League {
  code: LeagueCode;
  name: Label;
}

export interface Club {
  /** Short unique code, e.g. "RMA". */
  code: string;
  name: Label;
  league: LeagueCode;
  /** Primary and secondary kit colours as #rrggbb. Used for monogram badges. */
  colors: [string, string];
}

export interface Nation {
  /** flag-icons code: ISO 3166-1 alpha-2 lower-case, or "gb-eng" / "gb-sct" / "gb-wls" / "gb-nir". */
  code: string;
  name: Label;
}

/** Outfield face stats, 1-99. */
export interface OutfieldStats {
  pac: number;
  sho: number;
  pas: number;
  dri: number;
  def: number;
  phy: number;
}

/** Goalkeeper face stats, 1-99. */
export interface GoalkeeperStats {
  div: number;
  han: number;
  kic: number;
  ref: number;
  spd: number;
  pos: number;
}

export interface Player {
  /** Stable kebab-case slug, unique. */
  id: string;
  name: Label;
  /** Short display name for cards and pitch (surname or known-as). */
  short: Label;
  club: string;
  nation: string;
  /** Age on 1 Oct 2026. */
  age: number;
  /** All playable positions, best first. GKs list only GK. */
  positions: Position[];
  /** Overall rating 1-99 (EA FC-style scale). */
  ovr: number;
  stats: OutfieldStats | GoalkeeperStats;
  /** Market value in € millions (Transfermarkt-style, Oct 2026). */
  value: number;
}
