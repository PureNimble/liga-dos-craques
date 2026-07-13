import { useHealthCheck } from './useHealthCheck';

/**
 * Cartão que mostra o estado da ligação ao Supabase.
 * Serve de prova ponta-a-ponta da F0: frontend → Supabase RPC → resposta.
 */
export function ConnectionStatus() {
  const { data, isLoading, isError, error } = useHealthCheck();

  const state = isLoading ? 'loading' : isError || data?.status === 'error' ? 'error' : 'ok';

  const styles: Record<typeof state, string> = {
    loading: 'border-navy-700 bg-navy-900 text-slate-400',
    ok: 'border-pitch-500/40 bg-pitch-500/10 text-pitch-400',
    error: 'border-red-500/40 bg-red-500/10 text-red-300',
  };

  const label: Record<typeof state, string> = {
    loading: 'A ligar ao Supabase…',
    ok: 'Ligado ao Supabase ✓',
    error: 'Sem ligação ao Supabase',
  };

  const detail =
    state === 'error' ? (error instanceof Error ? error.message : data?.message) : data?.message;

  return (
    <div className={`rounded-xl border p-4 text-sm ${styles[state]}`} role="status">
      <p className="font-semibold">{label[state]}</p>
      {detail && <p className="mt-1 opacity-80">{detail}</p>}
    </div>
  );
}
