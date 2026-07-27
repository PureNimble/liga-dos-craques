-- Nomeia cada lado de um jogo (A/B): criados automaticamente com o jogo,
-- editáveis (nome/logótipo) pelo organizador ou admin.

create table if not exists public.game_team (
  id         uuid primary key default gen_random_uuid(),
  game_id    uuid not null references public.game (id) on delete cascade,
  side       text not null check (side in ('A', 'B')),
  name       text,
  logo_url   text,
  created_at timestamptz not null default now(),
  unique (game_id, side)
);

alter table public.game_team enable row level security;

-- Leitura aberta a autenticados, tal como `game`/`game_player`.
drop policy if exists "game_team_select_authenticated" on public.game_team;
create policy "game_team_select_authenticated"
  on public.game_team for select
  to authenticated
  using (true);

-- Só o organizador do jogo (ou admin) edita nome/logótipo.
drop policy if exists "game_team_update_organizer" on public.game_team;
create policy "game_team_update_organizer"
  on public.game_team for update
  to authenticated
  using (public.is_game_organizer(game_id))
  with check (public.is_game_organizer(game_id));

-- `game_id`/`side` não são editáveis pelo cliente (GRANT por coluna).
revoke update on public.game_team from authenticated;
grant select on public.game_team to authenticated;
grant update (name, logo_url) on public.game_team to authenticated;

-- Cria as duas equipas (A/B) no instante em que o jogo é criado.
create or replace function public.create_default_game_teams()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.game_team (game_id, side, name) values
    (new.id, 'A', 'Equipa A'),
    (new.id, 'B', 'Equipa B');
  return new;
end;
$$;

drop trigger if exists trg_create_default_game_teams on public.game;
create trigger trg_create_default_game_teams
  after insert on public.game
  for each row execute function public.create_default_game_teams();

-- =============================================================================
-- STORAGE: bucket `game-team-logos` (caminho: <game_id>/<side>.webp)
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('game-team-logos', 'game-team-logos', true)
on conflict (id) do nothing;

drop policy if exists "game_team_logos_read_public" on storage.objects;
create policy "game_team_logos_read_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'game-team-logos');

drop policy if exists "game_team_logos_write_organizer" on storage.objects;
create policy "game_team_logos_write_organizer"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'game-team-logos'
    and public.is_game_organizer(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "game_team_logos_update_organizer" on storage.objects;
create policy "game_team_logos_update_organizer"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'game-team-logos'
    and public.is_game_organizer(((storage.foldername(name))[1])::uuid)
  )
  with check (
    bucket_id = 'game-team-logos'
    and public.is_game_organizer(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "game_team_logos_delete_organizer" on storage.objects;
create policy "game_team_logos_delete_organizer"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'game-team-logos'
    and public.is_game_organizer(((storage.foldername(name))[1])::uuid)
  );
