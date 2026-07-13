import type { PositionCategory } from '@/types/database';

/**
 * Balanceamento de equipas — módulo puro e testável.
 *
 * Estratégia (extensível):
 *   1. Guarda-redes primeiro: distribuídos alternadamente para tentar 1 por equipa.
 *   2. Restantes por rating decrescente, sempre para a equipa com menor soma
 *      de rating (que ainda tenha lugar) → minimiza a diferença global.
 *
 * Mantém as equipas equilibradas em NÚMERO (ceil/floor) e em RATING.
 */
export interface BalancePlayer {
  id: string;
  rating: number;
  category: PositionCategory | null;
}

export interface BalancedTeams {
  a: string[];
  b: string[];
  ratingA: number;
  ratingB: number;
}

export function balanceTeams(players: BalancePlayer[]): BalancedTeams {
  const maxA = Math.ceil(players.length / 2);
  const maxB = players.length - maxA;

  const a: string[] = [];
  const b: string[] = [];
  let sumA = 0;
  let sumB = 0;

  const place = (team: 'a' | 'b', p: BalancePlayer) => {
    if (team === 'a') {
      a.push(p.id);
      sumA += p.rating;
    } else {
      b.push(p.id);
      sumB += p.rating;
    }
  };

  const byRatingDesc = (x: BalancePlayer, y: BalancePlayer) => y.rating - x.rating;
  const goalkeepers = players.filter((p) => p.category === 'GK').sort(byRatingDesc);
  const outfield = players.filter((p) => p.category !== 'GK').sort(byRatingDesc);

  // 1) Guarda-redes: um para cada lado, preferindo a equipa mais leve/vazia.
  for (const gk of goalkeepers) {
    const preferA = a.length < b.length || (a.length === b.length && sumA <= sumB);
    if (preferA && a.length < maxA) place('a', gk);
    else if (b.length < maxB) place('b', gk);
    else place('a', gk);
  }

  // 2) Restantes: sempre para a equipa mais leve com lugar disponível.
  for (const p of outfield) {
    const canA = a.length < maxA;
    const canB = b.length < maxB;
    let team: 'a' | 'b';
    if (canA && canB) team = sumA <= sumB ? 'a' : 'b';
    else team = canA ? 'a' : 'b';
    place(team, p);
  }

  return { a, b, ratingA: sumA, ratingB: sumB };
}
