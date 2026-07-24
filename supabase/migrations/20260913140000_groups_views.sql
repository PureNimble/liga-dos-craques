-- =============================================================================
-- Grupos · vistas derivadas passam a ser por (jogador, grupo)
-- =============================================================================
-- Toda a cadeia de estatísticas/rating/XP/rankings passa a agrupar por
-- (player_id, group_id) em vez de só player_id - um jogador tem nível/rating/
-- estatísticas INDEPENDENTES em cada grupo a que pertence. A tabela condutora
-- deixa de ser `profile` e passa a ser `group_member`: só existe uma linha
-- para os pares (jogador, grupo) que realmente existem, e os totais ficam a
-- zero em vez de fazer produto cartesiano entre jogadores e grupos.
--
-- Usa-se DROP + CREATE (em vez de CREATE OR REPLACE) porque group_id entra a
-- meio da lista de colunas em várias vistas, e o Postgres só permite ao
-- CREATE OR REPLACE VIEW acrescentar colunas no fim, não inserir a meio.
-- Isto obriga a apagar em cascata (a cadeia de dependências) e recriar tudo
-- pela ordem certa, com os GRANTs outra vez (o DROP remove-os).
-- =============================================================================

drop view if exists public.v_player_skill cascade;
drop view if exists public.v_player_xp cascade;
drop view if exists public.v_ranking_by_format cascade;
drop view if exists public.v_ranking_by_period cascade;
drop view if exists public.v_ranking_annual cascade;
drop view if exists public.v_challenge_leaderboard cascade;

-- -----------------------------------------------------------------------------
-- 1. Skill-base por (jogador, grupo) - só de dados crus, sem termo de MVP.
-- -----------------------------------------------------------------------------
create view public.v_player_skill
with (security_invoker = on) as
with completed as (
  select id, group_id, team_a_score, team_b_score
  from public.game
  where status in ('finished', 'voting_open', 'closed')
),
res as (
  select
    gp.player_id, c.group_id,
    count(*) as games,
    count(*) filter (
      where (gp.team = 'A' and c.team_a_score > c.team_b_score)
         or (gp.team = 'B' and c.team_b_score > c.team_a_score)
    ) as wins
  from public.game_player gp
  join completed c on c.id = gp.game_id
  group by gp.player_id, c.group_id
),
ev as (
  select
    e.player_id, c.group_id,
    count(*) filter (where et.code = 'goal')   as goals,
    count(*) filter (where et.code = 'assist') as assists,
    count(*) filter (where et.code = 'save')   as saves
  from public.event e
  join public.event_type et on et.id = e.event_type_id
  join completed c on c.id = e.game_id
  group by e.player_id, c.group_id
)
select
  gm.player_id,
  gm.group_id,
  case
    when coalesce(r.games, 0) = 0 then 50.0
    else 50.0
       + 20.0 * (r.wins::numeric / r.games)
       + 8.0  * (coalesce(ev.goals, 0)::numeric / r.games)
       + 6.0  * (coalesce(ev.assists, 0)::numeric / r.games)
       + 4.0  * (coalesce(ev.saves, 0)::numeric / r.games)
       + 5.0  * (least(r.games, 10)::numeric / 10)
  end::numeric(6, 2) as skill
from public.group_member gm
left join res r on r.player_id = gm.player_id and r.group_id = gm.group_id
left join ev on ev.player_id = gm.player_id and ev.group_id = gm.group_id;

