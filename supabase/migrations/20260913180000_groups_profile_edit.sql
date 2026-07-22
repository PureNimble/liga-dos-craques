-- =============================================================================
-- Grupos · editar nome e foto
-- =============================================================================
-- Um admin do grupo pode renomear e definir uma foto (avatar) do grupo, no
-- mesmo padrão do avatar de perfil (bucket público, upload direto do
-- browser, path prefixado pelo dono — aqui o group_id em vez do user_id).
-- =============================================================================

alter table public.app_group
  add column if not exists photo_url text;

-- -----------------------------------------------------------------------------
-- Atualiza nome/foto do grupo. Só admins do grupo.
-- -----------------------------------------------------------------------------
create or replace function public.update_group(p_group_id uuid, p_name text, p_photo_url text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'Sem permissão para gerir este grupo.';
  end if;
  update public.app_group
  set name = trim(p_name), photo_url = p_photo_url
  where id = p_group_id;
end $$;

grant execute on function public.update_group(uuid, text, text) to authenticated;

-- =============================================================================
-- STORAGE: bucket `group-avatars`
-- =============================================================================
insert into storage.buckets (id, name, public)
values ('group-avatars', 'group-avatars', true)
on conflict (id) do nothing;

-- Leitura pública (bucket público, só fotos de grupo).
drop policy if exists "group_avatars_read_public" on storage.objects;
create policy "group_avatars_read_public"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'group-avatars');

-- Escrita: só o admin do grupo dono da pasta (path começa por <group_id>/...).
drop policy if exists "group_avatars_write_admin" on storage.objects;
create policy "group_avatars_write_admin"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'group-avatars'
    and public.is_group_admin(((storage.foldername(name))[1])::uuid)
  );

drop policy if exists "group_avatars_update_admin" on storage.objects;
create policy "group_avatars_update_admin"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'group-avatars' and public.is_group_admin(((storage.foldername(name))[1])::uuid))
  with check (bucket_id = 'group-avatars' and public.is_group_admin(((storage.foldername(name))[1])::uuid));

drop policy if exists "group_avatars_delete_admin" on storage.objects;
create policy "group_avatars_delete_admin"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'group-avatars' and public.is_group_admin(((storage.foldername(name))[1])::uuid));
