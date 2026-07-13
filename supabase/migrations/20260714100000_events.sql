-- =============================================================================
-- F3 · Eventos & Tags
-- =============================================================================
-- Modelo orientado a dados: novos tipos de evento e novas tags acrescentam-se
-- por INSERT (sem migração de código). Golos/defesas/etc. suportam tags.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- EVENT_TYPE (lookup)
-- -----------------------------------------------------------------------------
create table if not exists public.event_type (
  id            bigint generated always as identity primary key,
  code          text not null unique,
  label         text not null,
  supports_tags boolean not null default false,
  affects_score boolean not null default false,
  sort_order    int not null default 0,
  active        boolean not null default true
);

comment on table public.event_type is 'Tipos de evento (lookup, extensível sem refatoração).';

insert into public.event_type (code, label, supports_tags, affects_score, sort_order) values
  ('goal',            'Golo',                true,  true,  10),
  ('assist',          'Assistência',         false, false, 20),
  ('save',            'Defesa',              true,  false, 30),
  ('penalty_scored',  'Penálti convertido',  false, true,  40),
  ('penalty_missed',  'Penálti falhado',     false, false, 50),
  ('freekick_scored', 'Livre convertido',    true,  true,  60)
on conflict (code) do nothing;

alter table public.event_type enable row level security;

drop policy if exists "event_type_select_all" on public.event_type;
create policy "event_type_select_all"
  on public.event_type for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- TAG (lookup)
-- -----------------------------------------------------------------------------
create table if not exists public.tag (
  id         bigint generated always as identity primary key,
  code       text not null unique,
  label      text not null,
  category   text,
  sort_order int not null default 0
);

comment on table public.tag is 'Tags de eventos (ex.: bicicleta, cabeceamento, pé esquerdo).';

insert into public.tag (code, label, category, sort_order) values
  ('bicycle',    'Bicicleta',       'technique', 10),
  ('header',     'Cabeceamento',    'technique', 20),
  ('left_foot',  'Pé esquerdo',     'foot',      30),
  ('right_foot', 'Pé direito',      'foot',      40),
  ('volley',     'Voleio',          'technique', 50),
  ('long_shot',  'Remate de longe', 'technique', 60)
on conflict (code) do nothing;

alter table public.tag enable row level security;

drop policy if exists "tag_select_all" on public.tag;
create policy "tag_select_all"
  on public.tag for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- EVENT
-- -----------------------------------------------------------------------------
create table if not exists public.event (
  id            uuid primary key default gen_random_uuid(),
  game_id       uuid not null references public.game (id) on delete cascade,
  player_id     uuid not null references public.profile (id) on delete cascade,
  event_type_id bigint not null references public.event_type (id),
  minute        int check (minute is null or (minute >= 0 and minute <= 200)),
  team          text check (team in ('A', 'B')),
  meta          jsonb not null default '{}'::jsonb,
  created_by    uuid not null references public.profile (id),
  created_at    timestamptz not null default now()
);

comment on table public.event is 'Eventos de jogo (golo, assistência, defesa, …). meta guarda info adicional flexível.';

create index if not exists idx_event_game on public.event (game_id);
create index if not exists idx_event_player on public.event (player_id);
create index if not exists idx_event_type on public.event (event_type_id);

alter table public.event enable row level security;

drop policy if exists "event_select_authenticated" on public.event;
create policy "event_select_authenticated"
  on public.event for select
  to authenticated
  using (true);

-- Registo/remoção de eventos: organizador ou admin do jogo.
drop policy if exists "event_insert_organizer" on public.event;
create policy "event_insert_organizer"
  on public.event for insert
  to authenticated
  with check (public.is_game_organizer(game_id) and created_by = auth.uid());

drop policy if exists "event_delete_organizer" on public.event;
create policy "event_delete_organizer"
  on public.event for delete
  to authenticated
  using (public.is_game_organizer(game_id));

-- -----------------------------------------------------------------------------
-- EVENT_TAG (N:N event ↔ tag)
-- -----------------------------------------------------------------------------
create table if not exists public.event_tag (
  event_id uuid   not null references public.event (id) on delete cascade,
  tag_id   bigint not null references public.tag (id) on delete cascade,
  primary key (event_id, tag_id)
);

alter table public.event_tag enable row level security;

drop policy if exists "event_tag_select_authenticated" on public.event_tag;
create policy "event_tag_select_authenticated"
  on public.event_tag for select
  to authenticated
  using (true);

-- Escrita de tags segue a autorização do evento associado.
drop policy if exists "event_tag_write_organizer" on public.event_tag;
create policy "event_tag_write_organizer"
  on public.event_tag for all
  to authenticated
  using (
    exists (
      select 1 from public.event e
      where e.id = event_id and public.is_game_organizer(e.game_id)
    )
  )
  with check (
    exists (
      select 1 from public.event e
      where e.id = event_id and public.is_game_organizer(e.game_id)
    )
  );
