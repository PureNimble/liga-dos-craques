import { describe, it, expect } from 'vitest';
import { createGroupSchema, joinGroupSchema } from './group.schemas';

describe('createGroupSchema', () => {
  it('aceita um nome válido, sem espaços nas pontas', () => {
    const r = createGroupSchema.parse({ name: '  Amigos da bola  ' });
    expect(r.name).toBe('Amigos da bola');
  });

  it('rejeita nomes demasiado curtos', () => {
    expect(createGroupSchema.safeParse({ name: 'A' }).success).toBe(false);
  });

  it('rejeita nomes demasiado longos', () => {
    expect(createGroupSchema.safeParse({ name: 'A'.repeat(61) }).success).toBe(false);
  });
});

describe('joinGroupSchema', () => {
  it('normaliza o código para maiúsculas', () => {
    const r = joinGroupSchema.parse({ code: 'abcd1234' });
    expect(r.code).toBe('ABCD1234');
  });

  it('rejeita códigos demasiado curtos', () => {
    expect(joinGroupSchema.safeParse({ code: 'ab' }).success).toBe(false);
  });
});
