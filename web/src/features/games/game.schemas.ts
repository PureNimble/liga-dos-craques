import { z } from 'zod';

export const createGameSchema = z.object({
  scheduled_at: z.string().min(1, 'Indica a data e hora'),
  location: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => v || null),
  // O formato define quantos jogam (tamanho do campo). Sem limite de inscrições:
  // quem vier a mais fica suplente.
  format_id: z.coerce.number().int().positive('Escolhe o formato'),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => v || null),
});

export type CreateGameValues = z.infer<typeof createGameSchema>;
