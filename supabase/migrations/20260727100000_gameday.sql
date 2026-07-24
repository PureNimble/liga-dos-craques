-- =============================================================================
-- GAME-DAY: cronómetro em direto, autogolo e posições no campo
-- =============================================================================
-- Suporta:
--   1. Cronómetro do jogo (started_at) - marcado quando entra "in_progress".
--   2. Tipo de evento "autogolo" - soma ao adversário, NÃO conta como golo do
--      jogador (as estatísticas só contam event_type.code = 'goal').
--   3. Posição de cada jogador no campo (pos_x/pos_y em %) - para o alinhamento
--      visual (auto-preenchido por posição e ajustável manualmente).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Cronómetro: game.started_at
-- -----------------------------------------------------------------------------
alter table public.game
  add column if not exists started_at timestamptz;

comment on column public.game.started_at is
  'Início efetivo do jogo (entrada em in_progress). Base do cronómetro em direto.';

-- Grant por coluna é aditivo: basta conceder a nova coluna.
grant update (started_at) on public.game to authenticated;

-- -----------------------------------------------------------------------------
-- 2. Tipo de evento: autogolo
-- -----------------------------------------------------------------------------
-- affects_score = true (conta para o placar do adversário) mas code <> 'goal',
-- por isso nunca entra nas estatísticas de golos do jogador.
insert into public.event_type (code, label, supports_tags, affects_score, sort_order) values
  ('own_goal', 'Autogolo', false, true, 45)
on conflict (code) do nothing;

-- -----------------------------------------------------------------------------
-- 3. Posição no campo: game_player.pos_x / pos_y (0–100, percentagem)
-- -----------------------------------------------------------------------------
alter table public.game_player
  add column if not exists pos_x smallint check (pos_x is null or (pos_x between 0 and 100)),
  add column if not exists pos_y smallint check (pos_y is null or (pos_y between 0 and 100));

comment on column public.game_player.pos_x is 'Posição horizontal no campo (0–100 %). NULL = por colocar.';
comment on column public.game_player.pos_y is 'Posição vertical no campo (0–100 %). NULL = por colocar.';

-- game_player não tem grant de update por coluna (RLS já restringe ao
-- organizador/próprio), logo as novas colunas ficam desde já editáveis.
