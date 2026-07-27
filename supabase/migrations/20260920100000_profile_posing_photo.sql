-- =============================================================================
-- Adiciona `posing_photo_url`: foto de corpo inteiro (hero/spotlight), separada
-- do avatar (`photo_url`). Mesmo bucket `avatars` (política já cobre qualquer
-- caminho `${uid}/...`), só muda o ficheiro (`posing.webp` em vez de `avatar.webp`).
-- =============================================================================

alter table public.profile
  add column if not exists posing_photo_url text;

comment on column public.profile.posing_photo_url is 'Foto de corpo inteiro (hero/spotlight) - distinta do avatar em photo_url.';

grant update (posing_photo_url) on public.profile to authenticated;
