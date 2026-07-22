-- =============================================================================
-- Gestão de conquistas pelo admin (dashboard)
-- =============================================================================
-- Até aqui as conquistas entravam só por migração. O admin passa a criar/editar
-- pela interface. Escrita restrita a is_admin() via RLS; leitura continua aberta.
-- Depois de alterar critérios, correr "Recalcular progressão" (backfill) para
-- reavaliar os jogadores. Conquistas criadas pela app vivem só na BD.
-- =============================================================================

drop policy if exists "achievement_admin_insert" on public.achievement;
create policy "achievement_admin_insert"
  on public.achievement for insert
  to authenticated
  with check (public.is_admin());

drop policy if exists "achievement_admin_update" on public.achievement;
create policy "achievement_admin_update"
  on public.achievement for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

grant insert, update on public.achievement to authenticated;
