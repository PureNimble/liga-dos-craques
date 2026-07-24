-- =============================================================================
-- Imagem opcional na conquista
-- =============================================================================
-- As conquistas de golos icónicos mostram o jogador (frame do golo) em vez do
-- ícone SVG genérico. Usa-se a miniatura do próprio vídeo - o jogador naquele
-- ano/versão, por isso nunca repete mesmo que o jogador apareça duas vezes. As
-- conquistas de jogo (hat-trick, etc.) ficam sem image_url e mantêm o SVG.
-- =============================================================================

alter table public.achievement add column if not exists image_url text;

comment on column public.achievement.image_url is
  'Imagem opcional (ex.: frame do golo). Tem prioridade sobre o ícone SVG na grelha.';

update public.achievement a
set image_url = 'https://img.youtube.com/vi/' || g.youtube_id || '/hqdefault.jpg'
from public.iconic_goal g
where g.achievement_id = a.id;
