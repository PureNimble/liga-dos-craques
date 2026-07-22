-- =============================================================================
-- Grupos · núcleo (grupo, membros, ligação ao perfil ativo)
-- =============================================================================
-- Um grupo é um círculo de amigos que organiza jogos entre si. Um utilizador
-- pode pertencer a vários grupos; `profile.active_group_id` guarda qual está
-- ativo (persistido no servidor, sobrevive entre dispositivos). Toda a escrita
-- em app_group/group_member passa por RPCs security definer — sem INSERT/
-- UPDATE direto por clientes (evita, por exemplo, alguém inserir-se a si
-- próprio como admin de um grupo arbitrário).
--
-- Nome da tabela: `app_group`, não `group` — é palavra reservada em SQL e
-- obrigaria a citá-la em todas as migrações/políticas seguintes.
-- =============================================================================

create table if not exists public.app_group (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(trim(name)) between 2 and 60),
  invite_code text not null unique,
  created_by  uuid not null references public.profile (id),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.app_group is 'Grupo de amigos. Escrita só por RPCs (create_group/join_group_by_code/…).';

drop trigger if exists trg_app_group_updated_at on public.app_group;
create trigger trg_app_group_updated_at
  before update on public.app_group
  for each row execute function public.set_updated_at();

create table if not exists public.group_member (
  group_id  uuid not null references public.app_group (id) on delete cascade,
  player_id uuid not null references public.profile (id) on delete cascade,
  role      text not null default 'member' check (role in ('member', 'admin')),
  joined_at timestamptz not null default now(),
  primary key (group_id, player_id)
);

create index if not exists idx_group_member_player on public.group_member (player_id);

comment on table public.group_member is 'Pertença a um grupo. role admin gere membros/convites/código; member participa.';

-- -----------------------------------------------------------------------------
-- Helpers de autorização (mesma forma de is_admin()/is_game_organizer()).
-- is_admin() é sempre um bypass — o admin global vê/gere qualquer grupo.
-- -----------------------------------------------------------------------------
create or replace function public.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.group_member
    where group_id = p_group_id and player_id = auth.uid()
  );
$$;

grant execute on function public.is_group_member(uuid) to authenticated;

create or replace function public.is_group_admin(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.group_member
    where group_id = p_group_id and player_id = auth.uid() and role = 'admin'
  );
$$;

grant execute on function public.is_group_admin(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Grupo ativo do utilizador (qual está a ver/usar agora). Só as RPCs abaixo
-- escrevem — não entra nos GRANTs por coluna de profile.
-- -----------------------------------------------------------------------------
alter table public.profile
  add column if not exists active_group_id uuid references public.app_group (id) on delete set null;

-- =============================================================================
-- RLS
-- =============================================================================
alter table public.app_group enable row level security;

drop policy if exists "app_group_select_member" on public.app_group;
create policy "app_group_select_member"
  on public.app_group for select to authenticated
  using (public.is_group_member(id));

-- Sem INSERT/UPDATE/DELETE diretos: create_group/regenerate_invite_code tratam disto.
revoke insert, update, delete on public.app_group from authenticated;

alter table public.group_member enable row level security;

drop policy if exists "group_member_select" on public.group_member;
create policy "group_member_select"
  on public.group_member for select to authenticated
  using (public.is_group_member(group_id));

-- Sair do grupo (a própria linha) ou remover um membro (admin do grupo) — a
-- mesma policy cobre "sair" e "remover", sem precisar de RPCs dedicadas.
drop policy if exists "group_member_delete" on public.group_member;
create policy "group_member_delete"
  on public.group_member for delete to authenticated
  using (player_id = auth.uid() or public.is_group_admin(group_id));

-- Sem INSERT/UPDATE diretos: create_group/join_group_by_code/accept_group_invite
-- inserem como security definer.
revoke insert, update on public.group_member from authenticated;

-- -----------------------------------------------------------------------------
-- RPCs
-- -----------------------------------------------------------------------------

-- Código de convite: 8 carateres de um alfabeto sem ambiguidade (sem 0/O/1/I).
create or replace function public.generate_group_code()
returns text
language sql
volatile
as $$
  select string_agg(substr('ABCDEFGHJKMNPQRSTUVWXYZ23456789', (floor(random() * 32) + 1)::int, 1), '')
  from generate_series(1, 8);
$$;

-- Cria o grupo, torna o criador admin e define-o como grupo ativo. Devolve o id.
create or replace function public.create_group(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_code text;
begin
  if auth.uid() is null then
    raise exception 'Sem sessão.';
  end if;

  loop
    v_code := public.generate_group_code();
    exit when not exists (select 1 from public.app_group where invite_code = v_code);
  end loop;

  insert into public.app_group (name, invite_code, created_by)
  values (trim(p_name), v_code, auth.uid())
  returning id into v_id;

  insert into public.group_member (group_id, player_id, role) values (v_id, auth.uid(), 'admin');

  update public.profile set active_group_id = v_id where id = auth.uid();

  return v_id;
end $$;

grant execute on function public.create_group(text) to authenticated;

-- Entra num grupo pelo código de convite (direto, sem aprovação). Idempotente
-- se já for membro (só muda o grupo ativo).
create or replace function public.join_group_by_code(p_code text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Sem sessão.';
  end if;

  select id into v_group_id from public.app_group where invite_code = upper(trim(p_code));
  if v_group_id is null then
    raise exception 'Código inválido.';
  end if;

  insert into public.group_member (group_id, player_id, role)
  values (v_group_id, auth.uid(), 'member')
  on conflict do nothing;

  update public.profile set active_group_id = v_group_id where id = auth.uid();

  return v_group_id;
end $$;

grant execute on function public.join_group_by_code(text) to authenticated;

-- Gera um novo código de convite (invalida o anterior). Só admins do grupo.
create or replace function public.regenerate_invite_code(p_group_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'Sem permissão para gerir este grupo.';
  end if;

  loop
    v_code := public.generate_group_code();
    exit when not exists (select 1 from public.app_group where invite_code = v_code);
  end loop;

  update public.app_group set invite_code = v_code where id = p_group_id;
  return v_code;
end $$;

grant execute on function public.regenerate_invite_code(uuid) to authenticated;

-- Muda o grupo ativo do utilizador (tem de já ser membro).
create or replace function public.set_active_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_group_member(p_group_id) then
    raise exception 'Não pertences a este grupo.';
  end if;
  update public.profile set active_group_id = p_group_id where id = auth.uid();
end $$;

grant execute on function public.set_active_group(uuid) to authenticated;
