-- =============================================================================
-- Game: ligação opcional a um place (campo) já catalogado no mapa
-- =============================================================================
-- location (texto livre) mantém-se - continua a ser o que aparece em todo o
-- lado (MatchHeader, listagem). place_id é só para ligar o jogo a um campo
-- conhecido quando o organizador escolhe um da lista em vez de escrever à mão.
-- =============================================================================

alter table public.game
  add column if not exists place_id uuid references public.place (id) on delete set null;

comment on column public.game.place_id is 'Campo (place) escolhido da lista, se houver - location guarda sempre o nome em texto.';

create index if not exists idx_game_place on public.game (place_id);

grant update (place_id) on public.game to authenticated;
