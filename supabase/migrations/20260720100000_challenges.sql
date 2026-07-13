-- =============================================================================
-- F10 · Desafios
-- =============================================================================
-- Área SEPARADA dos jogos: Crossbar, Penáltis, Livres, 1v1. Histórico, vitórias/
-- derrotas, recordes e rankings próprios. NÃO afeta as estatísticas dos jogos
-- (esquema isolado, sem ligação a game/event/etc.).
-- =============================================================================

create table if not exists public.challenge (
  id           bigint generated always as identity primary key,
  code         text not null unique,
  label        text not null,
  scoring_type text not null check (scoring_type in ('higher_better', 'lower_better', 'versus')),
  icon         text not null default '🎯',
  sort_order   int not null default 0,
  active       boolean not null default true
);

comment on table public.challenge is 'Desafios (lookup). scoring_type: higher_better | lower_better | versus (1v1).';

alter table public.challenge enable row level security;

drop policy if exists "challenge_select" on public.challenge;
create policy "challenge_select" on public.challenge for select to anon, authenticated using (true);

insert into public.challenge (code, label, scoring_type, icon, sort_order)
select v.code, v.label, v.scoring_type, v.icon, v.sort_order
from (values
  ('crossbar', 'Crossbar Challenge', 'higher_better', '🎯', 10),
  ('penalty',  'Penáltis',           'higher_better', '⚽', 20),
  ('freekick', 'Livres',             'higher_better', '🥅', 30),
  ('1v1',      '1 vs 1',             'versus',        '🤺', 40)
) as v(code, label, scoring_type, icon, sort_order)
where not exists (select 1 from public.challenge);

-- -----------------------------------------------------------------------------
-- CHALLENGE_ATTEMPT
-- -----------------------------------------------------------------------------
create table if not exists public.challenge_attempt (
  id           uuid primary key default gen_random_uuid(),
  challenge_id bigint not null references public.challenge (id) on delete cascade,
  player_id    uuid not null references public.profile (id) on delete cascade,
  opponent_id  uuid references public.profile (id) on delete set null,
  score        numeric,
  result       text not null default 'na' check (result in ('win', 'loss', 'draw', 'na')),
  played_at    timestamptz not null default now(),
  meta         jsonb not null default '{}'::jsonb,
  created_by   uuid not null references public.profile (id),
  created_at   timestamptz not null default now()
);

create index if not exists idx_challenge_attempt_challenge on public.challenge_attempt (challenge_id);
create index if not exists idx_challenge_attempt_player on public.challenge_attempt (player_id);

alter table public.challenge_attempt enable row level security;

drop policy if exists "challenge_attempt_select" on public.challenge_attempt;
create policy "challenge_attempt_select"
  on public.challenge_attempt for select to authenticated using (true);

drop policy if exists "challenge_attempt_insert" on public.challenge_attempt;
create policy "challenge_attempt_insert"
  on public.challenge_attempt for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists "challenge_attempt_update" on public.challenge_attempt;
create policy "challenge_attempt_update"
  on public.challenge_attempt for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists "challenge_attempt_delete" on public.challenge_attempt;
create policy "challenge_attempt_delete"
  on public.challenge_attempt for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- Leaderboard por desafio e jogador (agregado).
-- -----------------------------------------------------------------------------
create or replace view public.v_challenge_leaderboard
with (security_invoker = on) as
select
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
group by a.challenge_id, c.code, c.scoring_type, a.player_id, p.name, p.photo_url;

grant select on public.v_challenge_leaderboard to authenticated;
