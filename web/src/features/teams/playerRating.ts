import type { PositionCategory } from '@/types/database';

/**
 * Cálculo de rating de um jogador — módulo puro e extensível.
 * Os pesos estão centralizados para poderem ser afinados no futuro (ou até,
 * mais tarde, lidos de uma tabela de configuração) sem tocar no algoritmo.
 */
export interface RatingInput {
  games: number;
  wins: number;
  goals: number;
  assists: number;
  saves: number;
  mvps: number;
  category: PositionCategory | null;
}

export interface RatingWeights {
  base: number;
  winRate: number;
  goalsPerGame: number;
  assistsPerGame: number;
  savesPerGame: number;
  mvpPerGame: number;
  experience: number;
  experienceCap: number;
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
};

/**
 * Rating baseado em desempenho por jogo (não recompensa só quem joga muito).
 * Jogadores sem jogos ficam no valor base (neutro), para não penalizar novatos.
 */
export function computeRating(input: RatingInput, w: RatingWeights = DEFAULT_RATING_WEIGHTS): number {
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
    w.experience * experience
  );
}
