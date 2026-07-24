import { describe, it, expect } from 'vitest';
import { balanceTeams, type BalancePlayer } from './teamBalancer';

function p(id: string, rating: number, category: BalancePlayer['category'] = null): BalancePlayer {
  return { id, rating, category };
}

describe('balanceTeams', () => {
  it('divide os jogadores em números equilibrados (ceil/floor)', () => {
    const players = [p('1', 90), p('2', 80), p('3', 70), p('4', 60), p('5', 50)];
    const { a, b } = balanceTeams(players);
    expect(a.length).toBe(3);
    expect(b.length).toBe(2);
    expect([...a, ...b].sort()).toEqual(['1', '2', '3', '4', '5']);
  });

  it('minimiza a diferença de rating entre equipas', () => {
    const players = [p('1', 100), p('2', 90), p('3', 80), p('4', 70)];
    const { ratingA, ratingB } = balanceTeams(players);
    expect(Math.abs(ratingA - ratingB)).toBeLessThanOrEqual(10);
  });

  it('distribui os guarda-redes por equipas diferentes', () => {
    const players = [
      p('gk1', 60, 'GK'),
      p('gk2', 55, 'GK'),
      p('o1', 80, 'FWD'),
      p('o2', 70, 'MID'),
    ];
    const { a, b } = balanceTeams(players);
    const gkInA = a.includes('gk1') || a.includes('gk2');
    const gkInB = b.includes('gk1') || b.includes('gk2');
    expect(gkInA && gkInB).toBe(true);
  });

  it('lida com lista vazia', () => {
    expect(balanceTeams([])).toEqual({ a: [], b: [], ratingA: 0, ratingB: 0 });
  });
});
