import { z } from 'zod';

/**
 * Valida as variáveis de ambiente no arranque, para falhar cedo e com uma
 * mensagem clara em vez de erros obscuros em runtime.
 */
const envSchema = z.object({
  VITE_SUPABASE_URL: z.string().url('VITE_SUPABASE_URL deve ser um URL válido'),
  VITE_SUPABASE_ANON_KEY: z.string().min(1, 'VITE_SUPABASE_ANON_KEY em falta'),
  VITE_VAPID_PUBLIC_KEY: z.string().optional(),
});

const parsed = envSchema.safeParse(import.meta.env);

if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  - ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(
    `Configuração de ambiente inválida. Copia web/.env.example para web/.env.local e preenche:\n${issues}`,
  );
}

export const env = parsed.data;
