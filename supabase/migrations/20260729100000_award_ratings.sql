-- =============================================================================
-- MVP / Flop por RATING calculado (a app decide; votação só desempata)
-- =============================================================================
-- Cada jogador recebe uma avaliação por jogo (base 6.0, impactada pelos eventos
-- e pelo resultado). O melhor rating é MVP, o pior é Flop — escolhidos pela app.
-- Só quando há EMPATE no topo (MVP) ou no fundo (Flop) é aberta uma votação,
-- e apenas entre os empatados dessa categoria. MVP nunca é igual ao Flop e não
-- se pode votar na mesma pessoa para as duas. No perfil faz-se a média.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Rating por jogador por jogo (base 6.0, limitado a 0–10).
--    +1.0 golo · +0.8 penálti/livre convertido · +0.5 assist · +0.2 defesa
--    +0.3 vitória · −0.3 derrota · −0.5 penálti falhado · −1.0 autogolo
-- -----------------------------------------------------------------------------
create or replace view public.v_game_player_rating
with (security_invoker = on) as
with completed as (
  select id, team_a_score, team_b_score
  from public.game
  where status in ('finished', 'voting_open', 'closed')
),
ev as (
  select
    e.game_id,
    e.player_id,
    count(*) filter (where et.code = 'goal')                             as goals,
    count(*) filter (where et.code in ('penalty_scored', 'freekick_scored')) as set_pieces,
    count(*) filter (where et.code = 'assist')                          as assists,
    count(*) filter (where et.code = 'save')                            as saves,
    count(*) filter (where et.code = 'penalty_missed')                  as pen_missed,
    count(*) filter (where et.code = 'own_goal')                        as own_goals
  from public.event e
  join public.event_type et on et.id = e.event_type_id
  join completed c on c.id = e.game_id
  group by e.game_id, e.player_id
)
select
  gp.game_id,
  gp.player_id,
  greatest(0, least(10, round((
    6.0
    + 1.0 * coalesce(ev.goals, 0)
    + 0.8 * coalesce(ev.set_pieces, 0)
    + 0.5 * coalesce(ev.assists, 0)
    + 0.2 * coalesce(ev.saves, 0)
    + 0.3 * (case when (gp.team = 'A' and c.team_a_score > c.team_b_score)
                    or (gp.team = 'B' and c.team_b_score > c.team_a_score) then 1 else 0 end)
    - 0.3 * (case when (gp.team = 'A' and c.team_a_score < c.team_b_score)
                    or (gp.team = 'B' and c.team_b_score < c.team_a_score) then 1 else 0 end)
    - 0.5 * coalesce(ev.pen_missed, 0)
    - 1.0 * coalesce(ev.own_goals, 0)
  )::numeric, 1)))::numeric(4, 1) as rating
from public.game_player gp
join completed c on c.id = gp.game_id
left join ev on ev.game_id = gp.game_id and ev.player_id = gp.player_id;

comment on view public.v_game_player_rating is
  'Avaliação (0–10, base 6.0) de cada jogador por jogo, a partir dos eventos e do resultado.';

grant select on public.v_game_player_rating to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Candidatos a MVP/Flop: os empatados no topo (MVP) e no fundo (Flop).
--    Só para jogos com ≥2 jogadores avaliados. Se houver 1 candidato, é
--    automático; se houver vários, abre votação entre esses.
-- -----------------------------------------------------------------------------
create or replace view public.v_game_award_candidate
with (security_invoker = on) as
with r as (
  select
    game_id, player_id, rating,
    count(*) over (partition by game_id) as n,
    max(rating) over (partition by game_id) as mx,
    min(rating) over (partition by game_id) as mn
  from public.v_game_player_rating
)
select game_id, 'mvp'::text as category, player_id, rating
from r where n >= 2 and rating = mx
union all
select game_id, 'flop'::text as category, player_id, rating
from r where n >= 2 and rating = mn;

comment on view public.v_game_award_candidate is
  'Candidatos a MVP (topo) e Flop (fundo) por jogo; 1 candidato = automático, vários = votação.';

