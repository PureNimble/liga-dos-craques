-- =============================================================================
-- Admin: repor password de um utilizador + promover o admin inicial
-- =============================================================================
-- Sem dependência de email: um admin pode definir a password de qualquer
-- utilizador. A password é guardada com bcrypt (compatível com o GoTrue).
-- =============================================================================

create extension if not exists pgcrypto with schema extensions;

create or replace function public.admin_set_password(p_user_id uuid, p_password text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores.';
  end if;
  if p_password is null or length(p_password) < 8 then
    raise exception 'A password deve ter pelo menos 8 caracteres.';
  end if;

  update auth.users
  set
    encrypted_password = extensions.crypt(p_password, extensions.gen_salt('bf')),
    email_confirmed_at = coalesce(email_confirmed_at, now()),
    updated_at = now()
  where id = p_user_id;

  if not found then
    raise exception 'Utilizador não encontrado.';
  end if;
end $$;

grant execute on function public.admin_set_password(uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Promover o admin inicial (conta única de administração).
-- -----------------------------------------------------------------------------
update public.profile
set role = 'admin'
where id in (select id from auth.users where lower(email) = 'vscosousa@gmail.com');
