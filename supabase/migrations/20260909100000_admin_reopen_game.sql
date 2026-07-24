-- =============================================================================
-- Reabrir um jogo fechado (correções depois do apuramento)
-- =============================================================================
-- Fechar um jogo trancava-o para sempre: eventos bloqueados por
-- `is_game_events_editable` e apagar impedido pelo trigger. Um erro descoberto
-- depois (golo no jogador errado, resultado trocado) não tinha conserto.
--
-- `admin_reopen_game` devolve o jogo à fase de revisão ('finished'), onde o
-- organizador corrige eventos e resultado e volta a fechar por "Apurar
-- MVP/Flop" - que reatribui a XP com os dados certos.
--
-- O ledger continua append-only: a XP já atribuída não é apagada, é **estornada**
-- com movimentos simétricos (mesma fonte, pontos negativos). O total de cada
-- jogador fica correto e o histórico do que aconteceu mantém-se.
-- =============================================================================

create or replace function public.admin_reopen_game(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
begin
  if not public.is_admin() then
    raise exception 'Apenas admin';
  end if;

  select status into v_status from public.game where id = p_game_id;
  if v_status is null then
    raise exception 'Jogo inexistente';
  end if;
  if v_status not in ('closed', 'voting_open') then
    raise exception 'Só se reabrem jogos fechados';
  end if;

  -- Estorno da XP deste jogo (a soma dos movimentos passa a zero).
  insert into public.xp_ledger (player_id, game_id, source_code, points, xp_rule_id)
  select player_id, game_id, source_code, -points, xp_rule_id
  from public.xp_ledger
  where game_id = p_game_id and points <> 0;

  update public.game
     set status = 'finished',
         xp_processed_at = null,
         voting_closes_at = null
   where id = p_game_id;
end $$;

comment on function public.admin_reopen_game(uuid) is 'Admin devolve um jogo fechado à revisão; estorna a XP para ser reatribuída ao fechar.';

revoke all on function public.admin_reopen_game(uuid) from public;
grant execute on function public.admin_reopen_game(uuid) to authenticated;
