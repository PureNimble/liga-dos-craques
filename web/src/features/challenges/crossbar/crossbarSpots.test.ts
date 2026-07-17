import { describe, expect, it } from 'vitest';
import { spotCount, spotLabel, variantFromCount } from './crossbarSpots';

describe('crossbarSpots', () => {
  it('conta as posições de cada variante', () => {
    expect(spotCount('quick')).toBe(3);
    expect(spotCount('long')).toBe(5);
  });

  it('descobre a variante pelo nº de posições', () => {
    expect(variantFromCount(3)).toBe('quick');
    expect(variantFromCount(5)).toBe('long');
  });

  it('devolve o nome da posição e null quando o jogo está completo', () => {
    expect(spotLabel('quick', 0)).toBe('Marca de penálti (11m)');
    expect(spotLabel('quick', 2)).toBe('Meio-campo');
    expect(spotLabel('quick', 3)).toBeNull();
  });
});
