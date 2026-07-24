-- =============================================================================
-- P1.4 · Administração - editar regras de XP (versionadas)
-- =============================================================================
-- Alterar uma regra de XP NUNCA edita a antiga: fecha-a (valid_to/active=false)
-- e cria uma nova versão. O histórico (xp_ledger aponta para xp_rule_id) fica
-- intacto. Só admin.
-- =============================================================================

create or replace function public.set_xp_rule(p_code text, p_points int)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores.';
  end if;

  update public.xp_rule
  set active = false, valid_to = now()
  where code = p_code and active;

  insert into public.xp_rule (code, points, valid_from, active)
  values (p_code, p_points, now(), true);
end $$;

grant execute on function public.set_xp_rule(text, int) to authenticated;
