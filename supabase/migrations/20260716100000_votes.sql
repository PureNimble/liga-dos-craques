-- =============================================================================
-- F5 · Votação MVP / Flop
-- =============================================================================
-- Regras: 1 voto por categoria, não em si próprio, só participantes, dentro da
-- janela (até ao dia seguinte ao jogo). Fecho automático via pg_cron; robusto
-- mesmo sem cron (resultados/stats usam voting_closes_at, não só o status).
-- =============================================================================

create table if not exists public.vote (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references public.game (id) on delete cascade,
  voter_id   uuid not null references public.profile (id) on delete cascade,
  category   text not null check (category in ('mvp', 'flop')),
  votee_id   uuid not null references public.profile (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (game_id, voter_id, category),
  check (voter_id <> votee_id)
);

create index if not exists idx_vote_game on public.vote (game_id);
create index if not exists idx_vote_game_cat on public.vote (game_id, category);

alter table public.vote enable row level security;

-- Helper: valida janela + participação (usado pelas policies de escrita).
create or replace function public.can_cast_vote(p_game_id uuid, p_votee uuid)
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
    and exists (
      select 1 from public.game_player gp
      where gp.game_id = p_game_id and gp.player_id = p_votee
    );
$$;

grant execute on function public.can_cast_vote(uuid, uuid) to authenticated;

-- Leitura: cada um só vê os SEUS votos (resultados vêm da vista agregada).
drop policy if exists "vote_select_own" on public.vote;
create policy "vote_select_own"
  on public.vote for select
  to authenticated
  using (voter_id = auth.uid());

drop policy if exists "vote_insert_own" on public.vote;
create policy "vote_insert_own"
  on public.vote for insert
  to authenticated
  with check (
    voter_id = auth.uid()
    and voter_id <> votee_id
    and public.can_cast_vote(game_id, votee_id)
  );

drop policy if exists "vote_update_own" on public.vote;
create policy "vote_update_own"
  on public.vote for update
  to authenticated
  using (voter_id = auth.uid())
  with check (
    voter_id = auth.uid()
    and voter_id <> votee_id
    and public.can_cast_vote(game_id, votee_id)
  );

drop policy if exists "vote_delete_own" on public.vote;
create policy "vote_delete_own"
  on public.vote for delete
  to authenticated
  using (
    voter_id = auth.uid()
    and exists (
      select 1 from public.game g
      where g.id = game_id and g.status = 'voting_open' and g.voting_closes_at > now()
    )
  );

-- -----------------------------------------------------------------------------
-- RPC: abrir votação (organizador). Define o fecho para o dia seguinte ao jogo
-- às 23:59:59 de Europe/Lisbon.
-- -----------------------------------------------------------------------------
create or replace function public.open_voting(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_sched timestamptz;
  v_close timestamptz;
begin
  if not public.is_game_organizer(p_game_id) then
    raise exception 'Sem permissão para abrir a votação.';
  end if;

  select scheduled_at into v_sched from public.game where id = p_game_id;
  if v_sched is null then
    raise exception 'Jogo não encontrado.';
  end if;

  v_close := (((v_sched at time zone 'Europe/Lisbon')::date + 1)::timestamp
              + time '23:59:59') at time zone 'Europe/Lisbon';

  update public.game
  set status = 'voting_open', voting_closes_at = v_close
  where id = p_game_id and status = 'finished';
end $$;

grant execute on function public.open_voting(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Vista de resultados (agregada). NÃO expõe quem votou; só contagens, e apenas
-- depois de a votação fechar (voting_closes_at no passado).
-- Vista "definer" (sem security_invoker) para agregar todos os votos.
-- -----------------------------------------------------------------------------
create or replace view public.v_game_vote_tally as
select
  v.game_id,
  v.category,
  v.votee_id,
  count(*)::int as votes
from public.vote v
join public.game g on g.id = v.game_id
where g.voting_closes_at is not null and g.voting_closes_at <= now()
group by v.game_id, v.category, v.votee_id;

comment on view public.v_game_vote_tally is 'Contagem de votos MVP/Flop por jogo (só após fecho; sem identidade do votante).';

grant select on public.v_game_vote_tally to authenticated;

-- =============================================================================
-- Recriar v_player_stats incluindo MVPs e Flops.
-- =============================================================================
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
-- Vencedores por jogo/categoria (empates → co-vencedores).
winners as (
  select t.category, t.votee_id as player_id
  from public.v_game_vote_tally t
  join (
    select game_id, category, max(votes) as maxv
    from public.v_game_vote_tally
    group by game_id, category
  ) m on m.game_id = t.game_id and m.category = t.category and t.votes = m.maxv
  where t.votes > 0
),
vote_counts as (
  select
    player_id,
    count(*) filter (where category = 'mvp') as mvps,
    count(*) filter (where category = 'flop') as flops
  from winners
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
  coalesce(vc.mvps, 0)    as mvps,
  coalesce(vc.flops, 0)   as flops
from public.profile p
left join results r on r.player_id = p.id
left join event_counts ec on ec.player_id = p.id
left join vote_counts vc on vc.player_id = p.id;

grant select on public.v_player_stats to anon, authenticated;

-- =============================================================================
-- Fecho automático da votação (pg_cron). Best-effort: se o pg_cron não estiver
-- disponível, a migração NÃO falha (resultados/stats já usam voting_closes_at).
-- =============================================================================
do $do$
begin
  create extension if not exists pg_cron;
  perform cron.schedule(
    'close-voting',
    '*/15 * * * *',
    $cmd$ update public.game set status = 'closed'
          where status = 'voting_open' and voting_closes_at <= now() $cmd$
  );
exception when others then
  raise notice 'pg_cron indisponível, fecho automático ignorado: %', sqlerrm;
end $do$;
