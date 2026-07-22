import { describe, it, expect } from 'vitest';
import { profileFormSchema } from './profile.schemas';

describe('profileFormSchema', () => {
  it('exige um nome com pelo menos 2 caracteres', () => {
    expect(profileFormSchema.safeParse({ name: 'A', secondaryPositionIds: [] }).success).toBe(
      false,
    );
  });

  it('converte campos vazios em null', () => {
    const r = profileFormSchema.parse({
      name: 'Vasco',
      birth_date: '',
      weight_kg: '',
      height_cm: '',
      gender: '',
      locality: '',
      preferred_foot: '',
      main_position_id: '',
      secondaryPositionIds: [],
    });
    expect(r.weight_kg).toBeNull();
    expect(r.main_position_id).toBeNull();
    expect(r.gender).toBeNull();
  });

  it('coage números e valida limites físicos', () => {
    const ok = profileFormSchema.parse({
      name: 'Vasco',
      weight_kg: '74.5',
      height_cm: '180',
      main_position_id: '5',
      secondaryPositionIds: [],
    });
    expect(ok.weight_kg).toBe(74.5);
    expect(ok.height_cm).toBe(180);
    expect(ok.main_position_id).toBe(5);

    expect(
      profileFormSchema.safeParse({ name: 'Vasco', weight_kg: '500', secondaryPositionIds: [] })
        .success,
    ).toBe(false);
  });
});
