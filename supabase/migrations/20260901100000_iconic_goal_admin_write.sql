-- =============================================================================
-- Gestão de golos icónicos pela app (dashboard de admin)
-- =============================================================================
-- Até aqui os golos entravam só por migração. O admin passa a poder criar e
-- editar golos pela interface. Escrita restrita a is_admin() via RLS; a leitura
-- continua aberta a todos os autenticados. Não há delete: desativa-se com
-- active=false (apagar arrastaria em cascata os replicados dos jogadores).
--
-- Nota: golos criados pela app vivem só na BD - não ficam versionados em
-- migrações, por isso um `db reset` local não os traz de volta.
-- =============================================================================

drop policy if exists "iconic_goal_admin_insert" on public.iconic_goal;
create policy "iconic_goal_admin_insert"
  on public.iconic_goal for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "iconic_goal_admin_update" on public.iconic_goal;
create policy "iconic_goal_admin_update"
  on public.iconic_goal for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant insert, update on public.iconic_goal to authenticated;
