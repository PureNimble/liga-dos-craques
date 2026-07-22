-- =============================================================================
-- Retratos dos jogadores (Wikimedia Commons) nas conquistas de golos icónicos
-- =============================================================================
-- Fotos livres da Wikimedia Commons (licença CC — atribuição fica no crédito da
-- Wikipédia). Substituem o frame do golo por um retrato reconhecível do jogador.
-- =============================================================================

update public.achievement set image_url = v.url
from (values
  ('ig_roberto_carlos', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a8/LS3_1288_%2853332367864%29_%28cropped%29.jpg/330px-LS3_1288_%2853332367864%29_%28cropped%29.jpg'),
  ('ig_van_basten',     'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7e/Marco_van_Basten_%282%29_%28cropped%29.jpg/330px-Marco_van_Basten_%282%29_%28cropped%29.jpg'),
  ('ig_zidane',         'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f3/Zinedine_Zidane_by_Tasnim_03.jpg/330px-Zinedine_Zidane_by_Tasnim_03.jpg'),
  ('ig_bergkamp',       'https://upload.wikimedia.org/wikipedia/commons/thumb/7/75/Dennis_Bergkamp_2014_%28cropped%29.jpg/330px-Dennis_Bergkamp_2014_%28cropped%29.jpg'),
  ('ig_ibrahimovic',    'https://upload.wikimedia.org/wikipedia/commons/thumb/c/ce/Zlatan_Ibrahimovi%C4%87_nyc.jpg/330px-Zlatan_Ibrahimovi%C4%87_nyc.jpg'),
  ('ig_rooney',         'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9d/Wayne_Rooney_%2850121495731%29_%28cropped%29.jpg/330px-Wayne_Rooney_%2850121495731%29_%28cropped%29.jpg'),
  ('ig_ronaldo',        'https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/Cristiano_Ronaldo_Croatia_v_Portugal_2_July_2026-075_%28cropped%29.jpg/330px-Cristiano_Ronaldo_Croatia_v_Portugal_2_July_2026-075_%28cropped%29.jpg'),
  ('ig_giroud',         'https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/Olivier_Giroud_December_2024.png/330px-Olivier_Giroud_December_2024.png'),
  ('ig_maradona',       'https://upload.wikimedia.org/wikipedia/commons/thumb/4/48/Argentina_celebrando_copa_%28cropped%29.jpg/330px-Argentina_celebrando_copa_%28cropped%29.jpg'),
  ('ig_messi',          'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Leo_Messi_Argentina_v_Egypt_7_July_2026-1.jpg/330px-Leo_Messi_Argentina_v_Egypt_7_July_2026-1.jpg'),
  ('ig_ronaldinho',     'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/Sports_Festival_2025_-_4_%28cropped%29.jpg/330px-Sports_Festival_2025_-_4_%28cropped%29.jpg'),
  ('ig_weah',           'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Clar_Weah%2C_George_Weah%2C_Joe_Biden%2C_Jill_Biden_%28cropped%29.jpg/330px-Clar_Weah%2C_George_Weah%2C_Joe_Biden%2C_Jill_Biden_%28cropped%29.jpg'),
  ('ig_gascoigne',      'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Paul_Gascoigne_2021.png/330px-Paul_Gascoigne_2021.png'),
  ('ig_carlos_alberto', 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Carlos_alberto_cosmos.jpg/330px-Carlos_alberto_cosmos.jpg'),
  ('ig_juninho',        'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Juninho_Pernambucano.JPG/330px-Juninho_Pernambucano.JPG'),
  ('ig_cambiasso',      'https://upload.wikimedia.org/wikipedia/commons/thumb/0/08/Esteban_Cambiasso_FC_Internazionale.jpg/330px-Esteban_Cambiasso_FC_Internazionale.jpg')
) as v(code, url)
where public.achievement.code = v.code;
