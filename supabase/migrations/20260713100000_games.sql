-- =============================================================================
-- F2 · Jogos
-- =============================================================================
-- Formatos (lookup), jogos, jogadores do jogo (N:N) e a máquina de estados.
-- Introduz helpers de autorização (is_admin / is_game_organizer) reutilizáveis
-- pelas fases seguintes (eventos, votação, etc.).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Helper: is_admin() - SECURITY DEFINER para ler profile.role sem recursão RLS.
-- -----------------------------------------------------------------------------
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profile where id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- GAME_FORMAT (lookup) - dados de referência na migração (chegam a produção).
-- -----------------------------------------------------------------------------
create table if not exists public.game_format (
  id               bigint generated always as identity primary key,
  code             text not null unique,
  label            text not null,
  players_per_side int  not null check (players_per_side between 1 and 11),
  sort_order       int  not null default 0
);

comment on table public.game_format is 'Formatos de jogo (1v1 … 11v11).';

insert into public.game_format (code, label, players_per_side, sort_order) values
  ('1v1',   '1 vs 1',   1,  1),
  ('2v2',   '2 vs 2',   2,  2),
  ('3v3',   '3 vs 3',   3,  3),
  ('4v4',   '4 vs 4',   4,  4),
  ('5v5',   '5 vs 5',   5,  5),
  ('6v6',   '6 vs 6',   6,  6),
  ('7v7',   '7 vs 7',   7,  7),
  ('8v8',   '8 vs 8',   8,  8),
  ('9v9',   '9 vs 9',   9,  9),
  ('10v10', '10 vs 10', 10, 10),
  ('11v11', '11 vs 11', 11, 11)
on conflict (code) do nothing;

alter table public.game_format enable row level security;

drop policy if exists "format_select_all" on public.game_format;
create policy "format_select_all"
  on public.game_format for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- GAME
-- -----------------------------------------------------------------------------
create table if not exists public.game (
  id               uuid primary key default gen_random_uuid(),
  created_by       uuid not null references public.profile (id) on delete cascade,
  scheduled_at     timestamptz not null,
  location         text,
  format_id        bigint not null references public.game_format (id),
  max_players      int not null check (max_players between 2 and 30),
  status           text not null default 'scheduled'
                     check (status in (
                       'draft', 'scheduled', 'open', 'teams_generated',
                       'in_progress', 'finished', 'voting_open', 'closed', 'cancelled'
                     )),
  team_a_score     int check (team_a_score is null or team_a_score >= 0),
  team_b_score     int check (team_b_score is null or team_b_score >= 0),
  voting_closes_at timestamptz,
  notes            text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.game is 'Jogos. Ciclo de vida: draft→scheduled→open→teams_generated→in_progress→finished→voting_open→closed (+cancelled).';

create index if not exists idx_game_scheduled_at on public.game (scheduled_at);
create index if not exists idx_game_status on public.game (status);
create index if not exists idx_game_created_by on public.game (created_by);

drop trigger if exists trg_game_updated_at on public.game;
create trigger trg_game_updated_at
  before update on public.game
  for each row execute function public.set_updated_at();

-- Helper: is_game_organizer(game_id) - criador do jogo ou admin.
create or replace function public.is_game_organizer(p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.game g where g.id = p_game_id and g.created_by = auth.uid()
  );
$$;

grant execute on function public.is_game_organizer(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- GAME_PLAYER (N:N game ↔ profile)
-- -----------------------------------------------------------------------------
create table if not exists public.game_player (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references public.game (id) on delete cascade,
  player_id  uuid not null references public.profile (id) on delete cascade,
  status     text not null default 'confirmed'
               check (status in ('invited', 'confirmed', 'played', 'no_show')),
  team       text check (team in ('A', 'B')),
  added_at   timestamptz not null default now(),
  unique (game_id, player_id)
);

create index if not exists idx_game_player_game on public.game_player (game_id);
create index if not exists idx_game_player_player on public.game_player (player_id);

alter table public.game_player enable row level security;

-- =============================================================================
-- RLS: GAME
-- =============================================================================
alter table public.game enable row level security;

drop policy if exists "game_select_authenticated" on public.game;
create policy "game_select_authenticated"
  on public.game for select
  to authenticated
  using (true);

drop policy if exists "game_insert_own" on public.game;
create policy "game_insert_own"
  on public.game for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "game_update_organizer" on public.game;
create policy "game_update_organizer"
  on public.game for update
  to authenticated
  using (public.is_game_organizer(id))
  with check (public.is_game_organizer(id));

drop policy if exists "game_delete_organizer" on public.game;
create policy "game_delete_organizer"
  on public.game for delete
  to authenticated
  using (public.is_game_organizer(id));

-- created_by não é editável pelo cliente (GRANT por coluna).
revoke update on public.game from authenticated;
grant update (
  scheduled_at, location, format_id, max_players, status,
  team_a_score, team_b_score, voting_closes_at, notes
) on public.game to authenticated;

-- =============================================================================
-- RLS: GAME_PLAYER
-- =============================================================================
drop policy if exists "gplayer_select_authenticated" on public.game_player;
create policy "gplayer_select_authenticated"
  on public.game_player for select
  to authenticated
  using (true);

-- O organizador gere o plantel; cada jogador pode inscrever-se/sair a si próprio.
drop policy if exists "gplayer_insert" on public.game_player;
create policy "gplayer_insert"
  on public.game_player for insert
  to authenticated
  with check (public.is_game_organizer(game_id) or player_id = auth.uid());

drop policy if exists "gplayer_update" on public.game_player;
create policy "gplayer_update"
  on public.game_player for update
  to authenticated
  using (public.is_game_organizer(game_id) or player_id = auth.uid())
  with check (public.is_game_organizer(game_id) or player_id = auth.uid());

drop policy if exists "gplayer_delete" on public.game_player;
create policy "gplayer_delete"
  on public.game_player for delete
  to authenticated
  using (public.is_game_organizer(game_id) or player_id = auth.uid());
