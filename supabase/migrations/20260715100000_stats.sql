-- =============================================================================
-- F4 · Estatísticas (derivadas)
-- =============================================================================
-- Estatísticas individuais como VISTA derivada dos eventos e resultados - nunca
-- há contadores mantidos à mão que possam divergir. MVPs/Flops entram na F5.
--
-- security_invoker = on: a vista respeita o RLS do utilizador que consulta
-- (as tabelas base permitem leitura a autenticados).
-- =============================================================================

create or replace view public.v_player_stats
with (security_invoker = on) as
with completed_games as (
  select id, team_a_score, team_b_score
  from public.game
  where status in ('finished', 'voting_open', 'closed')
),
participation as (
  select
    gp.player_id,
    gp.team,
    cg.team_a_score,
    cg.team_b_score
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
      where team is not null
        and team_a_score is not null
        and team_a_score = team_b_score
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
  coalesce(ec.saves, 0)   as saves
from public.profile p
left join results r on r.player_id = p.id
left join event_counts ec on ec.player_id = p.id;

comment on view public.v_player_stats is 'Estatísticas individuais derivadas de eventos e resultados (F4).';

grant select on public.v_player_stats to anon, authenticated;
