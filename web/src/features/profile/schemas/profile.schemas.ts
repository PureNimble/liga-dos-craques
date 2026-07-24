import { z } from 'zod';

const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' || v === undefined ? null : v), schema);

export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export const profileFormSchema = z.object({
  name: z.string().trim().min(2, 'Indica o teu nome'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(USERNAME_REGEX, 'Só minúsculas, números e _ (3-20 carateres)'),
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

/** Parsed values from the profile edit form. */
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

/** i18n key (`profile.i18n.ts`) for the preferred foot, used in the `PlayerHeader` chip. */
export const FOOT_LABEL_KEY: Record<string, string> = {
  left: 'profile.foot.left',
  right: 'profile.foot.right',
  both: 'profile.foot.both',
};

/** i18n key (`profile.i18n.ts`) for a position's name by `code`, used in the `PlayerCard` subtitle. */
export const POSITION_LABEL_KEY: Record<string, string> = {
  GK: 'profile.position.gk',
  CB: 'profile.position.cb',
  RB: 'profile.position.rb',
  LB: 'profile.position.lb',
  RWB: 'profile.position.rwb',
  LWB: 'profile.position.lwb',
  DM: 'profile.position.dm',
  CM: 'profile.position.cm',
  AM: 'profile.position.am',
  RM: 'profile.position.rm',
  LM: 'profile.position.lm',
  RW: 'profile.position.rw',
  LW: 'profile.position.lw',
  SS: 'profile.position.ss',
  ST: 'profile.position.st',
};
