-- =============================================================================
-- P2 · Privacidade do perfil
-- =============================================================================
-- Move os campos sensíveis (data de nascimento, peso, altura) para uma tabela
-- própria visível APENAS ao dono (RLS). Os restantes campos do perfil continuam
-- legíveis por todos os autenticados (é uma app entre amigos).
-- =============================================================================

create table if not exists public.profile_private (
  id         uuid primary key references public.profile (id) on delete cascade,
  birth_date date,
  weight_kg  numeric(5, 1) check (weight_kg is null or (weight_kg > 0 and weight_kg < 400)),
  height_cm  integer check (height_cm is null or (height_cm > 0 and height_cm < 300))
);

comment on table public.profile_private is 'Dados sensíveis do perfil, visíveis só ao próprio (RLS).';

-- Migrar dados existentes.
insert into public.profile_private (id, birth_date, weight_kg, height_cm)
select id, birth_date, weight_kg, height_cm from public.profile
on conflict (id) do nothing;

alter table public.profile_private enable row level security;

drop policy if exists "profile_private_select_own" on public.profile_private;
create policy "profile_private_select_own"
  on public.profile_private for select to authenticated using (id = auth.uid());

drop policy if exists "profile_private_insert_own" on public.profile_private;
create policy "profile_private_insert_own"
  on public.profile_private for insert to authenticated with check (id = auth.uid());

drop policy if exists "profile_private_update_own" on public.profile_private;
create policy "profile_private_update_own"
  on public.profile_private for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Passar a criar também a linha privada no signup.
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

  insert into public.profile_private (id) values (new.id) on conflict (id) do nothing;
  return new;
end $$;

-- Remover as colunas sensíveis do perfil público (dados já migrados).
alter table public.profile drop column if exists birth_date;
alter table public.profile drop column if exists weight_kg;
alter table public.profile drop column if exists height_cm;