grant select on public.v_player_skill to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 2. Resultado ponderado por jogo × jogador (expectativa Elo e desvio).
-- -----------------------------------------------------------------------------
create view public.v_game_player_result
with (security_invoker = on) as
with completed as (
  select id, group_id, team_a_score, team_b_score
  from public.game
  where status in ('finished', 'voting_open', 'closed')
),
team_skill as (
  select gp.game_id, gp.team, avg(sk.skill) as avg_skill
  from public.game_player gp
  join completed c on c.id = gp.game_id
  join public.v_player_skill sk on sk.player_id = gp.player_id and sk.group_id = c.group_id
  where gp.team is not null
  group by gp.game_id, gp.team
)
select
  gp.game_id,
  gp.player_id,
  c.group_id,
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
-- 3. Rating por jogo (0–10, base 6.0) - inalterado, só ganha group_id.
-- -----------------------------------------------------------------------------
create view public.v_game_player_rating
with (security_invoker = on) as
with completed as (
  select id, group_id from public.game
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
  c.group_id,
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
-- 4. MVP/Flop por jogo - desempate pela consistência DENTRO DO MESMO GRUPO.
-- -----------------------------------------------------------------------------
create view public.v_game_award
with (security_invoker = on) as
with r as (
  select
    game_id, group_id, player_id, rating,
    count(*) over (partition by game_id) as n,
    max(rating) over (partition by game_id) as mx,
    min(rating) over (partition by game_id) as mn
  from public.v_game_player_rating
),
pavg as (
  -- consistência do jogador = média de todas as suas avaliações NESSE grupo
  select player_id, group_id, avg(rating) as avg_rating
  from public.v_game_player_rating
  group by player_id, group_id
),
mvp as (
  select
    r.game_id, r.group_id, 'mvp'::text as category, r.player_id,
    row_number() over (
      partition by r.game_id
      order by coalesce(pa.avg_rating, 6) desc, r.player_id asc
    ) as rn
  from r
  left join pavg pa on pa.player_id = r.player_id and pa.group_id = r.group_id
  where r.n >= 2 and r.rating = r.mx
),
flop as (
  select
    r.game_id, r.group_id, 'flop'::text as category, r.player_id,
    row_number() over (
      partition by r.game_id
      order by coalesce(pa.avg_rating, 6) asc, r.player_id desc
    ) as rn
  from r
  left join pavg pa on pa.player_id = r.player_id and pa.group_id = r.group_id
  where r.n >= 2 and r.rating = r.mn
),
picked as (
  select game_id, group_id, category, player_id from mvp where rn = 1
  union all
  select game_id, group_id, category, player_id from flop where rn = 1
)
-- Garante MVP ≠ Flop (caso degenerado de todos com o mesmo rating e média).
select p.game_id, p.group_id, p.category, p.player_id
from picked p
where p.category = 'mvp'
   or not exists (
     select 1 from picked m
     where m.game_id = p.game_id and m.category = 'mvp' and m.player_id = p.player_id
   );

comment on view public.v_game_award is
  'MVP/Flop apurado por jogo - melhor/pior rating; empate desfeito pela consistência (média) dentro do mesmo grupo.';

grant select on public.v_game_award to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 5. Estatísticas por (jogador, grupo) - condutora passa a ser group_member,
--    não profile: só há linha para pares que existem, zeros nos que não jogaram.
-- -----------------------------------------------------------------------------
create view public.v_player_stats
with (security_invoker = on) as
with completed_games as (
  select id, group_id, team_a_score, team_b_score
  from public.game
  where status in ('finished', 'voting_open', 'closed')
),
participation as (
  select gp.player_id, cg.group_id, gp.team, cg.team_a_score, cg.team_b_score
  from public.game_player gp
  join completed_games cg on cg.id = gp.game_id
),
results as (
  select
    player_id, group_id,
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
  group by player_id, group_id
),
event_counts as (
  select
    e.player_id, cg.group_id,
    count(*) filter (where et.code = 'goal') as goals,
    count(*) filter (where et.code = 'assist') as assists,
    count(*) filter (where et.code = 'save') as saves
  from public.event e
  join public.event_type et on et.id = e.event_type_id
  join completed_games cg on cg.id = e.game_id
  group by e.player_id, cg.group_id
),
award_counts as (
  select
    player_id, group_id,
    count(*) filter (where category = 'mvp') as mvps,
    count(*) filter (where category = 'flop') as flops
  from public.v_game_award
  group by player_id, group_id
),
rating_avg as (
  select player_id, group_id, round(avg(rating), 1) as avg_rating
  from public.v_game_player_rating
  group by player_id, group_id
),
strength as (
  select player_id, group_id, round(avg(dv), 3) as strength_delta
  from public.v_game_player_result
  group by player_id, group_id
)
select
  gm.player_id            as player_id,
  gm.group_id             as group_id,
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
from public.group_member gm
join public.profile p on p.id = gm.player_id
left join results r on r.player_id = gm.player_id and r.group_id = gm.group_id
left join event_counts ec on ec.player_id = gm.player_id and ec.group_id = gm.group_id
left join award_counts ac on ac.player_id = gm.player_id and ac.group_id = gm.group_id
left join rating_avg ra on ra.player_id = gm.player_id and ra.group_id = gm.group_id
left join strength sd on sd.player_id = gm.player_id and sd.group_id = gm.group_id;

grant select on public.v_player_stats to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 6. XP total, nível e progresso por (jogador, grupo).
-- -----------------------------------------------------------------------------
create view public.v_player_xp
with (security_invoker = on) as
with totals as (
  select gm.player_id, gm.group_id, coalesce(sum(l.points), 0)::int as total_xp
  from public.group_member gm
  left join public.xp_ledger l on l.player_id = gm.player_id and l.group_id = gm.group_id
  group by gm.player_id, gm.group_id
)
select
  t.player_id,
  t.group_id,
  t.total_xp,
  coalesce((select max(lv.level) from public.xp_level lv where lv.min_xp <= t.total_xp), 1) as level,
  coalesce((select max(lv.min_xp) from public.xp_level lv where lv.min_xp <= t.total_xp), 0) as level_min_xp,
  (select min(lv.min_xp) from public.xp_level lv where lv.min_xp > t.total_xp) as next_level_xp
from totals t;

grant select on public.v_player_xp to anon, authenticated;

-- -----------------------------------------------------------------------------
-- 7. Rankings - geral/posição, por formato, mensal, anual - todos por grupo.
-- -----------------------------------------------------------------------------
create view public.v_ranking_overall
with (security_invoker = on) as
select
  s.player_id,
  s.group_id,
  p.name,
  p.photo_url,
  pos.category as position_category,
  s.games, s.wins, s.draws, s.losses,
  s.goals, s.assists, s.saves, s.mvps, s.flops,
  coalesce(x.total_xp, 0) as total_xp
from public.v_player_stats s
join public.profile p on p.id = s.player_id
left join public.position pos on pos.id = p.main_position_id
left join public.v_player_xp x on x.player_id = s.player_id and x.group_id = s.group_id;

grant select on public.v_ranking_overall to authenticated;

create view public.v_ranking_by_format
with (security_invoker = on) as
with cg as (
  select g.id, g.group_id, gf.code as format_code, g.team_a_score as a, g.team_b_score as b
  from public.game g
  join public.game_format gf on gf.id = g.format_id
  where g.status in ('finished', 'voting_open', 'closed')
),
part as (
  select gp.player_id, cg.group_id, cg.format_code, gp.team, cg.a, cg.b
  from public.game_player gp
  join cg on cg.id = gp.game_id
),
res as (
  select
    player_id, group_id, format_code,
    count(*) as games,
    count(*) filter (where (team = 'A' and a > b) or (team = 'B' and b > a)) as wins,
    count(*) filter (where team is not null and a is not null and a = b) as draws,
    count(*) filter (where (team = 'A' and a < b) or (team = 'B' and b < a)) as losses
  from part
  group by player_id, group_id, format_code
),
ev as (
  select
    e.player_id, cg.group_id, cg.format_code,
    count(*) filter (where et.code = 'goal') as goals,
    count(*) filter (where et.code = 'assist') as assists
  from public.event e
  join public.event_type et on et.id = e.event_type_id
  join cg on cg.id = e.game_id
  group by e.player_id, cg.group_id, cg.format_code
)
select
  r.player_id, r.group_id, p.name, p.photo_url, r.format_code,
  r.games, r.wins, r.draws, r.losses,
  coalesce(ev.goals, 0) as goals,
  coalesce(ev.assists, 0) as assists,
  (3 * r.wins + r.draws) as points
from res r
join public.profile p on p.id = r.player_id
left join ev on ev.player_id = r.player_id and ev.group_id = r.group_id and ev.format_code = r.format_code;

grant select on public.v_ranking_by_format to authenticated;

create view public.v_ranking_by_period
with (security_invoker = on) as
with cg as (
  select
    g.id, g.group_id,
    extract(year from (g.scheduled_at at time zone 'Europe/Lisbon'))::int as year,
    extract(month from (g.scheduled_at at time zone 'Europe/Lisbon'))::int as month,
    g.team_a_score as a, g.team_b_score as b
  from public.game g
  where g.status in ('finished', 'voting_open', 'closed')
),
part as (
  select gp.player_id, cg.group_id, cg.year, cg.month, gp.team, cg.a, cg.b
  from public.game_player gp
  join cg on cg.id = gp.game_id
),
res as (
  select
    player_id, group_id, year, month,
    count(*) as games,
    count(*) filter (where (team = 'A' and a > b) or (team = 'B' and b > a)) as wins,
    count(*) filter (where team is not null and a is not null and a = b) as draws,
    count(*) filter (where (team = 'A' and a < b) or (team = 'B' and b < a)) as losses
  from part
  group by player_id, group_id, year, month
),
ev as (
  select
    e.player_id, cg.group_id, cg.year, cg.month,
    count(*) filter (where et.code = 'goal') as goals,
    count(*) filter (where et.code = 'assist') as assists
  from public.event e
  join public.event_type et on et.id = e.event_type_id
  join cg on cg.id = e.game_id
  group by e.player_id, cg.group_id, cg.year, cg.month
)
select
  r.player_id, r.group_id, p.name, p.photo_url, r.year, r.month,
  r.games, r.wins, r.draws, r.losses,
  coalesce(ev.goals, 0) as goals,
  coalesce(ev.assists, 0) as assists,
  (3 * r.wins + r.draws) as points
from res r
join public.profile p on p.id = r.player_id
left join ev on ev.player_id = r.player_id and ev.group_id = r.group_id
  and ev.year = r.year and ev.month = r.month;

grant select on public.v_ranking_by_period to authenticated;

create view public.v_ranking_annual
with (security_invoker = on) as
with cg as (
  select
    g.id, g.group_id,
    extract(year from (g.scheduled_at at time zone 'Europe/Lisbon'))::int as year,
    g.team_a_score as a, g.team_b_score as b
  from public.game g
  where g.status in ('finished', 'voting_open', 'closed')
),
part as (
  select gp.player_id, cg.group_id, cg.year, gp.team, cg.a, cg.b
  from public.game_player gp
  join cg on cg.id = gp.game_id
),
res as (
  select
    player_id, group_id, year,
    count(*) as games,
    count(*) filter (where (team = 'A' and a > b) or (team = 'B' and b > a)) as wins,
    count(*) filter (where team is not null and a is not null and a = b) as draws,
    count(*) filter (where (team = 'A' and a < b) or (team = 'B' and b < a)) as losses
  from part
  group by player_id, group_id, year
),
ev as (
  select
    e.player_id, cg.group_id, cg.year,
    count(*) filter (where et.code = 'goal') as goals,
    count(*) filter (where et.code = 'assist') as assists
  from public.event e
  join public.event_type et on et.id = e.event_type_id
  join cg on cg.id = e.game_id
  group by e.player_id, cg.group_id, cg.year
)
select
  r.player_id, r.group_id, p.name, p.photo_url, r.year,
  r.games, r.wins, r.draws, r.losses,
  coalesce(ev.goals, 0) as goals,
  coalesce(ev.assists, 0) as assists,
  (3 * r.wins + r.draws) as points
from res r
join public.profile p on p.id = r.player_id
left join ev on ev.player_id = r.player_id and ev.group_id = r.group_id and ev.year = r.year;

grant select on public.v_ranking_annual to authenticated;

-- -----------------------------------------------------------------------------
-- 8. Leaderboard de desafios por grupo (challenge_attempt já tem group_id).
-- -----------------------------------------------------------------------------
create view public.v_challenge_leaderboard
with (security_invoker = on) as
select
  a.group_id,
  a.challenge_id,
  c.code as challenge_code,
  c.scoring_type,
  a.player_id,
  p.name,
  p.photo_url,
  count(*)::int as attempts,
  max(a.score) as best_high,
  min(a.score) as best_low,
  count(*) filter (where a.result = 'win')::int as wins,
  count(*) filter (where a.result = 'loss')::int as losses,
  max(a.played_at) as last_played
from public.challenge_attempt a
join public.challenge c on c.id = a.challenge_id
join public.profile p on p.id = a.player_id
group by a.group_id, a.challenge_id, c.code, c.scoring_type, a.player_id, p.name, p.photo_url;

grant select on public.v_challenge_leaderboard to authenticated;
