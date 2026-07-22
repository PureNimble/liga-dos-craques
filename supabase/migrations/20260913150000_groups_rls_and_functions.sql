-- =============================================================================
-- Grupos · aperta o RLS às tabelas de jogo/desafio/progressão e atualiza as
-- funções que as escrevem
-- =============================================================================
-- Até aqui `game`, `game_player`, `event`, `event_tag`, `xp_ledger`,
-- `user_achievement`, `challenge_attempt`, `challenge_session`, `session_player`
-- e `session_turn` eram legíveis por QUALQUER autenticado (`using (true)`) —
-- correto numa app de um grupo só, mas uma fuga real agora que há vários. Esta
-- migração fecha isso e atualiza as funções que escrevem XP/conquistas/sessões
-- para propagarem group_id. Corre DEPOIS do backfill (migração anterior), por
-- isso não há janela em que ninguém consiga ler os seus próprios dados.
-- =============================================================================

-- =============================================================================
-- RLS: GAME / GAME_PLAYER
-- =============================================================================
drop policy if exists "game_select_authenticated" on public.game;
create policy "game_select_authenticated"
  on public.game for select to authenticated
  using (public.is_group_member(group_id));

drop policy if exists "game_insert_own" on public.game;
create policy "game_insert_own"
  on public.game for insert to authenticated
  with check (created_by = auth.uid() and public.is_group_member(group_id));

drop policy if exists "gplayer_select_authenticated" on public.game_player;
create policy "gplayer_select_authenticated"
  on public.game_player for select to authenticated
  using (public.is_game_group_member(game_id));

-- O organizador continua a poder juntar convidados avulsos (que não sejam
-- membros formais do grupo) — só quem FAZ a inserção tem de pertencer ao grupo.
drop policy if exists "gplayer_insert" on public.game_player;
create policy "gplayer_insert"
  on public.game_player for insert to authenticated
  with check (
    (public.is_game_organizer(game_id) or player_id = auth.uid())
    and public.is_game_group_member(game_id)
  );

drop policy if exists "gplayer_update" on public.game_player;
create policy "gplayer_update"
  on public.game_player for update to authenticated
  using (
    (public.is_game_organizer(game_id) or player_id = auth.uid())
    and public.is_game_group_member(game_id)
  )
  with check (
    (public.is_game_organizer(game_id) or player_id = auth.uid())
    and public.is_game_group_member(game_id)
  );

drop policy if exists "gplayer_delete" on public.game_player;
create policy "gplayer_delete"
  on public.game_player for delete to authenticated
  using (
    (public.is_game_organizer(game_id) or player_id = auth.uid())
    and public.is_game_group_member(game_id)
  );

-- =============================================================================
-- RLS: EVENT / EVENT_TAG (só a leitura muda — a escrita já passa por
-- is_game_events_editable(), que chama is_game_organizer() e portanto já
-- implica que o autor pertence ao grupo do jogo).
-- =============================================================================
drop policy if exists "event_select_authenticated" on public.event;
create policy "event_select_authenticated"
  on public.event for select to authenticated
  using (public.is_game_group_member(game_id));

drop policy if exists "event_tag_select_authenticated" on public.event_tag;
create policy "event_tag_select_authenticated"
  on public.event_tag for select to authenticated
  using (
    exists (select 1 from public.event e where e.id = event_id and public.is_game_group_member(e.game_id))
  );

-- =============================================================================
-- RLS: XP_LEDGER / USER_ACHIEVEMENT / CHALLENGE_ATTEMPT / CHALLENGE_SESSION
-- =============================================================================
drop policy if exists "xp_ledger_select" on public.xp_ledger;
create policy "xp_ledger_select"
  on public.xp_ledger for select to authenticated
  using (public.is_group_member(group_id));

drop policy if exists "user_achievement_select" on public.user_achievement;
create policy "user_achievement_select"
  on public.user_achievement for select to authenticated
  using (public.is_group_member(group_id));

drop policy if exists "challenge_attempt_select" on public.challenge_attempt;
create policy "challenge_attempt_select"
  on public.challenge_attempt for select to authenticated
  using (public.is_group_member(group_id));

drop policy if exists "challenge_attempt_insert" on public.challenge_attempt;
create policy "challenge_attempt_insert"
  on public.challenge_attempt for insert to authenticated
  with check (created_by = auth.uid() and public.is_group_member(group_id));

drop policy if exists "challenge_session_select" on public.challenge_session;
create policy "challenge_session_select"
  on public.challenge_session for select to authenticated
  using (public.is_group_member(group_id));

