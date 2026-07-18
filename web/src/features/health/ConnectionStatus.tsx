import { useHealthCheck } from './healthHooks';
import s from './ConnectionStatus.module.css';

/**
 * Cartão que mostra o estado da ligação ao Supabase.
 * Serve de prova ponta-a-ponta da F0: frontend → Supabase RPC → resposta.
 */
export function ConnectionStatus() {
  const { data, isLoading, isError, error } = useHealthCheck();

  const state = isLoading ? 'loading' : isError || data?.status === 'error' ? 'error' : 'ok';

  const stateClass: Record<typeof state, string> = {
    loading: s.loading,
    ok: s.ok,
    error: s.error,
  };

  const label: Record<typeof state, string> = {
    loading: 'A ligar ao Supabase…',
    ok: 'Ligado ao Supabase',
    error: 'Sem ligação ao Supabase',
  };

  const detail =
    state === 'error' ? (error instanceof Error ? error.message : data?.message) : data?.message;

  return (
    <div className={`${s.card} ${stateClass[state]}`} role="status">
      <p className={s.title}>{label[state]}</p>
      {detail && <p className={s.detail}>{detail}</p>}
    </div>
  );
}
