-- =============================================================================
-- Gestão de jogadores pelo admin (dashboard)
-- =============================================================================
-- Permite ao admin editar campos não sensíveis de qualquer perfil (nome,
-- posição, etc.) e mudar a função (player/admin). Os dados sensíveis continuam
-- isolados em profile_private (só o dono lê/escreve) e a coluna `role` continua
-- sem GRANT ao cliente - só muda pela RPC abaixo.
-- =============================================================================

-- 1. Update por admin nas colunas já concedidas (name, main_position_id, …).
--    `role` e `id` não têm GRANT a authenticated, por isso esta política não os
--    alcança - a escalada de privilégios continua bloqueada.
drop policy if exists "profile_admin_update" on public.profile;
create policy "profile_admin_update"
  on public.profile for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- 2. Mudar a função de um jogador - só admin, e nunca a própria (evita ficar
--    sem acesso por engano). SECURITY DEFINER para contornar o GRANT por coluna.
create or replace function public.admin_set_role(p_user_id uuid, p_role text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas admin';
  end if;
  if p_role not in ('player', 'admin') then
    raise exception 'Função inválida';
  end if;
  if p_user_id = auth.uid() then
    raise exception 'Não podes mudar a tua própria função';
  end if;
  update public.profile set role = p_role where id = p_user_id;
end $$;

grant execute on function public.admin_set_role(uuid, text) to authenticated;
