import type { PositionCategory } from '@/types/database';

/** Inputs used to compute a player's rating. */
export interface RatingInput {
  games: number;
  wins: number;
  goals: number;
  assists: number;
  saves: number;
  mvps: number;
  category: PositionCategory | null;
  strengthDelta?: number | null;
}

/** Weights applied to each factor when computing a rating. */
export interface RatingWeights {
  base: number;
  winRate: number;
  goalsPerGame: number;
  assistsPerGame: number;
  savesPerGame: number;
  mvpPerGame: number;
  experience: number;
  experienceCap: number;
  strengthDelta: number;
}

export const DEFAULT_RATING_WEIGHTS: RatingWeights = {
  base: 50,
  winRate: 20,
  goalsPerGame: 8,
  assistsPerGame: 6,
  savesPerGame: 4,
  mvpPerGame: 10,
  experience: 5,
  experienceCap: 10,
  strengthDelta: 15,
};

/** Computes a player's rating from per-game performance; players with no games get the neutral base value. */
export function computeRating(
  input: RatingInput,
  w: RatingWeights = DEFAULT_RATING_WEIGHTS,
): number {
  if (input.games <= 0) return w.base;

  const g = input.games;
  const winRate = input.wins / g;
  const experience = Math.min(g, w.experienceCap) / w.experienceCap;

  return (
    w.base +
    w.winRate * winRate +
    w.goalsPerGame * (input.goals / g) +
    w.assistsPerGame * (input.assists / g) +
    w.savesPerGame * (input.saves / g) +
    w.mvpPerGame * (input.mvps / g) +
    w.experience * experience +
    w.strengthDelta * (input.strengthDelta ?? 0)
  );
}