drop policy if exists "challenge_session_insert" on public.challenge_session;
create policy "challenge_session_insert"
  on public.challenge_session for insert to authenticated
  with check (created_by = auth.uid() and public.is_group_member(group_id));

drop policy if exists "session_player_select" on public.session_player;
create policy "session_player_select"
  on public.session_player for select to authenticated
  using (public.is_session_group_member(session_id));

drop policy if exists "session_turn_select" on public.session_turn;
create policy "session_turn_select"
  on public.session_turn for select to authenticated
  using (public.is_session_group_member(session_id));

-- group_id é imutável depois de criado (tal como created_by) — não entra nos
-- GRANTs por coluna existentes de `game`, por isso não precisa de alteração.

-- =============================================================================
-- award_game_xp — cada xp_ledger passa a levar o group_id do jogo.
-- =============================================================================
create or replace function public.award_game_xp(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game public.game%rowtype;
begin
  select * into v_game from public.game where id = p_game_id;
  if v_game.id is null or v_game.xp_processed_at is not null then
    return;
  end if;
  if v_game.status not in ('finished', 'voting_open', 'closed') then
    return;
  end if;

  -- Participação.
  insert into public.xp_ledger (player_id, game_id, group_id, source_code, points, xp_rule_id)
  select gp.player_id, p_game_id, v_game.group_id, 'participation', ar.points, ar.rule_id
  from public.game_player gp, public.active_xp_rule('participation') ar
  where gp.game_id = p_game_id;

  -- Vitória.
  insert into public.xp_ledger (player_id, game_id, group_id, source_code, points, xp_rule_id)
  select gp.player_id, p_game_id, v_game.group_id, 'win', ar.points, ar.rule_id
  from public.game_player gp, public.active_xp_rule('win') ar
  where gp.game_id = p_game_id
    and (
      (gp.team = 'A' and v_game.team_a_score > v_game.team_b_score)
      or (gp.team = 'B' and v_game.team_b_score > v_game.team_a_score)
    );

  -- Golos.
  insert into public.xp_ledger (player_id, game_id, group_id, source_code, points, xp_rule_id)
  select e.player_id, p_game_id, v_game.group_id, 'goal', ar.points, ar.rule_id
  from public.event e
  join public.event_type et on et.id = e.event_type_id, public.active_xp_rule('goal') ar
  where e.game_id = p_game_id and et.code = 'goal';

  -- Assistências.
  insert into public.xp_ledger (player_id, game_id, group_id, source_code, points, xp_rule_id)
  select e.player_id, p_game_id, v_game.group_id, 'assist', ar.points, ar.rule_id
  from public.event e
  join public.event_type et on et.id = e.event_type_id, public.active_xp_rule('assist') ar
  where e.game_id = p_game_id and et.code = 'assist';

  -- MVP (apurado: melhor rating do jogo).
  insert into public.xp_ledger (player_id, game_id, group_id, source_code, points, xp_rule_id)
  select w.player_id, p_game_id, v_game.group_id, 'mvp', ar.points, ar.rule_id
  from public.v_game_award w, public.active_xp_rule('mvp') ar
  where w.game_id = p_game_id and w.category = 'mvp';

  update public.game set xp_processed_at = now() where id = p_game_id;
end $$;

-- =============================================================================
-- Conquistas — avaliação passa a ser por (jogador, grupo). Mantém o
-- comportamento "dá e tira" de 20260910100000_notifications.sql (só revoga
-- critérios que sabe avaliar, e avisa o jogador em cada remoção), agora
-- escopado ao grupo.
-- =============================================================================
drop function if exists public.evaluate_player_achievements(uuid);

create or replace function public.evaluate_player_achievements(p_player_id uuid, p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.v_player_stats%rowtype;
  a public.achievement%rowtype;
  v_max_goals int;
  v_val int;
  v_ok boolean;
  v_known boolean;
  v_removed int;
begin
  select * into s from public.v_player_stats where player_id = p_player_id and group_id = p_group_id;
  if not found then
    return;
  end if;

  -- Máximo de golos num único jogo DESTE GRUPO (para conquistas "special").
  select coalesce(max(cnt), 0) into v_max_goals
  from (
    select count(*) as cnt
    from public.event e
    join public.event_type et on et.id = e.event_type_id
    join public.game g on g.id = e.game_id
    where e.player_id = p_player_id and et.code = 'goal' and g.group_id = p_group_id
    group by e.game_id
  ) q;

  for a in select * from public.achievement where active loop
    v_ok := false;
    v_known := false;

    if a.criteria ->> 'type' = 'stat' then
      v_val := case a.criteria ->> 'metric'
        when 'games' then s.games
        when 'wins' then s.wins
        when 'draws' then s.draws
        when 'losses' then s.losses
        when 'goals' then s.goals
        when 'assists' then s.assists
        when 'saves' then s.saves
        when 'mvps' then s.mvps
        else null
      end;
      if v_val is not null and (a.criteria ->> 'gte') ~ '^\d+$' then
        v_known := true;
        v_ok := v_val >= (a.criteria ->> 'gte')::int;
      end if;

    elsif a.criteria ->> 'type' = 'special' and a.criteria ->> 'key' = 'hat_trick' then
      v_known := true;
      v_ok := v_max_goals >= 3;
    end if;

    if v_ok then
      insert into public.user_achievement (player_id, achievement_id, group_id)
      values (p_player_id, a.id, p_group_id)
      on conflict do nothing;

    elsif v_known then
      -- Deixou de cumprir: tira-se e avisa-se (só se estava mesmo desbloqueada).
      delete from public.user_achievement
       where player_id = p_player_id and achievement_id = a.id and group_id = p_group_id;
      get diagnostics v_removed = row_count;

      if v_removed > 0 then
        perform public.notify_user(
          p_player_id,
          'achievement_revoked',
          format('Conquista removida: %s', a.label),
          format(
            'Depois de uma correção nos jogos deixaste de cumprir o critério (%s). Volta a ser tua assim que o cumprires outra vez.',
            a.description
          ),
          jsonb_build_object('achievement_code', a.code, 'achievement_id', a.id)
        );
      end if;
    end if;
  end loop;
end $$;

comment on function public.evaluate_player_achievements(uuid, uuid) is 'Dá e tira conquistas conforme os critérios (por grupo); cada remoção deixa um aviso ao jogador.';

create or replace function public.evaluate_game_achievements(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
  v_group_id uuid;
begin
  select group_id into v_group_id from public.game where id = p_game_id;
  if v_group_id is null then
    return;
  end if;
  for r in select player_id from public.game_player where game_id = p_game_id loop
    perform public.evaluate_player_achievements(r.player_id, v_group_id);
  end loop;
end $$;

-- Re-liga ao trigger de fecho (mesma definição, já cria a dependência certa
-- com as novas assinaturas de award_game_xp/evaluate_game_achievements).
create or replace function public.trg_award_xp_on_close()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'closed' and (old.status is distinct from 'closed') then
    perform public.award_game_xp(new.id);
    perform public.evaluate_game_achievements(new.id);
  end if;
  return new;
end $$;

-- Backfill (admin, re-executável) — segunda passagem corre por (jogador, grupo).
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

  for r in select player_id, group_id from public.group_member loop
    perform public.evaluate_player_achievements(r.player_id, r.group_id);
    v_p := v_p + 1;
  end loop;

  games_awarded := v_g;
  players_evaluated := v_p;
  return next;
end $$;

-- =============================================================================
-- Crossbar / Penáltis — as RPCs de criação passam a exigir p_group_id (os
-- jogadores têm de pertencer a esse grupo) e as de fecho gravam group_id em
-- challenge_attempt.
-- =============================================================================
drop function if exists public.crossbar_finish(uuid, bigint, uuid, int);

create or replace function public.crossbar_finish(
  p_session_id uuid,
  p_challenge_id bigint,
  p_winner uuid,
  p_spot_count int,
  p_group_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.challenge_attempt (challenge_id, player_id, score, result, created_by, group_id)
  values (p_challenge_id, p_winner, p_spot_count, 'win', auth.uid(), p_group_id);
  delete from public.challenge_session where id = p_session_id;
  return jsonb_build_object('status', 'finished', 'winner_id', p_winner);
end $$;

revoke all on function public.crossbar_finish(uuid, bigint, uuid, int, uuid) from public;

drop function if exists public.crossbar_create_and_start(bigint, int, uuid[], int);

create or replace function public.crossbar_create_and_start(
  p_challenge_id bigint,
  p_spot_count int,
  p_player_ids uuid[],
  p_group_id uuid,
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
  if not public.is_group_member(p_group_id) then
    raise exception 'Não pertences a este grupo.';
  end if;
  if coalesce(array_length(p_player_ids, 1), 0) < 2 then
    raise exception 'São precisos pelo menos 2 jogadores.';
  end if;
  if exists (
    select 1 from unnest(p_player_ids) as pid
    where not exists (
      select 1 from public.group_member gm where gm.group_id = p_group_id and gm.player_id = pid
    )
  ) then
    raise exception 'Todos os jogadores têm de pertencer ao grupo.';
  end if;

  insert into public.challenge_session
    (challenge_id, spot_count, status, current_turn_index, round, phase, max_rounds, created_by, group_id)
  values
    (p_challenge_id, p_spot_count, 'active', 0, 1, 'play', p_max_rounds, auth.uid(), p_group_id)
  returning id into v_id;

  insert into public.session_player (session_id, player_id, turn_order)
  select v_id, pid, row_number() over (order by random()) - 1
  from unnest(p_player_ids) as pid;

  return v_id;
end $$;

grant execute on function public.crossbar_create_and_start(bigint, int, uuid[], uuid, int) to authenticated;

-- crossbar_record_turn — mesma assinatura; passa a ler group_id da própria
-- sessão e a repassá-lo ao crossbar_finish.
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
      return public.crossbar_finish(p_session_id, v_session.challenge_id, v_winner, v_session.spot_count, v_session.group_id);
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
      return public.crossbar_finish(p_session_id, v_session.challenge_id, v_winner, v_session.spot_count, v_session.group_id);
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
        return public.crossbar_finish(p_session_id, v_session.challenge_id, v_winner, v_session.spot_count, v_session.group_id);
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

-- -----------------------------------------------------------------------------
-- Penáltis — mesma ideia: create_and_start ganha p_group_id, finish grava-o.
-- -----------------------------------------------------------------------------
drop function if exists public.penalty_finish(uuid, bigint, uuid, int);

create or replace function public.penalty_finish(
  p_session_id uuid,
  p_challenge_id bigint,
  p_winner uuid,
  p_score int,
  p_group_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.challenge_attempt (challenge_id, player_id, score, result, created_by, group_id)
  values (p_challenge_id, p_winner, p_score, 'win', auth.uid(), p_group_id);
  delete from public.challenge_session where id = p_session_id;
  return jsonb_build_object('status', 'finished', 'winner_id', p_winner);
end $$;

revoke all on function public.penalty_finish(uuid, bigint, uuid, int, uuid) from public;

drop function if exists public.penalty_create_and_start(bigint, text, uuid[], int);

create or replace function public.penalty_create_and_start(
  p_challenge_id bigint,
  p_mode text,
  p_player_ids uuid[],
  p_group_id uuid,
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
  if not public.is_group_member(p_group_id) then
    raise exception 'Não pertences a este grupo.';
  end if;
  if p_mode not in ('pen_goals', 'pen_zones', 'pen_target') then
    raise exception 'Modo inválido.';
  end if;
  if coalesce(array_length(p_player_ids, 1), 0) < 2 then
    raise exception 'São precisos pelo menos 2 jogadores.';
  end if;
  if exists (
    select 1 from unnest(p_player_ids) as pid
    where not exists (
      select 1 from public.group_member gm where gm.group_id = p_group_id and gm.player_id = pid
    )
  ) then
    raise exception 'Todos os jogadores têm de pertencer ao grupo.';
  end if;

  v_rounds := case when p_mode = 'pen_zones' then null else greatest(coalesce(p_rounds, 1), 1) end;

  insert into public.challenge_session
    (challenge_id, mode, spot_count, status, current_turn_index, round, phase, max_rounds, created_by, group_id)
  values
    (p_challenge_id, p_mode, 6, 'active', 0, 1, 'play', v_rounds, auth.uid(), p_group_id)
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

grant execute on function public.penalty_create_and_start(bigint, text, uuid[], uuid, int) to authenticated;

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
      return public.penalty_finish(p_session_id, v_session.challenge_id, v_winner, v_session.spot_count, v_session.group_id);
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

    select count(*) into v_completers from public.session_player
    where session_id = p_session_id and (zones & 63) = 63;
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
        return public.penalty_finish(p_session_id, v_session.challenge_id, v_winner, 6, v_session.group_id);
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
    select max(goals) into v_maxgoals from public.session_player where session_id = p_session_id;
    select count(*) into v_leaders from public.session_player
    where session_id = p_session_id and goals = v_maxgoals;
    if v_leaders = 1 then
      select player_id into v_winner from public.session_player
      where session_id = p_session_id and goals = v_maxgoals;
      return public.penalty_finish(p_session_id, v_session.challenge_id, v_winner, v_maxgoals, v_session.group_id);
    end if;
    update public.session_player
    set eliminated = (goals < v_maxgoals), sd_shot = false, sd_hit = false, target = null
    where session_id = p_session_id;
    update public.challenge_session set phase = 'sudden_death' where id = p_session_id;
    return jsonb_build_object('status', 'sudden_death', 'winner_id', null);
  end if;

  if v_round_end then
    update public.challenge_session set round = round + 1, current_turn_index = 0 where id = p_session_id;
  else
    update public.challenge_session set current_turn_index = v_session.current_turn_index + 1
    where id = p_session_id;
  end if;

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
