import { describe, it, expect } from 'vitest';
import { computeRating } from './playerRating';

describe('computeRating', () => {
  it('devolve o valor base para jogadores sem jogos', () => {
    expect(
      computeRating({ games: 0, wins: 0, goals: 0, assists: 0, saves: 0, mvps: 0, category: null }),
    ).toBe(50);
  });

  it('calcula o rating ponderado por desempenho por jogo', () => {
    // base 50 + win(20*0.5) + goals(8*1) + assists(6*0.5) + mvp(10*0.2) + exp(5*1) = 78
    const r = computeRating({
      games: 10,
      wins: 5,
      goals: 10,
      assists: 5,
      saves: 0,
      mvps: 2,
      category: null,
    });
    expect(r).toBe(78);
  });

  it('respeita pesos personalizados', () => {
    const r = computeRating(
      { games: 1, wins: 1, goals: 0, assists: 0, saves: 0, mvps: 0, category: null },
      {
        base: 0,
        winRate: 100,
        goalsPerGame: 0,
        assistsPerGame: 0,
        savesPerGame: 0,
        mvpPerGame: 0,
        experience: 0,
        experienceCap: 10,
        strengthDelta: 0,
      },
    );
    expect(r).toBe(100);
  });

  it('sobe/desce com o desvio de força (bater equipas mais fortes vale mais)', () => {
    const base = { games: 10, wins: 5, goals: 0, assists: 0, saves: 0, mvps: 0, category: null };
    const neutral = computeRating(base);
    // Peso 15 × strengthDelta.
    expect(computeRating({ ...base, strengthDelta: 0.4 })).toBeCloseTo(neutral + 6);
    expect(computeRating({ ...base, strengthDelta: -0.4 })).toBeCloseTo(neutral - 6);
  });

  it('ignora o desvio de força quando não é fornecido (compatível)', () => {
    const base = { games: 10, wins: 5, goals: 0, assists: 0, saves: 0, mvps: 0, category: null };
    expect(computeRating(base)).toBe(computeRating({ ...base, strengthDelta: null }));
  });
});
