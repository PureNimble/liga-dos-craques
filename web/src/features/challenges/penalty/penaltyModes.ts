import type { PenaltyMode } from '@/types/database';

/** Metadados de cada modo de Penáltis (só display + regras de setup/UI). */
export interface PenaltyModeInfo {
  code: PenaltyMode;
  label: string;
  icon: string;
  /** Mostra a baliza de 6 zonas (pen_zones/pen_target). */
  usesGoal: boolean;
  /** Pede o nº de rondas no setup (modos por golos). */
  usesRounds: boolean;
  /** O jogador escolhe a zona vazia antes de rematar (pen_zones). */
  picksZone: boolean;
  hint: string;
}

export const PENALTY_MODES: Record<PenaltyMode, PenaltyModeInfo> = {
  pen_goals: {
    code: 'pen_goals',
    label: 'Mais golos',
    icon: '⚽',
    usesGoal: false,
    usesRounds: true,
    picksZone: false,
    hint: 'X rondas; ganha quem marcar mais golos.',
  },
  pen_zones: {
    code: 'pen_zones',
    label: 'Preencher zonas',
    icon: '🎯',
    usesGoal: true,
    usesRounds: false,
    picksZone: true,
    hint: 'Escolhe a zona e marca; ganha o 1º a preencher as 6.',
  },
  pen_target: {
    code: 'pen_target',
    label: 'Zona sorteada',
    icon: '🎲',
    usesGoal: true,
    usesRounds: true,
    picksZone: false,
    hint: 'O jogo sorteia a zona; ganha quem marcar mais golos.',
  },
};

/**
 * Entradas do setup (o que aparece nos cartões). "Mais golos" é uma só entrada:
 * a dificuldade (fácil/difícil) escolhe o modo DB — fácil remata para onde quer
 * (pen_goals), difícil tem de acertar na zona sorteada (pen_target).
 */
export type PenaltyEntry = 'goals' | 'zones';
export type PenaltyDifficulty = 'facil' | 'dificil';

export interface PenaltyEntryInfo {
  key: PenaltyEntry;
  label: string;
  icon: string;
  hint: string;
  /** A entrada tem escolha de dificuldade fácil/difícil (só a de golos). */
  hasDifficulty: boolean;
}

export const PENALTY_ENTRIES: PenaltyEntryInfo[] = [
  {
    key: 'goals',
    label: 'Mais penáltis',
    icon: '⚽',
    hint: 'X rondas; ganha quem marcar mais. No difícil, o jogo escolhe a zona.',
    hasDifficulty: true,
  },
  {
    key: 'zones',
    label: 'Preencher zonas',
    icon: '🎯',
    hint: 'Escolhe a zona e marca; ganha o 1º a preencher as 6.',
    hasDifficulty: false,
  },
];

export const PENALTY_DIFFICULTY_LABEL: Record<PenaltyDifficulty, string> = {
  facil: 'Fácil',
  dificil: 'Difícil',
};

/** Modo DB a partir da entrada + dificuldade escolhidas no setup. */
export function entryToMode(entry: PenaltyEntry, difficulty: PenaltyDifficulty): PenaltyMode {
  if (entry === 'zones') return 'pen_zones';
  return difficulty === 'dificil' ? 'pen_target' : 'pen_goals';
}

export function parsePenaltyEntry(value: string | null): PenaltyEntry | null {
  return value === 'goals' || value === 'zones' ? value : null;
}

/** Nº total de zonas da baliza (grelha 2×3) e bitmask com todas preenchidas. */
export const ZONE_COUNT = 6;
export const ALL_ZONES = (1 << ZONE_COUNT) - 1; // 63

/** Nomes das 6 zonas, por índice (0..5): linha de cima 0-2, linha de baixo 3-5. */
export const ZONE_LABELS = [
  'Canto superior esquerdo',
  'Meio alto',
  'Canto superior direito',
  'Canto inferior esquerdo',
  'Rasteiro ao meio',
  'Canto inferior direito',
] as const;

/** Posição de uma zona na grelha 2×3 (row 0 = topo). */
export function zoneCell(index: number): { row: number; col: number } {
  return { row: Math.floor(index / 3), col: index % 3 };
}

/** A zona `i` está preenchida no bitmask? */
export function zoneFilled(zones: number, i: number): boolean {
  return (zones & (1 << i)) !== 0;
}

/** Quantas zonas já estão preenchidas. */
export function filledCount(zones: number): number {
  let n = 0;
  for (let i = 0; i < ZONE_COUNT; i++) if (zoneFilled(zones, i)) n++;
  return n;
}

/** Todas as 6 zonas preenchidas? */
export function allFilled(zones: number): boolean {
  return (zones & ALL_ZONES) === ALL_ZONES;
}

/** Valida um valor de query string como modo de Penáltis (ou `null`). */
export function parsePenaltyMode(value: string | null): PenaltyMode | null {
  return value && value in PENALTY_MODES ? (value as PenaltyMode) : null;
}
