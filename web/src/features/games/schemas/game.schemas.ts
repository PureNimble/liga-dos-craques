import { z } from 'zod';

/** Validation schema for creating or editing a game. */
export const createGameSchema = z.object({
  scheduled_at: z.string().min(1, 'Indica a data e hora'),
  location: z
    .string()
    .trim()
    .max(200)
    .optional()
    .transform((v) => v || null),
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
});

/** Validated values for creating or editing a game. */
export type CreateGameValues = z.infer<typeof createGameSchema>;
