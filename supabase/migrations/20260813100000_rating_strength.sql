-- =============================================================================
-- Rating ajustado à força do adversário (estilo Elo)
-- =============================================================================
-- O impacto do resultado deixa de ser fixo (±0.3) e passa a depender da diferença
-- de força entre as equipas: ganhar a uma equipa mais forte vale mais, perder a
-- uma mais fraca custa mais (e vice-versa). Equipas equilibradas mantêm ±0.3.
--
-- Força de uma equipa = MÉDIA da skill-base dos seus jogadores. A skill-base é um
-- proxy calculado SÓ de tabelas cruas (jogos/eventos) e SEM o termo de MVP — assim
-- não depende do rating por jogo e evita-se a circularidade
-- (v_player_stats → v_game_player_rating → … → skill).
--
-- Constantes afináveis:  K = 0.6 (intensidade; equipas iguais → ±0.3),
--                        D = 20  (escala Elo: ~15 pontos de diferença ≈ 85% favorito).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Skill-base por jogador (só de dados crus; espelha computeRating sem MVP).
--    skill = 50 + 20·winRate + 8·golos/j + 6·assists/j + 4·defesas/j + 5·exp
-- -----------------------------------------------------------------------------
create or replace view public.v_player_skill
with (security_invoker = on) as
with completed as (
  select id, team_a_score, team_b_score
  from public.game
  where status in ('finished', 'voting_open', 'closed')
),
res as (
  select
    gp.player_id,
    count(*) as games,
    count(*) filter (
      where (gp.team = 'A' and c.team_a_score > c.team_b_score)
         or (gp.team = 'B' and c.team_b_score > c.team_a_score)
    ) as wins
  from public.game_player gp
  join completed c on c.id = gp.game_id
  group by gp.player_id
),
ev as (
  select
    e.player_id,
    count(*) filter (where et.code = 'goal')   as goals,
    count(*) filter (where et.code = 'assist') as assists,
    count(*) filter (where et.code = 'save')   as saves
  from public.event e
  join public.event_type et on et.id = e.event_type_id
  join completed c on c.id = e.game_id
  group by e.player_id
)
select
  p.id as player_id,
  case
    when coalesce(r.games, 0) = 0 then 50.0
    else 50.0
       + 20.0 * (r.wins::numeric / r.games)
       + 8.0  * (coalesce(ev.goals, 0)::numeric / r.games)
       + 6.0  * (coalesce(ev.assists, 0)::numeric / r.games)
       + 4.0  * (coalesce(ev.saves, 0)::numeric / r.games)
       + 5.0  * (least(r.games, 10)::numeric / 10)
  end::numeric(6, 2) as skill
from public.profile p
left join res r on r.player_id = p.id
left join ev on ev.player_id = p.id;

grant select on public.v_player_skill to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Resultado ponderado por jogo × jogador: expectativa Elo e desvio (dv).
--    dv = actual − expected, com actual ∈ {1, 0.5, 0} e expected da diferença de
--    médias de skill entre a própria equipa e a adversária.
-- -----------------------------------------------------------------------------
create or replace view public.v_game_player_result
with (security_invoker = on) as
with completed as (
  select id, team_a_score, team_b_score
  from public.game
  where status in ('finished', 'voting_open', 'closed')
),
team_skill as (
  select gp.game_id, gp.team, avg(sk.skill) as avg_skill
  from public.game_player gp
  join public.v_player_skill sk on sk.player_id = gp.player_id
  where gp.team is not null
  group by gp.game_id, gp.team
)
select
  gp.game_id,
  gp.player_id,
  own.avg_skill as own_avg,
  opp.avg_skill as opp_avg,
  v.actual,
  v.expected,
  (v.actual - v.expected) as dv
from public.game_player gp
join completed c on c.id = gp.game_id
left join team_skill own on own.game_id = gp.game_id and own.team = gp.team
left join team_skill opp on opp.game_id = gp.game_id
  and opp.team = (case when gp.team = 'A' then 'B' else 'A' end)
cross join lateral (
  select
    (case
       when (gp.team = 'A' and c.team_a_score > c.team_b_score)
         or (gp.team = 'B' and c.team_b_score > c.team_a_score) then 1.0
       when c.team_a_score is not null and c.team_a_score = c.team_b_score then 0.5
       else 0.0
     end)::numeric as actual,
    -- Equipas/força em falta (null) → diferença 0 → expected 0.5 → baseline ±0.3.
    (1.0 / (1.0 + power(
      10.0,
      (coalesce(opp.avg_skill, own.avg_skill) - coalesce(own.avg_skill, opp.avg_skill)) / 20.0
    )))::numeric as expected
) v
where gp.team is not null;

grant select on public.v_game_player_result to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 3. Rating por jogo — troca o ±0.3 vitória/derrota por 0.6·dv (Elo).
--    Eventos individuais inalterados. Colunas iguais → create or replace seguro.
-- -----------------------------------------------------------------------------
create or replace view public.v_game_player_rating
with (security_invoker = on) as
with completed as (
  select id from public.game
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
    + 0.6 * coalesce(res.dv, 0)
    - 0.5 * coalesce(ev.pen_missed, 0)
    - 1.0 * coalesce(ev.own_goals, 0)
  )::numeric, 1)))::numeric(4, 1) as rating
from public.game_player gp
join completed c on c.id = gp.game_id
left join ev on ev.game_id = gp.game_id and ev.player_id = gp.player_id
left join public.v_game_player_result res on res.game_id = gp.game_id and res.player_id = gp.player_id;

comment on view public.v_game_player_rating is
  'Avaliação (0–10, base 6.0) por jogo; o termo de resultado é 0.6·(actual−expected) conforme a força das equipas.';

grant select on public.v_game_player_rating to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 4. v_player_stats — mesma definição + coluna strength_delta = média do dv.
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
),
strength as (
  select player_id, round(avg(dv), 3) as strength_delta
  from public.v_game_player_result
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
  ra.avg_rating           as avg_rating,
  sd.strength_delta       as strength_delta
from public.profile p
left join results r on r.player_id = p.id
left join event_counts ec on ec.player_id = p.id
left join award_counts ac on ac.player_id = p.id
left join rating_avg ra on ra.player_id = p.id
left join strength sd on sd.player_id = p.id;

grant select on public.v_player_stats to anon, authenticated;
