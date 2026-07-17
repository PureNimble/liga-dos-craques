import { describe, expect, it } from 'vitest';
import { listMissing, profileCompletion, type CompletableProfile } from './profileCompletion';

const vazio: CompletableProfile = {
  main_position_id: null,
  preferred_foot: null,
  weight_kg: null,
  height_cm: null,
};
const cheio: CompletableProfile = {
  main_position_id: 3,
  preferred_foot: 'right',
  weight_kg: 75,
  height_cm: 180,
};

describe('profileCompletion', () => {
  it('perfil vazio: falta tudo', () => {
    const c = profileCompletion(vazio);
    expect(c.isComplete).toBe(false);
    expect(c.missing).toHaveLength(3);
    expect(c.done).toBe(0);
    expect(c.total).toBe(3);
  });

  it('perfil cheio: não falta nada', () => {
    const c = profileCompletion(cheio);
    expect(c.isComplete).toBe(true);
    expect(c.missing).toEqual([]);
    expect(c.done).toBe(3);
    expect(c.positionMissing).toBe(false);
  });

  it('dados físicos só contam com peso e altura', () => {
    expect(profileCompletion({ ...cheio, height_cm: null }).missing).toEqual(['os dados físicos']);
    expect(profileCompletion({ ...cheio, weight_kg: null }).missing).toEqual(['os dados físicos']);
  });

  it('marca a posição à parte (é a única que o gerador de equipas usa)', () => {
    expect(profileCompletion({ ...cheio, main_position_id: null }).positionMissing).toBe(true);
    expect(profileCompletion({ ...cheio, main_position_id: null }).isComplete).toBe(false);
    expect(profileCompletion({ ...cheio, preferred_foot: null }).positionMissing).toBe(false);
  });
});

describe('listMissing', () => {
  it('enumera em português', () => {
    expect(listMissing([])).toBe('');
    expect(listMissing(['o pé preferido'])).toBe('o pé preferido');
    expect(listMissing(['a', 'b'])).toBe('a e b');
    expect(listMissing(['a', 'b', 'c'])).toBe('a, b e c');
  });
});
