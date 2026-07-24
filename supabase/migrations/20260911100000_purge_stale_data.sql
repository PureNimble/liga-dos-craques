-- =============================================================================
-- Limpeza periódica de dados sem valor histórico
-- =============================================================================
-- Há dados que só interessam enquanto são recentes: avisos já lidos, eventos de
-- tracking antigos, sessões de desafio que ficaram a meio (a app apaga-as ao
-- terminar, mas um separador fechado a meio deixa lixo) e sorteios de golo
-- icónico abandonados. Nada disto é histórico - o que é histórico (xp_ledger,
-- jogos, eventos, conquistas, réplicas) nunca é tocado aqui.
--
-- Corre pelo workflow `cleanup.yml` (semanal) com a service_role.
-- =============================================================================

create or replace function public.purge_stale_data()
returns table (
  notifications_removed int,
  app_events_removed int,
  sessions_removed int,
  spins_removed int
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_notifications int;
  v_events int;
  v_sessions int;
  v_spins int;
begin
  -- Avisos: lidos há mais de 60 dias, ou qualquer um com mais de 180.
  delete from public.notification
   where (read_at is not null and read_at < now() - interval '60 days')
      or created_at < now() - interval '180 days';
  get diagnostics v_notifications = row_count;

  -- Tracking: janela de 180 dias (o dashboard só analisa 12 meses de agregados,
  -- mas o detalhe por evento não precisa de viver para sempre).
  delete from public.app_event where created_at < now() - interval '180 days';
  get diagnostics v_events = row_count;

  -- Sessões de desafio penduradas há mais de 1 dia (efémeras por desenho).
  delete from public.challenge_session
   where status <> 'finished' and created_at < now() - interval '1 day';
  get diagnostics v_sessions = row_count;

  -- Sorteios de golo icónico abandonados (o jogador nem replicou nem desistiu).
  delete from public.iconic_goal_spin where spun_at < now() - interval '7 days';
  get diagnostics v_spins = row_count;

  return query select v_notifications, v_events, v_sessions, v_spins;
end $$;

comment on function public.purge_stale_data() is 'Limpeza semanal de dados efémeros (avisos, tracking, sessões, sorteios). Não toca em histórico.';

-- Só o servidor limpa: nem anon nem authenticated executam isto.
revoke all on function public.purge_stale_data() from public, anon, authenticated;
grant execute on function public.purge_stale_data() to service_role;
