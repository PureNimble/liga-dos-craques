import { z } from 'zod';

export const emailSchema = z.string().trim().email('Email inválido');

export const passwordSchema = z.string().min(8, 'A password deve ter pelo menos 8 caracteres');

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Introduz a password'),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().trim().min(2, 'Indica o teu nome'),
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
