-- =============================================================================
-- Mais golos icónicos (+6) e troca do clip do Rooney
-- =============================================================================
-- Novos golos (cada um com a sua conquista manual). O clip do Rooney era
-- geo-bloqueado (canal Sky, só no Reino Unido); troca-se por um upload de fã
-- globalmente visível. Vídeos de footage FIFA/UEFA ficam embeddable=false
-- (miniatura + link), que é a via fiável para os bloqueados.
-- =============================================================================

-- Novas conquistas (critério manual).
insert into public.achievement (code, label, description, icon, criteria, sort_order)
select v.code, v.label, v.description, v.icon, '{"type":"iconic_goal"}'::jsonb, v.sort_order
from (values
  ('ig_ronaldinho',     'Folha Seca',     'Replica o livre de Ronaldinho vs Inglaterra (2002)',     'goal',   410),
  ('ig_weah',           'Coast to Coast', 'Replica a corrida solo de George Weah (1996)',           'flame',  420),
  ('ig_gascoigne',      'Gazza',          'Replica o lençol e voleio de Gascoigne no Euro 96',      'spark',  430),
  ('ig_carlos_alberto', 'O Coletivo',     'Replica o golo coletivo de 1970 (Carlos Alberto)',       'trophy', 440),
  ('ig_juninho',        'Mestre do Livre','Replica um livre folha seca do Juninho',                 'target', 450),
  ('ig_cambiasso',      '24 Passes',      'Replica o golo coletivo de Cambiasso (2006)',            'medal',  460)
) as v(code, label, description, icon, sort_order)
where not exists (select 1 from public.achievement a where a.code = v.code);

-- Novos golos icónicos.
insert into public.iconic_goal
  (code, achievement_id, scorer, title, year, youtube_id, difficulty, sort_order, embeddable)
select v.code, a.id, v.scorer, v.title, v.year, v.youtube_id, v.difficulty, v.sort_order, v.embeddable
from (values
  ('ig_ronaldinho',     'Ronaldinho',           'Livre por cima de Seaman vs Inglaterra', 2002, 'ExUX7MBk5UM', 3, 110, false),
  ('ig_weah',           'George Weah',          'Corrida solo de campo inteiro',          1996, 'JbrAwdS0Th4', 4, 120, true),
  ('ig_gascoigne',      'Paul Gascoigne',       'Lençol e voleio vs Escócia',             1996, 'evnXFu744uY', 3, 130, false),
  ('ig_carlos_alberto', 'Carlos Alberto',       'Golo coletivo na final de 1970',         1970, 'akK9RSFH7kc', 2, 140, false),
  ('ig_juninho',        'Juninho Pernambucano', 'Livre folha seca',                       null, 'pq_jL8maC7A', 3, 150, true),
  ('ig_cambiasso',      'Esteban Cambiasso',    'Golo de 24 passes vs Sérvia',            2006, 'COe5Y29-BZY', 2, 160, false)
) as v(code, scorer, title, year, youtube_id, difficulty, sort_order, embeddable)
join public.achievement a on a.code = v.code
where not exists (select 1 from public.iconic_goal g where g.code = v.code);

-- Rooney: clip de fã globalmente visível (o anterior era geo-bloqueado).
update public.iconic_goal set youtube_id = '86qZ8bakkgM' where code = 'ig_rooney';
