-- =============================================================================
-- F1 · Perfis e posições
-- =============================================================================
-- Cria a identidade de domínio (profile) ligada a auth.users, as posições
-- (lookup) e as posições secundárias (N:N). Inclui:
--   - trigger que cria automaticamente o profile no signup
--   - RLS em todas as tabelas
--   - GRANTs por coluna (impede escalada de privilégios via `role`)
--   - bucket de Storage `avatars` com políticas por dono
-- =============================================================================

-- -----------------------------------------------------------------------------
-- POSITION (lookup) — populado pelo seed. Sem escrita por clientes.
-- -----------------------------------------------------------------------------
create table if not exists public.position (
  id         bigint generated always as identity primary key,
  code       text not null unique,
  label      text not null,
  category   text not null check (category in ('GK', 'DEF', 'MID', 'FWD')),
  sort_order int  not null default 0
);

comment on table public.position is 'Posições de jogo (lookup). Populado por esta migração.';

-- Dados de referência: vão na migração (e não só no seed) para chegarem também
-- a produção, onde `supabase db push` aplica migrações mas NÃO corre o seed.
insert into public.position (code, label, category, sort_order) values
  ('GK', 'Guarda-redes',     'GK',  10),
  ('CB', 'Defesa central',   'DEF', 20),
  ('RB', 'Lateral direito',  'DEF', 21),
  ('LB', 'Lateral esquerdo', 'DEF', 22),
  ('DM', 'Médio defensivo',  'MID', 30),
  ('CM', 'Médio centro',     'MID', 31),
  ('AM', 'Médio ofensivo',   'MID', 32),
  ('RW', 'Extremo direito',  'FWD', 40),
  ('LW', 'Extremo esquerdo', 'FWD', 41),
  ('ST', 'Ponta de lança',   'FWD', 42)
on conflict (code) do nothing;

alter table public.position enable row level security;

drop policy if exists "position_select_all" on public.position;
create policy "position_select_all"
  on public.position for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- PROFILE — 1:1 com auth.users.
-- -----------------------------------------------------------------------------
create table if not exists public.profile (
  id               uuid primary key references auth.users (id) on delete cascade,
  name             text not null default '',
  photo_url        text,
  birth_date       date,
  weight_kg        numeric(5, 1) check (weight_kg is null or (weight_kg > 0 and weight_kg < 400)),
  height_cm        integer check (height_cm is null or (height_cm > 0 and height_cm < 300)),
  gender           text check (gender in ('male', 'female', 'other', 'prefer_not')),
  locality         text,
  preferred_foot   text check (preferred_foot in ('left', 'right', 'both')),
  main_position_id bigint references public.position (id) on delete set null,
  role             text not null default 'player' check (role in ('player', 'admin')),
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table public.profile is 'Perfil do jogador (1:1 com auth.users).';
comment on column public.profile.role is 'player | admin. NUNCA editável pelo próprio (ver GRANTs por coluna).';

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_profile_updated_at on public.profile;
create trigger trg_profile_updated_at
  before update on public.profile
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- SECONDARY_POSITION (N:N profile ↔ position)
-- -----------------------------------------------------------------------------
create table if not exists public.secondary_position (
  profile_id  uuid   not null references public.profile (id) on delete cascade,
  position_id bigint not null references public.position (id) on delete cascade,
  primary key (profile_id, position_id)
);

alter table public.secondary_position enable row level security;

-- -----------------------------------------------------------------------------
-- Trigger: criar profile automaticamente quando nasce um auth.users.
-- SECURITY DEFINER (corre como owner → contorna RLS de forma controlada).
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profile (id, name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =============================================================================
-- RLS: PROFILE
-- =============================================================================
alter table public.profile enable row level security;

-- Leitura: todos os autenticados veem todos os perfis (são amigos; a app mostra
-- estatísticas e atributos de cada jogador). Ver nota de privacidade no README.
drop policy if exists "profile_select_authenticated" on public.profile;
create policy "profile_select_authenticated"
  on public.profile for select
  to authenticated
  using (true);

-- Escrita: cada um só altera o SEU perfil.
drop policy if exists "profile_update_own" on public.profile;
create policy "profile_update_own"
  on public.profile for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- (INSERT é feito pelo trigger; não concedemos INSERT direto a clientes.)

-- Impede escalada de privilégios: o cliente NÃO pode escrever `role` nem `id`.
-- GRANTs por coluna restringem que colunas o role `authenticated` pode atualizar.
revoke update on public.profile from authenticated;
grant update (
  name, photo_url, birth_date, weight_kg, height_cm,
  gender, locality, preferred_foot, main_position_id
) on public.profile to authenticated;

-- =============================================================================
-- RLS: SECONDARY_POSITION
-- =============================================================================
drop policy if exists "secpos_select_authenticated" on public.secondary_position;
create policy "secpos_select_authenticated"
  on public.secondary_position for select
  to authenticated
  using (true);

drop policy if exists "secpos_write_own" on public.secondary_position;
create policy "secpos_write_own"
  on public.secondary_position for all
  to authenticated
  using (auth.uid() = profile_id)
  with check (auth.uid() = profile_id);

-- =============================================================================
-- STORAGE: bucket `avatars`
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- Leitura pública (bucket público, só fotos de perfil).
drop policy if exists "avatars_read_public" on storage.objects;
create policy "avatars_read_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

-- Escrita: cada um só escreve na SUA pasta (path começa por <user_id>/...).
drop policy if exists "avatars_write_own" on storage.objects;
create policy "avatars_write_own"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "avatars_update_own" on storage.objects;
create policy "avatars_update_own"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "avatars_delete_own" on storage.objects;
create policy "avatars_delete_own"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
