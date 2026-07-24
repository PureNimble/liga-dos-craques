-- =============================================================================
-- Nome de conquista de cada golo icónico
-- =============================================================================
-- Ao replicar um golo mostra-se um "toast" estilo consola. O título é o nome da
-- conquista - enigmático de propósito, não diz o golo nem o jogador (isso vem
-- na linha de baixo). Curado à mão, um por golo; fica nulo nos golos que ainda
-- não tenham nome e o frontend cai para o título do golo.
-- =============================================================================

alter table public.iconic_goal add column if not exists achievement_name text;

comment on column public.iconic_goal.achievement_name is
  'Nome enigmático da conquista, mostrado ao replicar o golo. Nulo = usa o título do golo.';

update public.iconic_goal g
set achievement_name = v.achievement_name
from (values
  -- Venceu o primeiro Puskás de sempre (2009).
  ('ig_ronaldo_porto',      'O Primeiro Puskás de Sempre'),
  -- Lateral a marcar o golo do ano: Puskás 2018.
  ('ig_pavard',             'O Lateral Ganhou o Prémio'),
  -- "Nunca tinha tentado um voleio de esquerda assim" - Zidane, Hampden 2002.
  ('ig_zidane_volley',      'Nunca Tinha Tentado à Canhota'),
  -- O apanha-bolas atrás da baliza baixou-se; o guarda-redes nem se mexeu.
  ('ig_roberto_carlos',     'O Apanha-Bolas Baixou-se'),
  -- Koeman sobre o voleio da final do Euro 88: "dali não se remata".
  ('ig_van_basten',         'Dali Não Se Remata'),
  -- O estádio da Juventus levantou-se a aplaudir o adversário.
  ('ig_ronaldo_juventus',   'De Pé, o Estádio Inteiro'),
  -- Bicicleta de 30 metros; "Ibracadabra" e Puskás 2013.
  ('ig_ibrahimovic',        'Ibracadabra a Trinta Metros'),
  ('ig_ronaldo_portsmouth', 'O Livre Que Não Roda'),
  ('ig_payet_paok',         'Passeio Entre Cones Vivos'),
  ('ig_payet_palace',       'Correio Registado ao Ângulo'),
  ('ig_dele_alli',          'Dois Toques, Zero Hipóteses'),
  ('ig_stankovic',          'Do Meio-Campo, à Primeira'),
  -- A alcunha que este mergulho consagrou.
  ('ig_van_persie',         'O Holandês Voador'),
  -- Peito, giro e voleio: Puskás 2014.
  ('ig_james',              'Peito, Giro e Prémio'),
  ('ig_mitoma',             'Último Suspiro na Taça'),
  ('ig_umtiti',             'Aparece nas Noites Grandes'),
  ('ig_suarez',             'Sem Tempo para Pensar'),
  ('ig_ronaldo_valencia',   'De Costas para o Problema'),
  -- A celebração: a "cadeira do dentista" do Euro 96.
  ('ig_gascoigne',          'A Cadeira do Dentista'),
  ('ig_lamela',             'Pernas Trocadas de Propósito'),
  ('ig_quaresma',           'Com o Lado Errado do Pé'),
  -- Giroud creditou o pontapé escorpião às aulas de dança.
  ('ig_giroud',             'Foram as Aulas de Dança'),
  ('ig_lima',               'Estragar a Festa ao Vizinho'),
  ('ig_maicon',             'Não Havia Ali Espaço'),
  -- Nainggolan, "Il Ninja".
  ('ig_nainggolan',         'O Ninja Não Deixou Cair'),
  -- Totti, "Er Pupone".
  ('ig_totti',              'Er Pupone Por Cima'),
  ('ig_zidane_panenka',     'Coragem ou Loucura na Final'),
  ('ig_ziyech',             'Só a Rede se Mexeu'),
  ('ig_amiri',              'O Pé de Trás Resolveu'),
  -- Do cântico "Vardy's having a party".
  ('ig_vardy',              'A Festa Era Dele'),
  ('ig_ronaldo_hungria',    'Duas Formas de Humilhar'),
  ('ig_rakitic',            'De Longe e de Primeira'),
  ('ig_thiago',             'Sem Deixar Cair')
) as v(code, achievement_name)
where g.code = v.code;
