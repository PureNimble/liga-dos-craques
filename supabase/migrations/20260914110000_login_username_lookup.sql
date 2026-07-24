-- =============================================================================
-- Login por username - o Supabase Auth só autentica por email
-- (signInWithPassword não aceita username), por isso o login resolve o
-- username para o email correspondente antes de autenticar. Corre como
-- `anon` (ainda sem sessão), daí o security definer para ler auth.users.
-- Devolve null em vez de erro para não confirmar/negar a existência do
-- username a quem não tem sessão.
-- =============================================================================

create or replace function public.get_email_by_username(p_username text)
returns text
language sql
stable
security definer
set search_path = public
as $$
  select u.email
  from auth.users u
  join public.profile p on p.id = u.id
  where p.username = lower(trim(p_username))
  limit 1;
$$;

grant execute on function public.get_email_by_username(text) to anon, authenticated;
