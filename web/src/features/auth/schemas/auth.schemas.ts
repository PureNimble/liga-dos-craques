import { z } from 'zod';

export const emailSchema = z.string().trim().email('Email inválido');

export const passwordSchema = z.string().min(8, 'A password deve ter pelo menos 8 caracteres');

export const USERNAME_REGEX = /^[a-z0-9_]{3,20}$/;

export const loginSchema = z.object({
  identifier: z.string().trim().min(1, 'Introduz o email ou nome de utilizador'),
  password: z.string().min(1, 'Introduz a password'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Indica o teu nome'),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(USERNAME_REGEX, 'Só minúsculas, números e _ (3-20 carateres)'),
  email: emailSchema,
  password: passwordSchema,
});
export type SignupValues = z.infer<typeof signupSchema>;

export const recoverSchema = z.object({
  email: emailSchema,
});
export type RecoverValues = z.infer<typeof recoverSchema>;

export const updatePasswordSchema = z
  .object({
    password: passwordSchema,
    confirm: z.string(),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'As passwords não coincidem',
    path: ['confirm'],
  });
export type UpdatePasswordValues = z.infer<typeof updatePasswordSchema>;
