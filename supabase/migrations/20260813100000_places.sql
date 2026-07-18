-- =============================================================================
-- Campos (places) — mapa por distrito
-- =============================================================================
-- Lista de campos conhecidos pelo grupo, puramente informativa (sem reserva).
-- =============================================================================

create type public.district as enum (
  'Aveiro', 'Beja', 'Braga', 'Bragança', 'Castelo Branco', 'Coimbra', 'Évora',
  'Faro', 'Guarda', 'Leiria', 'Lisboa', 'Portalegre', 'Porto', 'Santarém',
  'Setúbal', 'Viana do Castelo', 'Vila Real', 'Viseu', 'Açores', 'Madeira'
);

create table if not exists public.place (
  id          uuid primary key default gen_random_uuid(),
  created_by  uuid not null references public.profile (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 120),
  district    public.district not null,
  latitude    double precision not null check (latitude between -90 and 90),
  longitude   double precision not null check (longitude between -180 and 180),
  url         text check (url is null or char_length(url) <= 500),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.place is 'Campos conhecidos pelo grupo, por distrito — só informativo, sem reserva.';

create index if not exists idx_place_district on public.place (district);

drop trigger if exists trg_place_updated_at on public.place;
create trigger trg_place_updated_at
  before update on public.place
  for each row execute function public.set_updated_at();

-- =============================================================================
-- RLS: PLACE
-- =============================================================================
alter table public.place enable row level security;

drop policy if exists "place_select_authenticated" on public.place;
create policy "place_select_authenticated"
  on public.place for select
  to authenticated
  using (true);

drop policy if exists "place_insert_own" on public.place;
create policy "place_insert_own"
  on public.place for insert
  to authenticated
  with check (created_by = auth.uid());

drop policy if exists "place_update_own" on public.place;
create policy "place_update_own"
  on public.place for update
  to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

drop policy if exists "place_delete_own" on public.place;
create policy "place_delete_own"
  on public.place for delete
  to authenticated
  using (created_by = auth.uid());

-- created_by não é editável pelo cliente (GRANT por coluna).
revoke update on public.place from authenticated;
grant update (name, district, latitude, longitude, url) on public.place to authenticated;
