import { z } from 'zod';

/** Validation schema for creating or editing a game. */
export const createGameSchema = z.object({
  scheduled_at: z.string().min(1, 'Indica a data e hora'),
  location: z.string().trim().min(1, 'Indica o local do jogo').max(200),
  place_id: z
    .string()
    .uuid()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
  format_id: z.coerce.number().int().positive('Escolhe o formato'),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((v) => v || null),
  opponent_name: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => v || null),
  is_home: z.enum(['', 'true', 'false']).optional(),
});

/** Validated values for creating or editing a game. */
export type CreateGameValues = z.infer<typeof createGameSchema>;
