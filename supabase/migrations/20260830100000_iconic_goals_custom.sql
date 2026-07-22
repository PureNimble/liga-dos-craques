-- =============================================================================
-- Lista de golos icónicos (curada à mão)
-- =============================================================================
-- Cada clip foi verificado via oEmbed do YouTube: existe e é público.
-- embeddable=true quando o vídeo permite reprodução embutida; false quando o
-- dono a bloqueia (aí mostra-se miniatura + link). Entra depois do reset em
-- 20260829100000_iconic_goals_reset.sql, por isso a tabela começa vazia.
-- =============================================================================

insert into public.iconic_goal
  (code, scorer, title, year, youtube_id, difficulty, sort_order, embeddable)
select v.code, v.scorer, v.title, v.year, v.youtube_id, v.difficulty, v.sort_order, v.embeddable
from (values
  ('ig_ronaldo_porto',      'Cristiano Ronaldo',   'Míssil de fora da área vs Porto',      2009, '6rX1oIL2l_U', 4,  10, true),
  ('ig_pavard',             'Benjamin Pavard',     'Voleio vs Argentina',                  2018, 'zpgVoTU22-I', 4,  20, true),
  ('ig_zidane_volley',      'Zinedine Zidane',     'Voleio na final da Champions',         2002, 'rFfomw-Z4uE', 5,  30, true),
  ('ig_roberto_carlos',     'Roberto Carlos',      'Livre impossível vs França',           1997, 'crKwlbwvr88', 4,  40, true),
  ('ig_van_basten',         'Marco van Basten',    'Voleio na final do Euro 88',           1988, 'q3af4QIh1oc', 4,  50, true),
  ('ig_ronaldo_juventus',   'Cristiano Ronaldo',   'Bicicleta vs Juventus',                2018, 'T8vcb08cHnI', 5,  60, true),
  ('ig_ibrahimovic',        'Zlatan Ibrahimović',  'Bicicleta de 30m vs Inglaterra',       2012, 'RM_5tJncHww', 5,  70, true),
  ('ig_ronaldo_portsmouth', 'Cristiano Ronaldo',   'Livre vs Portsmouth',                  2008, '1NiB2KeLdy0', 3,  80, true),
  ('ig_payet_paok',         'Dimitri Payet',       'Slalom vs PAOK',                       2018, 'iCbmPFP9J4k', 4,  90, true),
  ('ig_payet_palace',       'Dimitri Payet',       'Livre vs Crystal Palace',              2016, 'g_kebXl_ei8', 3, 100, true),
  ('ig_dele_alli',          'Dele Alli',           'Controlo e voleio vs Crystal Palace',  2016, 'zNpvMgJ9bpQ', 4, 110, true),
  ('ig_stankovic',          'Dejan Stanković',     'Voleio do meio-campo vs Schalke',      2011, 'nRQRyrg7Xxw', 5, 120, true),
  ('ig_van_persie',         'Robin van Persie',    'Cabeceamento a voar vs Espanha',       2014, 'BqDZ5EwKenI', 3, 130, true),
  ('ig_james',              'James Rodríguez',     'Peito e voleio vs Uruguai',            2014, '3jKj1_aI1EI', 4, 140, true),
  ('ig_mitoma',             'Kaoru Mitoma',        'Golo vs Liverpool (FA Cup)',           2023, 'pLMTZtEg8iE', 3, 150, true),
  ('ig_umtiti',             'Samuel Umtiti',       'Cabeceamento vs Bélgica',              2018, 'c5fWXV26XvA', 3, 160, true),
  ('ig_suarez',             'Luis Suárez',         'Toque de primeira vs Mallorca',        2019, '_T3UOGaI6j0', 4, 170, true),
  ('ig_ronaldo_valencia',   'Cristiano Ronaldo',   'Calcanhar vs Valencia',                2010, 'HZszswIyH3w', 4, 180, true),
  ('ig_gascoigne',          'Paul Gascoigne',      'Lençol e voleio vs Escócia',           1996, 'evnXFu744uY', 4, 190, true),
  ('ig_lamela',             'Erik Lamela',         'Rabona',                               null, 'rVPQb4U9MyA', 4, 200, true),
  ('ig_quaresma',           'Ricardo Quaresma',    'Trivela vs Irão',                      2018, 'SA56Ci6OWY4', 3, 210, true),
  ('ig_giroud',             'Olivier Giroud',      'Pontapé escorpião',                    2017, '4lIqzyB3y2Q', 5, 220, true),
  ('ig_lima',               'Lima',                'Golo no dérbi vs Sporting',            2012, '_jl-rlKGvXM', 3, 230, true),
  ('ig_maicon',             'Maicon',              'Ângulo impossível vs Coreia do Norte', 2010, 'kszrpxh_2UQ', 4, 240, true),
  ('ig_nainggolan',         'Radja Nainggolan',    'Voleio vs SPAL',                       2019, 's10w3QC2Us8', 4, 250, true),
  ('ig_totti',              'Francesco Totti',     'Chapéu vs Inter',                      null, '-7MI9nmDhJk', 3, 260, true),
  ('ig_zidane_panenka',     'Zinedine Zidane',     'Penálti à Panenka na final',           2006, 'WXECIq9V-o4', 3, 270, true),
  ('ig_ziyech',             'Hakim Ziyech',        'Livre direto',                         null, 'y1kTABBjY6U', 3, 280, true),
  ('ig_amiri',              'Nadiem Amiri',        'Calcanhar pelo Leverkusen',            2021, 'Xl3KhmwdhaE', 4, 290, true),
  ('ig_vardy',              'Jamie Vardy',         'Golo vs Liverpool',                    2016, 'L7qKQXb8BaU', 3, 300, true),
  ('ig_ronaldo_hungria',    'Cristiano Ronaldo',   'Trivela e chapéu vs Hungria',          2016, 'rEzpYa60MmM', 4, 310, true),
  ('ig_rakitic',            'Ivan Rakitić',        'Voleio de fora da área vs Tottenham',  2018, 'hDnws0rHrGQ', 4, 320, true),
  ('ig_thiago',             'Thiago Alcântara',    'Voleio de fora da área vs Porto',      2021, 'kWf93ngb4Xw', 5, 340, true)
) as v(code, scorer, title, year, youtube_id, difficulty, sort_order, embeddable)
where not exists (select 1 from public.iconic_goal g where g.code = v.code);
