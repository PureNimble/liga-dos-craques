-- =============================================================================
-- Posições em falta: alas, médios de lado e segundo avançado
-- =============================================================================
-- Dados de referência vão na migração: o seed não corre no `db push`.
-- =============================================================================

insert into public.position (code, label, category, sort_order) values
  ('RWB', 'Ala direito',      'DEF', 23),
  ('LWB', 'Ala esquerdo',     'DEF', 24),
  ('RM',  'Médio direito',    'MID', 33),
  ('LM',  'Médio esquerdo',   'MID', 34),
  ('SS',  'Segundo avançado', 'FWD', 43)
on conflict (code) do nothing;
