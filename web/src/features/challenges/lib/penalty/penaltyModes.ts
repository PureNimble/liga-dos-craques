import type { PenaltyMode } from '@/types/database';

/** Metadata for a Penalties mode: display info plus setup/UI rules. */
export interface PenaltyModeInfo {
  code: PenaltyMode;
  label: string;
  usesGoal: boolean;
  usesRounds: boolean;
  picksZone: boolean;
  hint: string;
}

export const PENALTY_MODES: Record<PenaltyMode, PenaltyModeInfo> = {
  pen_goals: {
    code: 'pen_goals',
    label: 'Mais golos',
    usesGoal: false,
    usesRounds: true,
    picksZone: false,
    hint: 'X rondas; ganha quem marcar mais golos.',
  },
  pen_zones: {
    code: 'pen_zones',
    label: 'Preencher zonas',
    usesGoal: true,
    usesRounds: false,
    picksZone: true,
    hint: 'Escolhe a zona e marca; ganha o 1º a preencher as 6.',
  },
  pen_target: {
    code: 'pen_target',
    label: 'Zona sorteada',
    usesGoal: true,
    usesRounds: true,
    picksZone: false,
    hint: 'O jogo sorteia a zona; ganha quem marcar mais golos.',
  },
};

/** Setup entry shown as a card; "Mais golos" picks pen_goals/pen_target via difficulty. */
export type PenaltyEntry = 'goals' | 'zones';
/** Difficulty level for the "goals" setup entry. */
export type PenaltyDifficulty = 'facil' | 'dificil';

/** Display info for a setup entry card. */
export interface PenaltyEntryInfo {
  key: PenaltyEntry;
  label: string;
  hint: string;
  hasDifficulty: boolean;
}

export const PENALTY_ENTRIES: PenaltyEntryInfo[] = [
  {
    key: 'goals',
    label: 'Mais penáltis',
    hint: 'X rondas; ganha quem marcar mais. No difícil, o jogo escolhe a zona.',
    hasDifficulty: true,
  },
  {
    key: 'zones',
    label: 'Preencher zonas',
    hint: 'Escolhe a zona e marca; ganha o 1º a preencher as 6.',
    hasDifficulty: false,
  },
];

export const PENALTY_DIFFICULTY_LABEL: Record<PenaltyDifficulty, string> = {
  facil: 'Fácil',
  dificil: 'Difícil',
};

/** DB mode from the chosen setup entry and difficulty. */
export function entryToMode(entry: PenaltyEntry, difficulty: PenaltyDifficulty): PenaltyMode {
  if (entry === 'zones') return 'pen_zones';
  return difficulty === 'dificil' ? 'pen_target' : 'pen_goals';
}

/** Validates a query-string value as a setup entry, or `null`. */
export function parsePenaltyEntry(value: string | null): PenaltyEntry | null {
  return value === 'goals' || value === 'zones' ? value : null;
}

export const ZONE_COUNT = 6;
export const ALL_ZONES = (1 << ZONE_COUNT) - 1;

export const ZONE_LABELS = [
  'Canto superior esquerdo',
  'Meio alto',
  'Canto superior direito',
  'Canto inferior esquerdo',
  'Rasteiro ao meio',
  'Canto inferior direito',
] as const;

/** Position of a zone in the 2x3 grid (row 0 = top). */
export function zoneCell(index: number): { row: number; col: number } {
  return { row: Math.floor(index / 3), col: index % 3 };
}

/** Whether zone `i` is filled in the bitmask. */
export function zoneFilled(zones: number, i: number): boolean {
  return (zones & (1 << i)) !== 0;
}

/** Number of zones already filled. */
export function filledCount(zones: number): number {
  let n = 0;
  for (let i = 0; i < ZONE_COUNT; i++) if (zoneFilled(zones, i)) n++;
  return n;
}

/** Whether all 6 zones are filled. */
export function allFilled(zones: number): boolean {
  return (zones & ALL_ZONES) === ALL_ZONES;
}

/** Validates a query-string value as a Penalties mode, or `null`. */
export function parsePenaltyMode(value: string | null): PenaltyMode | null {
  return value && value in PENALTY_MODES ? (value as PenaltyMode) : null;
}
