import type { PositionCategory } from '@/types/database';

/** A player as input to the balancer. */
export interface BalancePlayer {
  id: string;
  rating: number;
  category: PositionCategory | null;
}

/** Result of balancing: each team's player ids and total rating. */
export interface BalancedTeams {
  a: string[];
  b: string[];
  ratingA: number;
  ratingB: number;
}

/** Splits players into two rating-balanced teams: goalkeepers spread first, then the rest assigned to the lighter team by descending rating. */
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

  for (const gk of goalkeepers) {
    const preferA = a.length < b.length || (a.length === b.length && sumA <= sumB);
    if (preferA && a.length < maxA) place('a', gk);
    else if (b.length < maxB) place('b', gk);
    else place('a', gk);
  }

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
