import { describe, it, expect } from 'vitest';
import { createGameSchema } from './game.schemas';

describe('createGameSchema', () => {
  const base = { scheduled_at: '2026-07-11T20:00', format_id: 5, location: 'Campo Municipal' };

  it('aceita um jogo válido e converte notas vazias em null', () => {
    const r = createGameSchema.parse({ ...base, notes: '' });
    expect(r.location).toBe('Campo Municipal');
    expect(r.notes).toBeNull();
    expect(r.format_id).toBe(5);
  });

  it('rejeita data em falta', () => {
    expect(createGameSchema.safeParse({ ...base, scheduled_at: '' }).success).toBe(false);
  });

  it('rejeita localização em falta', () => {
    expect(createGameSchema.safeParse({ ...base, location: '' }).success).toBe(false);
  });

  it('rejeita formato em falta', () => {
    expect(createGameSchema.safeParse({ scheduled_at: '2026-07-11T20:00' }).success).toBe(false);
  });

  it('coage strings numéricas (inputs HTML)', () => {
    const r = createGameSchema.parse({ ...base, format_id: '7' });
    expect(r.format_id).toBe(7);
  });
});