grant select on public.v_game_award_candidate to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Apuramento resolvido: automático (candidato único) ou por votação (empate
--    desfeito pelos votos, só entre candidatos e após o fecho da janela).
--    O Flop nunca coincide com o MVP.
-- -----------------------------------------------------------------------------
create or replace view public.v_game_award
with (security_invoker = on) as
with cand as (
  select
    game_id, category, player_id,
    count(*) over (partition by game_id, category) as ncand
  from public.v_game_award_candidate
),
auto as (
  select game_id, category, player_id from cand where ncand = 1
),
-- Contagem de votos vem da vista agregada (definer): conta TODOS os votos e só
-- depois do fecho da janela. Filtra aos candidatos das categorias empatadas.
tv as (
  select t.game_id, t.category, t.votee_id as player_id, t.votes
  from public.v_game_vote_tally t
  join cand c on c.game_id = t.game_id and c.category = t.category
    and c.player_id = t.votee_id and c.ncand > 1
),
voted as (
  select game_id, category, player_id
  from (
    select game_id, category, player_id,
           rank() over (partition by game_id, category order by votes desc) as rk
    from tv
  ) s where rk = 1
),
resolved as (
  select game_id, category, player_id from auto
  union
  select game_id, category, player_id from voted
)
-- Garante MVP ≠ Flop (só relevante no caso degenerado de todos empatados).
select f.game_id, f.category, f.player_id
from resolved f
where f.category = 'mvp'
   or not exists (
     select 1 from resolved m
     where m.game_id = f.game_id and m.category = 'mvp' and m.player_id = f.player_id
   );

comment on view public.v_game_award is
  'MVP/Flop apurado por jogo — automático (rating único) ou por votação de desempate.';

grant select on public.v_game_award to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. Recriar v_player_stats: MVPs/Flops do apuramento + média das avaliações.
-- -----------------------------------------------------------------------------
create or replace view public.v_player_stats
with (security_invoker = on) as
with completed_games as (
  select id, team_a_score, team_b_score
  from public.game
  where status in ('finished', 'voting_open', 'closed')
),
participation as (
  select gp.player_id, gp.team, cg.team_a_score, cg.team_b_score
  from public.game_player gp
  join completed_games cg on cg.id = gp.game_id
),
results as (
  select
    player_id,
    count(*) as games,
    count(*) filter (
      where (team = 'A' and team_a_score > team_b_score)
         or (team = 'B' and team_b_score > team_a_score)
    ) as wins,
    count(*) filter (
      where team is not null and team_a_score is not null and team_a_score = team_b_score
    ) as draws,
    count(*) filter (
      where (team = 'A' and team_a_score < team_b_score)
         or (team = 'B' and team_b_score < team_a_score)
    ) as losses
  from participation
  group by player_id
),
event_counts as (
  select
    e.player_id,
    count(*) filter (where et.code = 'goal') as goals,
    count(*) filter (where et.code = 'assist') as assists,
    count(*) filter (where et.code = 'save') as saves
  from public.event e
  join public.event_type et on et.id = e.event_type_id
  join completed_games cg on cg.id = e.game_id
  group by e.player_id
),
award_counts as (
  select
    player_id,
    count(*) filter (where category = 'mvp') as mvps,
    count(*) filter (where category = 'flop') as flops
  from public.v_game_award
  group by player_id
),
rating_avg as (
  select player_id, round(avg(rating), 1) as avg_rating
  from public.v_game_player_rating
  group by player_id
)
select
  p.id                    as player_id,
  p.name                  as name,
  coalesce(r.games, 0)    as games,
  coalesce(r.wins, 0)     as wins,
  coalesce(r.draws, 0)    as draws,
  coalesce(r.losses, 0)   as losses,
  coalesce(ec.goals, 0)   as goals,
  coalesce(ec.assists, 0) as assists,
  coalesce(ec.saves, 0)   as saves,
  coalesce(ac.mvps, 0)    as mvps,
  coalesce(ac.flops, 0)   as flops,
  ra.avg_rating           as avg_rating
from public.profile p
left join results r on r.player_id = p.id
left join event_counts ec on ec.player_id = p.id
left join award_counts ac on ac.player_id = p.id
left join rating_avg ra on ra.player_id = p.id;

grant select on public.v_player_stats to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. Elegibilidade de voto: só entre candidatos da categoria, e nunca a mesma
--    pessoa nas duas categorias. Substitui can_cast_vote(uuid, uuid).
-- -----------------------------------------------------------------------------
create or replace function public.can_cast_vote(p_game_id uuid, p_category text, p_votee uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.game g
      where g.id = p_game_id and g.status = 'voting_open' and g.voting_closes_at > now()
    )
    and exists (
      select 1 from public.game_player gp
      where gp.game_id = p_game_id and gp.player_id = auth.uid()
    )
    -- o votado é candidato desta categoria (só se vota entre os empatados)
    and exists (
      select 1 from public.v_game_award_candidate c
      where c.game_id = p_game_id and c.category = p_category and c.player_id = p_votee
    )
    -- não votar a mesma pessoa nas duas categorias
    and not exists (
      select 1 from public.vote v
      where v.game_id = p_game_id and v.voter_id = auth.uid()
        and v.category <> p_category and v.votee_id = p_votee
    );
