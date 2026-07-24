import type { PositionCategory } from '@/types/database';
import type { PlayerStats } from '@/features/stats/hooks/statsHooks';
import { computeRating } from '@/features/teams/lib/playerRating';

export interface CardAttribute {
  key: string;
  label: string;
  value: number;
}

const clamp = (n: number) => Math.max(30, Math.min(99, Math.round(n)));

/** Código curto da posição para o cartão (estilo FIFA). */
export function positionShort(category: PositionCategory | null | undefined): string {
  switch (category) {
    case 'GK':
      return 'GR';
    case 'DEF':
      return 'DEF';
    case 'MID':
      return 'MED';
    case 'FWD':
      return 'AVA';
    default:
      return '—';
  }
}

/** Overall (0–99) a partir do rating existente (que ronda 50–100). */
export function overallOf(stats: PlayerStats, category: PositionCategory | null): number {
  return clamp(
    computeRating({
      games: stats.games,
      wins: stats.wins,
      goals: stats.goals,
      assists: stats.assists,
      saves: stats.saves,
      mvps: stats.mvps,
      category,
      strengthDelta: stats.strength_delta,
    }),
  );
}

/**
 * Seis atributos "à FIFA" derivados das estatísticas. Jogadores sem jogos
 * ficam num valor base neutro (não penaliza novatos).
 */
export function cardAttributes(stats: PlayerStats): CardAttribute[] {
  const g = Math.max(1, stats.games);
  const base = stats.games === 0 ? 55 : 40;
  const winRate = stats.games ? stats.wins / stats.games : 0;
  return [
    { key: 'fin', label: 'FIN', value: clamp(base + (stats.goals / g) * 45) },
    { key: 'ass', label: 'ASS', value: clamp(base + (stats.assists / g) * 45) },
    { key: 'def', label: 'DEF', value: clamp(base + (stats.saves / g) * 35) },
    { key: 'vit', label: 'VIT', value: clamp(base + winRate * 55) },
    { key: 'exp', label: 'EXP', value: clamp(base + (Math.min(stats.games, 20) / 20) * 55) },
    { key: 'mvp', label: 'MVP', value: clamp(base + (stats.mvps / g) * 60) },
  ];
}
