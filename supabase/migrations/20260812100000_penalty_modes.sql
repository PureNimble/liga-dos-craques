-- =============================================================================
-- Penáltis · sessão ao vivo com 3 modos (baliza de 6 zonas)
-- =============================================================================
-- Reutiliza o esquema de sessão do Crossbar (challenge_session/session_player/
-- session_turn), generalizado com um discriminador `mode`. Modos:
--   • pen_goals  — X rondas; ganha quem marca mais golos (sem zonas).
--   • pen_zones  — corrida: o jogador escolhe a zona vazia; ganha o 1º a fazer as 6.
--   • pen_target — X rondas; o jogo sorteia a zona; ganha quem marca mais golos.
-- Empate nos modos por golos → morte súbita. A sessão é efémera: apagada no fim,
-- fica só o +1 no ranking (challenge_attempt). As 6 zonas são um bitmask (0..63).
-- =============================================================================

alter table public.challenge_session
  add column if not exists mode text not null default 'crossbar'
    check (mode in ('crossbar', 'pen_goals', 'pen_zones', 'pen_target'));

alter table public.session_player
  add column if not exists goals int not null default 0,
  add column if not exists zones int not null default 0,
  add column if not exists target int;

-- -----------------------------------------------------------------------------
-- penalty_finish — grava a vitória e apaga a sessão. NÃO exposta (só uso interno).
-- -----------------------------------------------------------------------------
create or replace function public.penalty_finish(
  p_session_id uuid,
  p_challenge_id bigint,
  p_winner uuid,
  p_score int
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.challenge_attempt (challenge_id, player_id, score, result, created_by)
  values (p_challenge_id, p_winner, p_score, 'win', auth.uid());
  delete from public.challenge_session where id = p_session_id;
  return jsonb_build_object('status', 'finished', 'winner_id', p_winner);
end $$;

revoke all on function public.penalty_finish(uuid, bigint, uuid, int) from public;

-- -----------------------------------------------------------------------------
-- penalty_create_and_start — cria a sessão já a decorrer, com a ordem sorteada.
-- p_rounds só se aplica aos modos por golos (pen_zones é corrida, sem limite).
-- No pen_target, sorteia já a zona-alvo do 1º rematador (turn_order 0).
-- -----------------------------------------------------------------------------
create or replace function public.penalty_create_and_start(
  p_challenge_id bigint,
  p_mode text,
  p_player_ids uuid[],
  p_rounds int default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id      uuid;
  v_rounds  int;
begin
  if auth.uid() is null then
    raise exception 'Sem sessão.';
  end if;
  if p_mode not in ('pen_goals', 'pen_zones', 'pen_target') then
    raise exception 'Modo inválido.';
  end if;
  if coalesce(array_length(p_player_ids, 1), 0) < 2 then
    raise exception 'São precisos pelo menos 2 jogadores.';
  end if;

  v_rounds := case when p_mode = 'pen_zones' then null else greatest(coalesce(p_rounds, 1), 1) end;

  insert into public.challenge_session
    (challenge_id, mode, spot_count, status, current_turn_index, round, phase, max_rounds, created_by)
  values
    (p_challenge_id, p_mode, 6, 'active', 0, 1, 'play', v_rounds, auth.uid())
  returning id into v_id;

  insert into public.session_player (session_id, player_id, turn_order)
  select v_id, pid, row_number() over (order by random()) - 1
  from unnest(p_player_ids) as pid;

  if p_mode = 'pen_target' then
    update public.session_player set target = floor(random() * 6)::int
    where session_id = v_id and turn_order = 0;
  end if;

  return v_id;
end $$;

grant execute on function public.penalty_create_and_start(bigint, text, uuid[], int) to authenticated;

-- -----------------------------------------------------------------------------
-- penalty_record_turn — regista o remate do jogador da vez e avança o jogo.
-- p_zone: zona escolhida (pen_zones) ou zona-alvo confirmada (pen_target); 0..5.
-- Devolve jsonb { status: active|sudden_death|finished, winner_id }.
-- -----------------------------------------------------------------------------
create or replace function public.penalty_record_turn(
  p_session_id uuid,
  p_hit boolean,
  p_zone int default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session    public.challenge_session;
  v_player     public.session_player;
  v_n          int;
  v_turn_no    int;
  v_zone       int;
  v_completers int;
  v_can_catch  boolean;
  v_round_end  boolean;
  v_maxgoals   int;
  v_leaders    int;
  v_remaining  int;
  v_hits       int;
  v_misses     int;
  v_active     int;
  v_winner     uuid;
  v_next       uuid;
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
  if v_session.mode not in ('pen_goals', 'pen_zones', 'pen_target') then
    raise exception 'Sessão não é de penáltis.';
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

  v_zone := coalesce(p_zone, v_player.target, 0);

  -- Regista o remate (auditável).
  select coalesce(max(turn_no), 0) + 1 into v_turn_no
  from public.session_turn where session_id = p_session_id;
  insert into public.session_turn (session_id, player_id, spot_index, hit, turn_no)
  values (p_session_id, v_player.player_id, v_zone, p_hit, v_turn_no);

  -- ================= MORTE SÚBITA (modos por golos) =================
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
      return public.penalty_finish(p_session_id, v_session.challenge_id, v_winner, v_session.spot_count);
    end if;

    update public.session_player set sd_shot = false, sd_hit = false
    where session_id = p_session_id and not eliminated;
    return jsonb_build_object('status', 'sudden_death', 'winner_id', null);
  end if;

  -- ================= PEN_ZONES (corrida: encher as 6 zonas) =================
  if v_session.mode = 'pen_zones' then
    if p_hit and p_zone is not null and p_zone between 0 and 5 then
      update public.session_player
      set zones = zones | (1 << p_zone)
      where id = v_player.id;
    end if;

    -- Quem já tem as 6 zonas (bitmask 63).
    select count(*) into v_completers from public.session_player
    where session_id = p_session_id and (zones & 63) = 63;
    -- Alguém mais à frente na ronda ainda pode completar (falta-lhe só 1 zona)?
    select exists (
      select 1 from public.session_player
      where session_id = p_session_id
        and turn_order > v_session.current_turn_index
        and (63 & ~zones) <> 0
        and ((63 & ~zones) & ((63 & ~zones) - 1)) = 0
    ) into v_can_catch;
    v_round_end := (v_session.current_turn_index = v_n - 1);

    if v_completers >= 1 and not v_can_catch then
      if v_completers = 1 then
        select player_id into v_winner from public.session_player
        where session_id = p_session_id and (zones & 63) = 63;
        return public.penalty_finish(p_session_id, v_session.challenge_id, v_winner, 6);
      end if;
      update public.session_player
      set eliminated = ((zones & 63) <> 63), sd_shot = false, sd_hit = false
      where session_id = p_session_id;
      update public.challenge_session set phase = 'sudden_death' where id = p_session_id;
      return jsonb_build_object('status', 'sudden_death', 'winner_id', null);
    end if;

    if v_round_end then
      update public.challenge_session set round = round + 1, current_turn_index = 0
      where id = p_session_id;
    else
      update public.challenge_session set current_turn_index = v_session.current_turn_index + 1
      where id = p_session_id;
    end if;
    return jsonb_build_object('status', 'active', 'winner_id', null);
  end if;

  -- ================= PEN_GOALS / PEN_TARGET (X rondas, mais golos) =================
  if p_hit then
    update public.session_player set goals = goals + 1 where id = v_player.id;
  end if;

  v_round_end := (v_session.current_turn_index = v_n - 1);

  if v_round_end and v_session.round >= coalesce(v_session.max_rounds, v_session.round) then
    -- Fim do jogo: resolve por mais golos.
    select max(goals) into v_maxgoals from public.session_player where session_id = p_session_id;
    select count(*) into v_leaders from public.session_player
    where session_id = p_session_id and goals = v_maxgoals;
    if v_leaders = 1 then
      select player_id into v_winner from public.session_player
      where session_id = p_session_id and goals = v_maxgoals;
      return public.penalty_finish(p_session_id, v_session.challenge_id, v_winner, v_maxgoals);
    end if;
    -- Empate no topo → morte súbita entre os líderes.
    update public.session_player
    set eliminated = (goals < v_maxgoals), sd_shot = false, sd_hit = false, target = null
    where session_id = p_session_id;
    update public.challenge_session set phase = 'sudden_death' where id = p_session_id;
    return jsonb_build_object('status', 'sudden_death', 'winner_id', null);
  end if;

  -- Continua o jogo: avança a vez (e a ronda, no fim dela).
  if v_round_end then
    update public.challenge_session set round = round + 1, current_turn_index = 0 where id = p_session_id;
  else
    update public.challenge_session set current_turn_index = v_session.current_turn_index + 1
    where id = p_session_id;
  end if;

  -- pen_target: sorteia a zona-alvo do próximo rematador.
  if v_session.mode = 'pen_target' then
    select sp.player_id into v_next
    from public.session_player sp
    join public.challenge_session s on s.id = sp.session_id
    where sp.session_id = p_session_id and sp.turn_order = s.current_turn_index;
    update public.session_player set target = null where session_id = p_session_id;
    update public.session_player set target = floor(random() * 6)::int
    where session_id = p_session_id and player_id = v_next;
  end if;

  return jsonb_build_object('status', 'active', 'winner_id', null);
end $$;

grant execute on function public.penalty_record_turn(uuid, boolean, int) to authenticated;
