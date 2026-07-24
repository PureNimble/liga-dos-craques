import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';

/** Outcome of a health check call. */
export type HealthStatus = 'ok' | 'error';

/** Result of checking connectivity to the backend. */
export interface HealthResult {
  status: HealthStatus;
  message: string;
}

async function checkHealth(): Promise<HealthResult> {
  const { data, error } = await supabase.rpc('ping');
  if (error) {
    return { status: 'error', message: error.message };
  }
  return { status: 'ok', message: data ?? 'pong' };
}

/** Checks frontend-to-Supabase connectivity via the lightweight `ping()` RPC. */
export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: checkHealth,
    staleTime: 30_000,
  });
}
