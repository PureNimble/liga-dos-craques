import { z } from 'zod';

export const createGroupSchema = z.object({
  name: z.string().trim().min(2, 'Indica um nome').max(60, 'Nome demasiado longo'),
});

export const joinGroupSchema = z.object({
  code: z
    .string()
    .trim()
    .min(4, 'Código inválido')
    .max(12, 'Código inválido')
    .transform((v) => v.toUpperCase()),
});

export type CreateGroupValues = z.infer<typeof createGroupSchema>;
export type JoinGroupValues = z.infer<typeof joinGroupSchema>;
