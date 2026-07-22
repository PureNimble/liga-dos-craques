-- =============================================================================
-- Ícones SVG que representam a jogada de cada golo icónico
-- =============================================================================
-- Em vez de retrato/foto do jogador, cada conquista mostra um pictograma da
-- jogada (livre com efeito, voleio, bicicleta, slalom, etc.). Limpa o image_url
-- (retrato) para a grelha voltar a renderizar o ícone SVG. Golos da mesma
-- técnica (3 bicicletas, 2 slaloms, 2 balões) partilham o pictograma da jogada.
-- =============================================================================

update public.achievement set image_url = null, icon = v.icon
from (values
  ('ig_roberto_carlos', 'g_curve'),
  ('ig_van_basten',     'g_volley'),
  ('ig_zidane',         'trophy'),
  ('ig_bergkamp',       'g_spin'),
  ('ig_ibrahimovic',    'g_bicycle'),
  ('ig_rooney',         'g_bicycle'),
  ('ig_ronaldo',        'g_bicycle'),
  ('ig_giroud',         'g_scorpion'),
  ('ig_maradona',       'g_dribble'),
  ('ig_messi',          'g_dribble'),
  ('ig_ronaldinho',     'g_lob'),
  ('ig_weah',           'g_run'),
  ('ig_gascoigne',      'g_lob'),
  ('ig_carlos_alberto', 'g_power'),
  ('ig_juninho',        'g_wall'),
  ('ig_cambiasso',      'g_web')
) as v(code, icon)
where public.achievement.code = v.code;
