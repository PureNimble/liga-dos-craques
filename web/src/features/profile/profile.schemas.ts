import { z } from 'zod';

/** Converte string vazia (inputs HTML) em null. */
const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' || v === undefined ? null : v), schema);

export const profileFormSchema = z.object({
  name: z.string().trim().min(2, 'Indica o teu nome'),
  birth_date: emptyToNull(z.string().nullable()),
  weight_kg: emptyToNull(
    z.coerce.number().positive('Valor inválido').max(399, 'Valor inválido').nullable(),
  ),
  height_cm: emptyToNull(
    z.coerce
      .number()
      .int('Usa um número inteiro')
      .positive('Valor inválido')
      .max(299, 'Valor inválido')
      .nullable(),
  ),
  gender: emptyToNull(z.enum(['male', 'female', 'other', 'prefer_not']).nullable()),
  locality: emptyToNull(z.string().trim().max(120).nullable()),
  preferred_foot: emptyToNull(z.enum(['left', 'right', 'both']).nullable()),
  main_position_id: emptyToNull(z.coerce.number().int().positive().nullable()),
  secondaryPositionIds: z.array(z.number().int().positive()).default([]),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;

export const GENDER_LABELS: Record<string, string> = {
  male: 'Masculino',
  female: 'Feminino',
  other: 'Outro',
  prefer_not: 'Prefiro não dizer',
};

export const FOOT_LABELS: Record<string, string> = {
  left: 'Esquerdo',
  right: 'Direito',
  both: 'Ambidextro',
};
