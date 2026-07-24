-- =============================================================================
-- Grupos · públicos vs privados
-- =============================================================================
-- Um grupo público aparece numa lista que qualquer autenticado pode ver e
-- entra-se diretamente (sem código). Privado (omissão) mantém-se por código/
-- convite, como até aqui. A visibilidade pode ser alternada por um admin do
-- grupo a qualquer momento.
-- =============================================================================

alter table public.app_group
  add column if not exists visibility text not null default 'private'
    check (visibility in ('public', 'private'));

-- SELECT já tinha "membro vê o seu grupo" (app_group_select_member); esta
-- policy é ADITIVA (múltiplas policies permissivas juntam-se por OR) - dá
-- visibilidade extra a grupos públicos, mesmo a quem ainda não é membro.
drop policy if exists "app_group_select_public" on public.app_group;
create policy "app_group_select_public"
  on public.app_group for select to authenticated
  using (visibility = 'public');

-- -----------------------------------------------------------------------------
-- create_group ganha p_visibility (omissão 'private', preserva o comportamento
-- atual). Assinatura muda (novo parâmetro) → recriar.
-- -----------------------------------------------------------------------------
drop function if exists public.create_group(text);

create or replace function public.create_group(p_name text, p_visibility text default 'private')
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
  if p_visibility not in ('public', 'private') then
    raise exception 'Visibilidade inválida.';
  end if;

  loop
    v_code := public.generate_group_code();
    exit when not exists (select 1 from public.app_group where invite_code = v_code);
  end loop;

  insert into public.app_group (name, invite_code, created_by, visibility)
  values (trim(p_name), v_code, auth.uid(), p_visibility)
  returning id into v_id;

  insert into public.group_member (group_id, player_id, role) values (v_id, auth.uid(), 'admin');

  update public.profile set active_group_id = v_id where id = auth.uid();

  return v_id;
end $$;

grant execute on function public.create_group(text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Entra diretamente num grupo público (sem código). Idempotente.
-- -----------------------------------------------------------------------------
create or replace function public.join_public_group(p_group_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sem sessão.';
  end if;
  if not exists (
    select 1 from public.app_group where id = p_group_id and visibility = 'public'
  ) then
    raise exception 'Grupo inexistente ou não é público.';
  end if;

  insert into public.group_member (group_id, player_id, role)
  values (p_group_id, auth.uid(), 'member')
  on conflict do nothing;

  update public.profile set active_group_id = p_group_id where id = auth.uid();
end $$;

grant execute on function public.join_public_group(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Alterna público/privado. Só admins do grupo.
-- -----------------------------------------------------------------------------
create or replace function public.set_group_visibility(p_group_id uuid, p_visibility text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'Sem permissão para gerir este grupo.';
  end if;
  if p_visibility not in ('public', 'private') then
    raise exception 'Visibilidade inválida.';
  end if;
  update public.app_group set visibility = p_visibility where id = p_group_id;
end $$;

grant execute on function public.set_group_visibility(uuid, text) to authenticated;
