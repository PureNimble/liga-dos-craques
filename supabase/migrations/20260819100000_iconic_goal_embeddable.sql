-- =============================================================================
-- Golos icónicos: flag de "embutível"
-- =============================================================================
-- Alguns golos têm o vídeo bloqueado para reprodução embutida pelo dono dos
-- direitos (FIFA/UEFA/ligas) via Content ID - o iframe mostra "vídeo indisponível".
-- Esses passam a mostrar-se como miniatura com link para o YouTube, em vez do
-- leitor embutido. Data-driven: marcar como bloqueado é só um UPDATE.
-- =============================================================================

alter table public.iconic_goal
  add column if not exists embeddable boolean not null default true;

comment on column public.iconic_goal.embeddable is
  'false = o dono bloqueia a reprodução embutida; mostra-se miniatura + link para o YouTube.';

-- Bloqueados conhecidos (canal FIFA).
update public.iconic_goal set embeddable = false where code in ('ig_giroud', 'ig_maradona');
