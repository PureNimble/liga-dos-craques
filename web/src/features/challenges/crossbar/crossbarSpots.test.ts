import { describe, expect, it } from 'vitest';
import { spotCount, spotLabel, spotPos, variantFromCount } from './crossbarSpots';

describe('crossbarSpots', () => {
  it('conta as posições de cada variante', () => {
    expect(spotCount('quick')).toBe(3);
    expect(spotCount('long')).toBe(6);
  });

  it('descobre a variante pelo nº de posições', () => {
    expect(variantFromCount(3)).toBe('quick');
    expect(variantFromCount(6)).toBe('long');
  });

  it('devolve o nome da posição e null quando o jogo está completo', () => {
    expect(spotLabel('quick', 0)).toBe('Grande área');
    expect(spotLabel('quick', 2)).toBe('Meio-campo');
    expect(spotLabel('quick', 3)).toBeNull();
    expect(spotLabel('long', 5)).toBe('Outro lado do campo');
  });

  it('coloca o meio-campo ao centro do campo', () => {
    expect(spotPos(3, 2).x).toBeCloseTo(66.67);
    expect(spotPos(6, 4).x).toBeCloseTo(66.67);
  });

  it('afasta lateralmente os spots fora da área (esquerda/direita)', () => {
    expect(spotPos(6, 2).y).toBeLessThan(50);
    expect(spotPos(6, 3).y).toBeGreaterThan(50);
  });
});
