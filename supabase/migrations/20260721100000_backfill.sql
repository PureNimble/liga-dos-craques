-- =============================================================================
-- P0.3 · Backfill de progressão (XP + conquistas)
-- =============================================================================
-- XP e conquistas só passaram a ser atribuídos a partir das F7/F9. Esta migração
-- recupera o histórico já existente e deixa uma RPC (admin) para re-correr.
-- =============================================================================

-- RPC re-executável (protegida por admin) — útil após criar novas conquistas.
create or replace function public.backfill_progression()
returns table (games_awarded int, players_evaluated int)
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_g int := 0;
  v_p int := 0;
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem correr o backfill.';
  end if;

  for r in select id from public.game where status = 'closed' and xp_processed_at is null loop
    perform public.award_game_xp(r.id);
    v_g := v_g + 1;
  end loop;

  for r in select id from public.profile loop
    perform public.evaluate_player_achievements(r.id);
    v_p := v_p + 1;
  end loop;

  games_awarded := v_g;
  players_evaluated := v_p;
  return next;
end $$;

grant execute on function public.backfill_progression() to authenticated;

-- Backfill imediato dos dados existentes (corre como owner no deploy, sem guard).
do $do$
declare
  r record;
begin
  for r in select id from public.game where status = 'closed' and xp_processed_at is null loop
    perform public.award_game_xp(r.id);
  end loop;
  for r in select id from public.profile loop
    perform public.evaluate_player_achievements(r.id);
  end loop;
end $do$;
