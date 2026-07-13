import { createClient } from '@supabase/supabase-js';
import { env } from './env';
import type { Database } from '@/types/database';

/**
 * Cliente Supabase tipado, partilhado por toda a app.
 * A chave anon é pública por natureza — a segurança é imposta por Row Level
 * Security (RLS) na base de dados, nunca por esconder esta chave.
 */
export const supabase = createClient<Database>(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
