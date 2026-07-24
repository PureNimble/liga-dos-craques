import { describe, expect, it } from 'vitest';
import { deviceOf, normalizePath } from './tracker';

describe('normalizePath', () => {
  it('mantém rotas simples', () => {
    expect(normalizePath('/rankings')).toBe('/rankings');
  });

  it('troca uuids por :id', () => {
    expect(normalizePath('/games/3f2504e0-4f89-11d3-9a0c-0305e82c3301')).toBe('/games/:id');
  });

  it('troca ids numéricos por :id', () => {
    expect(normalizePath('/challenges/42')).toBe('/challenges/:id');
  });

  it('normaliza a raiz e a barra final', () => {
    expect(normalizePath('/')).toBe('/');
    expect(normalizePath('/games/')).toBe('/games');
  });
});

describe('deviceOf', () => {
  it('classifica pela largura', () => {
    expect(deviceOf(390)).toBe('telemóvel');
    expect(deviceOf(800)).toBe('tablet');
    expect(deviceOf(1440)).toBe('desktop');
  });
});
