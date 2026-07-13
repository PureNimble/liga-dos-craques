-- =============================================================================
-- F8 · Rankings (derivados)
-- =============================================================================
-- Vistas cobrem todos os âmbitos pedidos:
--   v_ranking_overall    → geral e por posição (filtro por categoria no cliente)
--   v_ranking_by_format  → por formato (5v5, 7v7, 11v11, …)
--   v_ranking_by_period  → mensal (ano+mês)
--   v_ranking_annual     → anual (ver 20260804100000_ranking_annual_view.sql)
-- Tudo derivado de eventos/resultados — consistente por construção.
-- "points" = 3*vitórias + empates (pontos à moda de liga).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- GERAL / POR POSIÇÃO
-- -----------------------------------------------------------------------------
create or replace view public.v_ranking_overall
with (security_invoker = on) as
select
  s.player_id,
  p.name,
  p.photo_url,
  pos.category as position_category,
  s.games, s.wins, s.draws, s.losses,
  s.goals, s.assists, s.saves, s.mvps, s.flops,
  coalesce(x.total_xp, 0) as total_xp
from public.v_player_stats s
join public.profile p on p.id = s.player_id
left join public.position pos on pos.id = p.main_position_id
left join public.v_player_xp x on x.player_id = s.player_id;

grant select on public.v_ranking_overall to authenticated;

-- -----------------------------------------------------------------------------
-- POR FORMATO
-- -----------------------------------------------------------------------------
create or replace view public.v_ranking_by_format
with (security_invoker = on) as
with cg as (
  select g.id, gf.code as format_code, g.team_a_score as a, g.team_b_score as b
  from public.game g
  join public.game_format gf on gf.id = g.format_id
  where g.status in ('finished', 'voting_open', 'closed')
),
part as (
  select gp.player_id, cg.format_code, gp.team, cg.a, cg.b
  from public.game_player gp
  join cg on cg.id = gp.game_id
),
res as (
  select
    player_id, format_code,
    count(*) as games,
    count(*) filter (where (team = 'A' and a > b) or (team = 'B' and b > a)) as wins,
    count(*) filter (where team is not null and a is not null and a = b) as draws,
    count(*) filter (where (team = 'A' and a < b) or (team = 'B' and b < a)) as losses
  from part
  group by player_id, format_code
),
ev as (
  select
    e.player_id, cg.format_code,
    count(*) filter (where et.code = 'goal') as goals,
    count(*) filter (where et.code = 'assist') as assists
  from public.event e
  join public.event_type et on et.id = e.event_type_id
  join cg on cg.id = e.game_id
  group by e.player_id, cg.format_code
)
select
  r.player_id, p.name, p.photo_url, r.format_code,
  r.games, r.wins, r.draws, r.losses,
  coalesce(ev.goals, 0) as goals,
  coalesce(ev.assists, 0) as assists,
  (3 * r.wins + r.draws) as points
from res r
join public.profile p on p.id = r.player_id
left join ev on ev.player_id = r.player_id and ev.format_code = r.format_code;

grant select on public.v_ranking_by_format to authenticated;

-- -----------------------------------------------------------------------------
-- MENSAL / ANUAL
-- -----------------------------------------------------------------------------
create or replace view public.v_ranking_by_period
with (security_invoker = on) as
with cg as (
  select
    g.id,
    extract(year from (g.scheduled_at at time zone 'Europe/Lisbon'))::int as year,
    extract(month from (g.scheduled_at at time zone 'Europe/Lisbon'))::int as month,
    g.team_a_score as a, g.team_b_score as b
  from public.game g
  where g.status in ('finished', 'voting_open', 'closed')
),
part as (
  select gp.player_id, cg.year, cg.month, gp.team, cg.a, cg.b
  from public.game_player gp
  join cg on cg.id = gp.game_id
),
res as (
  select
    player_id, year, month,
    count(*) as games,
    count(*) filter (where (team = 'A' and a > b) or (team = 'B' and b > a)) as wins,
    count(*) filter (where team is not null and a is not null and a = b) as draws,
    count(*) filter (where (team = 'A' and a < b) or (team = 'B' and b < a)) as losses
  from part
  group by player_id, year, month
),
ev as (
  select
    e.player_id, cg.year, cg.month,
    count(*) filter (where et.code = 'goal') as goals,
    count(*) filter (where et.code = 'assist') as assists
  from public.event e
  join public.event_type et on et.id = e.event_type_id
  join cg on cg.id = e.game_id
  group by e.player_id, cg.year, cg.month
)
select
  r.player_id, p.name, p.photo_url, r.year, r.month,
  r.games, r.wins, r.draws, r.losses,
  coalesce(ev.goals, 0) as goals,
  coalesce(ev.assists, 0) as assists,
  (3 * r.wins + r.draws) as points
from res r
join public.profile p on p.id = r.player_id
left join ev on ev.player_id = r.player_id and ev.year = r.year and ev.month = r.month;

grant select on public.v_ranking_by_period to authenticated;
