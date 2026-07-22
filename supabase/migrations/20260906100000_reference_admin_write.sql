-- =============================================================================
-- Gestão de dados de referência pelo admin (renomear + reordenar)
-- =============================================================================
-- Deixa o admin corrigir rótulos e ordenar as tabelas de referência (formatos,
-- posições, tipos de evento, tags) pela interface. Só label/sort_order — os
-- campos estruturais (players_per_side, category, affects_score, …) alteram a
-- lógica do jogo e continuam a viver em migrações. Escrita restrita a is_admin().
-- =============================================================================

do $$
declare
  t text;
begin
  foreach t in array array['game_format', 'position', 'event_type', 'tag'] loop
    execute format('drop policy if exists "%1$s_admin_update" on public.%1$s', t);
    execute format(
      'create policy "%1$s_admin_update" on public.%1$s for update to authenticated '
      'using (public.is_admin()) with check (public.is_admin())', t);
    execute format('grant update (label, sort_order) on public.%1$s to authenticated', t);
  end loop;
end $$;
