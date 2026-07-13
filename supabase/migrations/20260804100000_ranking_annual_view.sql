-- =============================================================================
-- Ranking anual (agregado por ano, sem mês)
-- =============================================================================
-- v_ranking_by_period já cobre o mensal (ano+mês); o anual era agregado no
-- cliente a partir das linhas mensais. Esta vista faz a mesma agregação em
-- SQL, mesma estrutura de v_ranking_by_period mas agrupada só por ano.
-- =============================================================================

create or replace view public.v_ranking_annual
with (security_invoker = on) as
with cg as (
  select
    g.id,
    extract(year from (g.scheduled_at at time zone 'Europe/Lisbon'))::int as year,
    g.team_a_score as a, g.team_b_score as b
  from public.game g
  where g.status in ('finished', 'voting_open', 'closed')
),
part as (
  select gp.player_id, cg.year, gp.team, cg.a, cg.b
  from public.game_player gp
  join cg on cg.id = gp.game_id
),
res as (
  select
    player_id, year,
    count(*) as games,
    count(*) filter (where (team = 'A' and a > b) or (team = 'B' and b > a)) as wins,
    count(*) filter (where team is not null and a is not null and a = b) as draws,
    count(*) filter (where (team = 'A' and a < b) or (team = 'B' and b < a)) as losses
  from part
  group by player_id, year
),
ev as (
  select
    e.player_id, cg.year,
    count(*) filter (where et.code = 'goal') as goals,
    count(*) filter (where et.code = 'assist') as assists
  from public.event e
  join public.event_type et on et.id = e.event_type_id
  join cg on cg.id = e.game_id
  group by e.player_id, cg.year
)
select
  r.player_id, p.name, p.photo_url, r.year,
  r.games, r.wins, r.draws, r.losses,
  coalesce(ev.goals, 0) as goals,
  coalesce(ev.assists, 0) as assists,
  (3 * r.wins + r.draws) as points
from res r
join public.profile p on p.id = r.player_id
left join ev on ev.player_id = r.player_id and ev.year = r.year;

grant select on public.v_ranking_annual to authenticated;
