-- =============================================================================
-- Golos icónicos deixam de depender de conquistas (achievement)
-- =============================================================================
-- Antes, cada golo icónico tinha uma conquista associada e o "replicado" vivia
-- em user_achievement. Passa a ter tabela própria (iconic_goal_replica) e as
-- linhas de achievement dos golos icónicos são APAGADAS. O ecrã do desafio
-- continua igual (spinner, replicar, desistir, ranking); a grelha de conquistas
-- do perfil deixa de os conhecer de todo.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Tabela de replicados (1 linha por golo replicado por jogador).
--    Escrita só pela RPC (security definer); leitura para todos os autenticados
--    (ranking + estado próprio).
-- -----------------------------------------------------------------------------
create table if not exists public.iconic_goal_replica (
  player_id      uuid not null references public.profile (id) on delete cascade,
  iconic_goal_id bigint not null references public.iconic_goal (id) on delete cascade,
  replicated_at  timestamptz not null default now(),
  primary key (player_id, iconic_goal_id)
);

comment on table public.iconic_goal_replica is 'Golos icónicos replicados por jogador (substitui user_achievement para os golos).';

alter table public.iconic_goal_replica enable row level security;

drop policy if exists "iconic_goal_replica_select" on public.iconic_goal_replica;
create policy "iconic_goal_replica_select" on public.iconic_goal_replica for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- 2. Migrar os replicados existentes antes de cortar a ligação.
-- -----------------------------------------------------------------------------
insert into public.iconic_goal_replica (player_id, iconic_goal_id, replicated_at)
select ua.player_id, g.id, ua.unlocked_at
from public.user_achievement ua
join public.iconic_goal g on g.achievement_id = ua.achievement_id
on conflict do nothing;

-- -----------------------------------------------------------------------------
-- 3. RPCs passam a usar iconic_goal_replica (deixam de tocar em achievement).
-- -----------------------------------------------------------------------------

-- Sorteia um golo por replicar. Se já houver spin ativo, devolve-o (não re-rola).
create or replace function public.iconic_goal_roll()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_goal_id bigint;
begin
  if v_uid is null then
    raise exception 'Não autenticado';
  end if;

  select iconic_goal_id into v_goal_id
  from public.iconic_goal_spin where player_id = v_uid;
  if found then
    return v_goal_id;
  end if;

  select g.id into v_goal_id
  from public.iconic_goal g
  where g.active
    and not exists (
      select 1 from public.iconic_goal_replica r
      where r.player_id = v_uid and r.iconic_goal_id = g.id
    )
  order by random()
  limit 1;

  if v_goal_id is null then
    return null; -- já replicou todos os golos disponíveis
  end if;

  insert into public.iconic_goal_spin (player_id, iconic_goal_id)
  values (v_uid, v_goal_id);

  return v_goal_id;
end $$;

grant execute on function public.iconic_goal_roll() to authenticated;

-- Auto-declaração: marca o golo ativo como replicado e limpa o spin.
create or replace function public.iconic_goal_replicate()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_goal_id bigint;
begin
  if v_uid is null then
    raise exception 'Não autenticado';
  end if;

  select iconic_goal_id into v_goal_id
  from public.iconic_goal_spin where player_id = v_uid;

  if not found then
    raise exception 'Sem golo ativo';
  end if;

  insert into public.iconic_goal_replica (player_id, iconic_goal_id)
  values (v_uid, v_goal_id)
  on conflict do nothing;

  delete from public.iconic_goal_spin where player_id = v_uid;

  return v_goal_id;
end $$;

grant execute on function public.iconic_goal_replicate() to authenticated;

-- -----------------------------------------------------------------------------
-- 4. Ranking passa a contar iconic_goal_replica.
-- -----------------------------------------------------------------------------
create or replace view public.v_iconic_goal_leaderboard
with (security_invoker = on) as
select
  p.id as player_id,
  p.name,
  p.photo_url,
  count(r.iconic_goal_id)::int as replicated
from public.profile p
join public.iconic_goal_replica r on r.player_id = p.id
group by p.id, p.name, p.photo_url;

grant select on public.v_iconic_goal_leaderboard to authenticated;

-- -----------------------------------------------------------------------------
-- 5. Cortar a ligação e apagar as conquistas dos golos icónicos.
--    (Apagar a coluna primeiro evita o cascade que apagaria os golos.)
-- -----------------------------------------------------------------------------
alter table public.iconic_goal drop column achievement_id;

delete from public.achievement where code like 'ig\_%';
