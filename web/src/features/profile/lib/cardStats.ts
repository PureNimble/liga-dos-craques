import type { PositionCategory } from '@/types/database';
import type { PlayerStats } from '@/features/stats/hooks/statsHooks';
import { computeRating } from '@/features/teams/lib/playerRating';

/** A single FIFA-style attribute shown on the player card. */
export interface CardAttribute {
  key: string;
  label: string;
  value: number;
}

const clamp = (n: number) => Math.max(30, Math.min(99, Math.round(n)));

/** Short position code for the card (FIFA-style). */
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

/** Overall (0-99) derived from the existing rating (which ranges roughly 50-100). */
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

/** Six FIFA-style attributes derived from player stats; newcomers get a neutral base value. */
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
