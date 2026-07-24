-- =============================================================================
-- i18n de conquistas: label_en / description_en
-- =============================================================================
-- Opcionais - o PT continua a ser a fonte de verdade e o fallback quando a
-- tradução não existe. Conquistas criadas pelo admin (/admin/achievements)
-- ficam só em PT até alguém preencher os campos EN no formulário; o
-- frontend cai para `label`/`description` quando os `_en` forem nulos.
-- =============================================================================

alter table public.achievement
  add column if not exists label_en text,
  add column if not exists description_en text;

update public.achievement a set
  label_en = v.label_en,
  description_en = v.description_en
from (values
  ('first_game',        'Debut',                 'Play your first game'),
  ('games_10',           'Regular',               'Play 10 games'),
  ('games_100',          'Veteran',               'Play 100 games'),
  ('first_win',          'First Win',             'Win your first game'),
  ('first_goal',         'First Goal',            'Score your first goal'),
  ('hat_trick',          'Hat-trick',             'Score 3 goals in a single game'),
  ('goals_50',           'Goal Machine',          'Score 50 goals'),
  ('assists_50',         'Playmaker',             'Make 50 assists'),
  ('first_mvp',          'Star of the Match',     'Be MVP for the first time'),
  ('mvps_10',            'Superstar',             'Be MVP 10 times'),

  ('ig_roberto_carlos',  'The Banana',            'Replicate Roberto Carlos''s free kick vs France (1997)'),
  ('ig_van_basten',      'The Volley',            'Replicate Van Basten''s volley at Euro 88'),
  ('ig_zidane',          'Glasgow',               'Replicate Zidane''s volley in the 2002 final'),
  ('ig_bergkamp',        'The Pirouette',         'Replicate Bergkamp''s turn vs Newcastle (2002)'),
  ('ig_ibrahimovic',     'The 30m Bicycle Kick',  'Replicate Zlatan''s bicycle kick vs England (2012)'),
  ('ig_rooney',          'The Derby',             'Replicate Rooney''s bicycle kick in the derby (2011)'),
  ('ig_ronaldo',         'Turin',                 'Replicate Ronaldo''s bicycle kick vs Juventus (2018)'),
  ('ig_giroud',          'The Scorpion',          'Replicate Giroud''s scorpion kick (2017)'),
  ('ig_maradona',        'Goal of the Century',   'Replicate Maradona''s slalom vs England (1986)'),
  ('ig_messi',           'Getafe Slalom',         'Replicate Messi''s solo goal vs Getafe (2007)'),

  ('ig_ronaldinho',      'Dry Leaf',              'Replicate Ronaldinho''s free kick vs England (2002)'),
  ('ig_weah',            'Coast to Coast',        'Replicate George Weah''s solo run (1996)'),
  ('ig_gascoigne',       'Gazza',                 'Replicate Gascoigne''s dummy and volley at Euro 96'),
  ('ig_carlos_alberto',  'The Collective',        'Replicate the 1970 team goal (Carlos Alberto)'),
  ('ig_juninho',         'Free Kick Master',      'Replicate one of Juninho''s knuckleball free kicks'),
  ('ig_cambiasso',       '24 Passes',             'Replicate Cambiasso''s team goal (2006)')
) as v(code, label_en, description_en)
where a.code = v.code;
