-- =============================================================================
-- SUBSTITUIÇÕES: banco (suplentes) e evento de substituição
-- =============================================================================

-- Quem está em campo (titular) vs banco (suplente). Por omissão, em campo.
alter table public.game_player
  add column if not exists on_field boolean not null default true;

comment on column public.game_player.on_field is
  'Titular (em campo) quando true; suplente (banco) quando false.';

-- Tipo de evento de substituição (não conta para o resultado).
insert into public.event_type (code, label, supports_tags, affects_score, sort_order) values
  ('substitution', 'Substituição', false, false, 60)
on conflict (code) do nothing;

-- game_player não tem grant de update por coluna (RLS já restringe), logo a
-- nova coluna fica desde já editável pelo organizador/próprio.
