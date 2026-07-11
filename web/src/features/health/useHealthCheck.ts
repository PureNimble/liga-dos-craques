import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type HealthStatus = 'ok' | 'error';

export interface HealthResult {
  status: HealthStatus;
  message: string;
}

/**
 * Prova de vida da ligação frontend ↔ Supabase (F0).
 * Chama a função RPC `ping()` — leve e sem depender de tabelas de domínio.
 */
async function checkHealth(): Promise<HealthResult> {
  const { data, error } = await supabase.rpc('ping');
  if (error) {
    return { status: 'error', message: error.message };
  }
  return { status: 'ok', message: data ?? 'pong' };
}

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    staleTime: 30_000,
  });
}
