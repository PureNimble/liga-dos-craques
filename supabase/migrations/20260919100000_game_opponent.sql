-- =============================================================================
-- Game: adversário (clube externo) e casa/fora
-- =============================================================================
-- opponent_name é texto livre (não há tabela de clubes); is_home é opcional -
-- null quando o organizador não indicou.
-- =============================================================================

alter table public.game
  add column if not exists opponent_name text,
  add column if not exists is_home boolean;

comment on column public.game.opponent_name is 'Nome do clube adversário, texto livre - opcional.';
comment on column public.game.is_home is 'Jogo em casa (true) ou fora (false); null quando não indicado.';

grant update (opponent_name, is_home) on public.game to authenticated;
