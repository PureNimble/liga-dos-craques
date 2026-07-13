-- =============================================================================
-- Conquista destacada no cartão do jogador
-- =============================================================================
-- O jogador escolhe uma das suas conquistas para aparecer no cartão (ao lado do
-- cartão do jogador). Coluna própria + grant por coluna (o resto continua
-- protegido — o padrão de segurança da tabela profile mantém-se).
-- =============================================================================

alter table public.profile
  add column if not exists featured_achievement_id int
    references public.achievement (id) on delete set null;

comment on column public.profile.featured_achievement_id is
  'Conquista destacada pelo jogador (mostrada no cartão). NULL = nenhuma.';

grant update (featured_achievement_id) on public.profile to authenticated;
