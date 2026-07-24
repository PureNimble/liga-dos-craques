-- =============================================================================
-- O admin deixa de editar dados de jogadores
-- =============================================================================
-- Sobre um jogador, o admin só promove/despromove (`admin_set_role`). O nome, a
-- posição e o resto do perfil são do próprio - nem por engano nem por atalho de
-- gestão. Reverte a política aberta em 20260902100000_admin_player_management.
--
-- Fica de pé: `profile_update_own` (o dono edita-se) e a RPC `admin_set_role`.
-- =============================================================================

drop policy if exists "profile_admin_update" on public.profile;