$$;

grant execute on function public.can_cast_vote(uuid, text, uuid) to authenticated;

-- Repor as policies de escrita usando a nova assinatura (com categoria).
drop policy if exists "vote_insert_own" on public.vote;
create policy "vote_insert_own"
  on public.vote for insert
  to authenticated
  with check (
    voter_id = auth.uid()
    and voter_id <> votee_id
    and public.can_cast_vote(game_id, category, votee_id)
  );

drop policy if exists "vote_update_own" on public.vote;
create policy "vote_update_own"
  on public.vote for update
  to authenticated
  using (voter_id = auth.uid())
  with check (
    voter_id = auth.uid()
    and voter_id <> votee_id
    and public.can_cast_vote(game_id, category, votee_id)
  );

drop function if exists public.can_cast_vote(uuid, uuid);

-- -----------------------------------------------------------------------------
-- 6. Apuramento pelo organizador: se houver empate, abre votação (dia seguinte
--    às 23:59 Europe/Lisbon); caso contrário, fecha logo (MVP/Flop automáticos).
-- -----------------------------------------------------------------------------
create or replace function public.resolve_awards(p_game_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sched timestamptz;
  v_close timestamptz;
  v_tie   boolean;
begin
  if not public.is_game_organizer(p_game_id) then
    raise exception 'Sem permissão para apurar MVP/Flop.';
  end if;

  select scheduled_at into v_sched
  from public.game where id = p_game_id and status = 'finished';
  if v_sched is null then
    raise exception 'O jogo tem de estar terminado para apurar.';
  end if;

  select exists (
    select 1
    from public.v_game_award_candidate
    where game_id = p_game_id
    group by game_id, category
    having count(*) > 1
  ) into v_tie;

  if v_tie then
    v_close := (((v_sched at time zone 'Europe/Lisbon')::date + 1)::timestamp
                + time '23:59:59') at time zone 'Europe/Lisbon';
    update public.game
    set status = 'voting_open', voting_closes_at = v_close
    where id = p_game_id and status = 'finished';
    return 'voting_open';
  else
    update public.game set status = 'closed' where id = p_game_id and status = 'finished';
    return 'closed';
  end if;
end $$;

grant execute on function public.resolve_awards(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- 7. XP do MVP passa a ler o apuramento (automático ou por votação), não a
--    contagem de votos. Recria award_game_xp mantendo o resto igual.
-- -----------------------------------------------------------------------------
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
  insert into public.xp_ledger (player_id, game_id, source_code, points, xp_rule_id)
  select gp.player_id, p_game_id, 'participation', ar.points, ar.rule_id
  from public.game_player gp, public.active_xp_rule('participation') ar
  where gp.game_id = p_game_id;

  -- Vitória.
  insert into public.xp_ledger (player_id, game_id, source_code, points, xp_rule_id)
  select gp.player_id, p_game_id, 'win', ar.points, ar.rule_id
  from public.game_player gp, public.active_xp_rule('win') ar
  where gp.game_id = p_game_id
    and (
      (gp.team = 'A' and v_game.team_a_score > v_game.team_b_score)
      or (gp.team = 'B' and v_game.team_b_score > v_game.team_a_score)
    );

  -- Golos.
  insert into public.xp_ledger (player_id, game_id, source_code, points, xp_rule_id)
  select e.player_id, p_game_id, 'goal', ar.points, ar.rule_id
  from public.event e
  join public.event_type et on et.id = e.event_type_id, public.active_xp_rule('goal') ar
  where e.game_id = p_game_id and et.code = 'goal';

  -- Assistências.
  insert into public.xp_ledger (player_id, game_id, source_code, points, xp_rule_id)
  select e.player_id, p_game_id, 'assist', ar.points, ar.rule_id
  from public.event e
  join public.event_type et on et.id = e.event_type_id, public.active_xp_rule('assist') ar
  where e.game_id = p_game_id and et.code = 'assist';

  -- MVP (apurado: automático ou vencedor da votação).
  insert into public.xp_ledger (player_id, game_id, source_code, points, xp_rule_id)
  select w.player_id, p_game_id, 'mvp', ar.points, ar.rule_id
  from public.v_game_award w, public.active_xp_rule('mvp') ar
  where w.game_id = p_game_id and w.category = 'mvp';

  update public.game set xp_processed_at = now() where id = p_game_id;
end $$;
