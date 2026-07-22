-- =============================================================================
-- Grupos · promoção a admin e proteção do último admin
-- =============================================================================
-- Um admin pode promover outro membro a admin. Sair do grupo (ou ser
-- removido) fica bloqueado se isso deixasse o grupo sem nenhum admin e ainda
-- com outros membros lá dentro — força a transferência de posse antes de
-- sair. Se o admin for o único membro (ninguém para "ficar sem admin"),
-- sair continua permitido.
-- =============================================================================

create or replace function public.is_last_group_admin(p_group_id uuid, p_player_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    exists (
      select 1 from public.group_member
      where group_id = p_group_id and player_id = p_player_id and role = 'admin'
    )
    and (select count(*) from public.group_member where group_id = p_group_id and role = 'admin') = 1
    and (select count(*) from public.group_member where group_id = p_group_id) > 1;
$$;

grant execute on function public.is_last_group_admin(uuid, uuid) to authenticated;

-- Sair/remover passa a falhar (0 linhas afetadas, sem erro — RLS filtra a
-- linha) quando a vítima é o último admin de um grupo com outros membros.
drop policy if exists "group_member_delete" on public.group_member;
create policy "group_member_delete"
  on public.group_member for delete to authenticated
  using (
    (player_id = auth.uid() or public.is_group_admin(group_id))
    and not public.is_last_group_admin(group_id, player_id)
  );

-- -----------------------------------------------------------------------------
-- Promove um membro a admin. Só admins do grupo.
-- -----------------------------------------------------------------------------
create or replace function public.promote_group_member(p_group_id uuid, p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'Sem permissão para gerir este grupo.';
  end if;

  update public.group_member
  set role = 'admin'
  where group_id = p_group_id and player_id = p_player_id;

  if not found then
    raise exception 'Jogador não pertence a este grupo.';
  end if;
end $$;

grant execute on function public.promote_group_member(uuid, uuid) to authenticated;
