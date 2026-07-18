-- =============================================================================
-- Crossbar · rondas, fim justo, morte súbita e máximo de rondas
-- =============================================================================
-- Uma "ronda" é uma volta completa (cada jogador remata uma vez). O jogo não
-- acaba no instante em que alguém completa: a ronda termina para dar a mesma
-- oportunidade a quem ainda não jogou nela. No fim:
--   • 1 jogador completou  → vence.
--   • 2+ completaram        → morte súbita entre eles (eliminação: quem falha
--                             quando outro acerta fica de fora; repete até sobrar 1).
--   • ninguém completou     → próxima ronda; se atingiu o máximo de rondas
--                             (opcional), vence quem chegou mais longe (empate →
--                             morte súbita).
-- =============================================================================

alter table public.challenge_session
  add column max_rounds int,
  add column round int not null default 1,
  add column phase text not null default 'play' check (phase in ('play', 'sudden_death'));

alter table public.session_player
  add column eliminated boolean not null default false,
  add column sd_shot boolean not null default false,
  add column sd_hit boolean not null default false;

-- Fecha o jogo: grava a vitória e apaga a sessão. NÃO exposta (só uso interno).
create or replace function public.crossbar_finish(
  p_session_id uuid,
  p_challenge_id bigint,
  p_winner uuid,
  p_spot_count int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.challenge_attempt (challenge_id, player_id, score, result, created_by)
  values (p_challenge_id, p_winner, p_spot_count, 'win', auth.uid());
  delete from public.challenge_session where id = p_session_id;
  return jsonb_build_object('status', 'finished', 'winner_id', p_winner);
end $$;

revoke all on function public.crossbar_finish(uuid, bigint, uuid, int) from public;

-- Cria a sessão já a decorrer, com máximo de rondas opcional. Devolve o id.
drop function if exists public.crossbar_create_and_start(bigint, int, uuid[]);
create or replace function public.crossbar_create_and_start(
  p_challenge_id bigint,
  p_spot_count int,
  p_player_ids uuid[],
  p_max_rounds int default null
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

  insert into public.challenge_session
    (challenge_id, spot_count, status, current_turn_index, round, phase, max_rounds, created_by)
  values
    (p_challenge_id, p_spot_count, 'active', 0, 1, 'play', p_max_rounds, auth.uid())
  returning id into v_id;

  insert into public.session_player (session_id, player_id, turn_order)
  select v_id, pid, row_number() over (order by random()) - 1
  from unnest(p_player_ids) as pid;

  return v_id;
end $$;

grant execute on function public.crossbar_create_and_start(bigint, int, uuid[], int) to authenticated;

-- -----------------------------------------------------------------------------
-- record_turn: devolve jsonb { status: active|sudden_death|finished, winner_id }.
-- (Muda o tipo de retorno text→jsonb, por isso é preciso remover primeiro.)
-- -----------------------------------------------------------------------------
drop function if exists public.crossbar_record_turn(uuid, boolean);
create or replace function public.crossbar_record_turn(p_session_id uuid, p_hit boolean)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session   public.challenge_session;
  v_player    public.session_player;
  v_n         int;
  v_turn_no   int;
  v_new_spot  int;
  v_completers int;
  v_can_catch boolean;
  v_round_end boolean;
  v_maxspot   int;
  v_leaders   int;
  v_remaining int;
  v_hits      int;
  v_misses    int;
  v_active    int;
  v_winner    uuid;
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

  select count(*) into v_n from public.session_player where session_id = p_session_id;

  -- Jogador da vez.
  if v_session.phase = 'sudden_death' then
    select * into v_player from public.session_player
    where session_id = p_session_id and not eliminated and not sd_shot
    order by turn_order limit 1;
  else
    select * into v_player from public.session_player
    where session_id = p_session_id and turn_order = v_session.current_turn_index;
  end if;
  if v_player.id is null then
    raise exception 'Jogador da vez não encontrado.';
  end if;

  -- Regista o remate.
  select coalesce(max(turn_no), 0) + 1 into v_turn_no
  from public.session_turn where session_id = p_session_id;
  insert into public.session_turn (session_id, player_id, spot_index, hit, turn_no)
  values (p_session_id, v_player.player_id, v_player.current_spot, p_hit, v_turn_no);

  -- ================= MORTE SÚBITA =================
  if v_session.phase = 'sudden_death' then
    update public.session_player set sd_shot = true, sd_hit = p_hit where id = v_player.id;

    select count(*) into v_remaining from public.session_player
    where session_id = p_session_id and not eliminated and not sd_shot;
    if v_remaining > 0 then
      return jsonb_build_object('status', 'sudden_death', 'winner_id', null);
    end if;

    -- Ronda de morte súbita completa → elimina quem falhou (se alguém acertou).
    select count(*) filter (where sd_hit), count(*) filter (where not sd_hit)
    into v_hits, v_misses
    from public.session_player where session_id = p_session_id and not eliminated;
    if v_hits >= 1 and v_misses >= 1 then
      update public.session_player set eliminated = true
      where session_id = p_session_id and not eliminated and not sd_hit;
    end if;

    select count(*) into v_active from public.session_player
    where session_id = p_session_id and not eliminated;
    if v_active = 1 then
      select player_id into v_winner from public.session_player
      where session_id = p_session_id and not eliminated;
      return public.crossbar_finish(p_session_id, v_session.challenge_id, v_winner, v_session.spot_count);
    end if;

    update public.session_player set sd_shot = false, sd_hit = false
    where session_id = p_session_id and not eliminated;
    return jsonb_build_object('status', 'sudden_death', 'winner_id', null);
  end if;

  -- ================= JOGO =================
  v_new_spot := least(v_player.current_spot + (case when p_hit then 1 else 0 end), v_session.spot_count);
  if p_hit then
    update public.session_player set current_spot = v_new_spot where id = v_player.id;
  end if;

  select count(*) into v_completers from public.session_player
  where session_id = p_session_id and current_spot >= v_session.spot_count;
  select exists (
    select 1 from public.session_player
    where session_id = p_session_id
      and turn_order > v_session.current_turn_index
      and current_spot = v_session.spot_count - 1
  ) into v_can_catch;
  v_round_end := (v_session.current_turn_index = v_n - 1);

  -- Há quem tenha completado e mais ninguém pode nesta ronda → resolver.
  if v_completers >= 1 and not v_can_catch then
    if v_completers = 1 then
      select player_id into v_winner from public.session_player
      where session_id = p_session_id and current_spot >= v_session.spot_count;
      return public.crossbar_finish(p_session_id, v_session.challenge_id, v_winner, v_session.spot_count);
    end if;
    -- empate → morte súbita entre quem completou
    update public.session_player
    set eliminated = (current_spot < v_session.spot_count), sd_shot = false, sd_hit = false
    where session_id = p_session_id;
    update public.challenge_session set phase = 'sudden_death' where id = p_session_id;
    return jsonb_build_object('status', 'sudden_death', 'winner_id', null);
  end if;

  -- Fim da ronda sem quem complete.
  if v_round_end then
    if v_session.max_rounds is not null and v_session.round >= v_session.max_rounds then
      select max(current_spot) into v_maxspot from public.session_player where session_id = p_session_id;
      select count(*) into v_leaders from public.session_player
      where session_id = p_session_id and current_spot = v_maxspot;
      if v_leaders = 1 then
        select player_id into v_winner from public.session_player
        where session_id = p_session_id and current_spot = v_maxspot;
        return public.crossbar_finish(p_session_id, v_session.challenge_id, v_winner, v_session.spot_count);
      end if;
      update public.session_player
      set eliminated = (current_spot < v_maxspot), sd_shot = false, sd_hit = false
      where session_id = p_session_id;
      update public.challenge_session set phase = 'sudden_death' where id = p_session_id;
      return jsonb_build_object('status', 'sudden_death', 'winner_id', null);
    end if;
    update public.challenge_session set round = round + 1, current_turn_index = 0 where id = p_session_id;
    return jsonb_build_object('status', 'active', 'winner_id', null);
  end if;

  -- Continua a ronda.
  update public.challenge_session set current_turn_index = v_session.current_turn_index + 1
  where id = p_session_id;
  return jsonb_build_object('status', 'active', 'winner_id', null);
end $$;

grant execute on function public.crossbar_record_turn(uuid, boolean) to authenticated;
