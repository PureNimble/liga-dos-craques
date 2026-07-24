-- =============================================================================
-- Crossbar · sessões efémeras
-- =============================================================================
-- O setup passa a ser client-side (nada é gravado antes de começar). A sessão só
-- existe na BD enquanto está a decorrer: cria-se já 'active' com a ordem sorteada,
-- e ao terminar é apagada - fica apenas o +1 no ranking (challenge_attempt).
-- =============================================================================

-- Cria a sessão já a decorrer, com os jogadores e a ordem sorteada. Devolve o id.
create or replace function public.crossbar_create_and_start(
  p_challenge_id bigint,
  p_spot_count int,
  p_player_ids uuid[]
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sem sessão.';
  end if;
  if coalesce(array_length(p_player_ids, 1), 0) < 2 then
    raise exception 'São precisos pelo menos 2 jogadores.';
  end if;

  insert into public.challenge_session (challenge_id, spot_count, status, current_turn_index, created_by)
  values (p_challenge_id, p_spot_count, 'active', 0, auth.uid())
  returning id into v_id;

  insert into public.session_player (session_id, player_id, turn_order)
  select v_id, pid, row_number() over (order by random()) - 1
  from unnest(p_player_ids) as pid;

  return v_id;
end $$;

grant execute on function public.crossbar_create_and_start(bigint, int, uuid[]) to authenticated;

-- -----------------------------------------------------------------------------
-- record_turn: ao completar todas as posições, grava a vitória e APAGA a sessão
-- (o cascade remove jogadores e turnos). Fica só o +1 no ranking.
-- -----------------------------------------------------------------------------
create or replace function public.crossbar_record_turn(p_session_id uuid, p_hit boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session   public.challenge_session;
  v_player    public.session_player;
  v_count     int;
  v_turn_no   int;
  v_new_spot  int;
begin
  select * into v_session from public.challenge_session where id = p_session_id;
  if v_session.id is null then
    raise exception 'Sessão inexistente.';
  end if;
  if v_session.created_by <> auth.uid() and not public.is_admin() then
    raise exception 'Sem permissão para gerir esta sessão.';
  end if;
  if v_session.status <> 'active' then
    raise exception 'A sessão não está a decorrer.';
  end if;

  select * into v_player
  from public.session_player
  where session_id = p_session_id and turn_order = v_session.current_turn_index;
  if v_player.id is null then
    raise exception 'Jogador da vez não encontrado.';
  end if;

  select coalesce(max(turn_no), 0) + 1 into v_turn_no
  from public.session_turn where session_id = p_session_id;

  insert into public.session_turn (session_id, player_id, spot_index, hit, turn_no)
  values (p_session_id, v_player.player_id, v_player.current_spot, p_hit, v_turn_no);

  v_new_spot := v_player.current_spot + (case when p_hit then 1 else 0 end);
  if p_hit then
    update public.session_player set current_spot = v_new_spot where id = v_player.id;
  end if;

  -- Completou todas as posições → vencedor: grava a vitória e apaga a sessão.
  if p_hit and v_new_spot >= v_session.spot_count then
    insert into public.challenge_attempt (challenge_id, player_id, score, result, created_by)
    values (v_session.challenge_id, v_player.player_id, v_session.spot_count, 'win', auth.uid());

    delete from public.challenge_session where id = p_session_id;
    return 'finished';
  end if;

  -- Passa a vez ao jogador seguinte.
  select count(*) into v_count from public.session_player where session_id = p_session_id;
  update public.challenge_session
  set current_turn_index = (v_session.current_turn_index + 1) % v_count
  where id = p_session_id;

  return 'active';
end $$;

grant execute on function public.crossbar_record_turn(uuid, boolean) to authenticated;
