-- =============================================================================
-- Golos Icónicos — substitui o desafio "Livres"
-- =============================================================================
-- Cada golo icónico tem um vídeo (YouTube) e uma conquista associada. O jogador
-- roda um spinner que sorteia um golo AINDA por replicar; tem sempre 1 golo
-- ativo de cada vez. Ao replicar (auto-declaração) desbloqueia a conquista; ao
-- desistir liberta o spin e pode voltar a rodar (o sorteio é sempre aleatório).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Substituir o challenge "Livres" (apaga o histórico órfão de tentativas).
-- -----------------------------------------------------------------------------
delete from public.challenge_attempt
where challenge_id in (select id from public.challenge where code = 'freekick');

update public.challenge
set code = 'iconic_goals', label = 'Golos Icónicos', icon = 'dice'
where code = 'freekick';

-- -----------------------------------------------------------------------------
-- 2. Conquistas dos golos icónicos (critério manual: não avaliado no fecho).
-- -----------------------------------------------------------------------------
insert into public.achievement (code, label, description, icon, criteria, sort_order)
select v.code, v.label, v.description, v.icon, '{"type":"iconic_goal"}'::jsonb, v.sort_order
from (values
  ('ig_roberto_carlos', 'A Banana',          'Replica o livre de Roberto Carlos vs França (1997)',    'goal',   300),
  ('ig_van_basten',     'O Voleio',          'Replica o voleio de Van Basten no Euro 88',             'target', 310),
  ('ig_zidane',         'Glasgow',           'Replica o voleio de Zidane na final de 2002',           'trophy', 320),
  ('ig_bergkamp',       'A Pirueta',         'Replica a pirueta de Bergkamp vs Newcastle (2002)',     'spark',  330),
  ('ig_ibrahimovic',    'A Bicicleta de 30m','Replica a bicicleta de Zlatan vs Inglaterra (2012)',    'flame',  340),
  ('ig_rooney',         'O Dérbi',           'Replica a bicicleta de Rooney no dérbi (2011)',         'ball',   350),
  ('ig_ronaldo',        'Turim',             'Replica a bicicleta de Ronaldo vs Juventus (2018)',     'star',   360),
  ('ig_giroud',         'O Escorpião',       'Replica o escorpião de Giroud (2017)',                  'hat',    370),
  ('ig_maradona',       'Golo do Século',    'Replica o slalom de Maradona vs Inglaterra (1986)',     'medal',  380),
  ('ig_messi',          'Slalom de Getafe',  'Replica o golo solo de Messi vs Getafe (2007)',         'dice',   390)
) as v(code, label, description, icon, sort_order)
where not exists (select 1 from public.achievement a where a.code = v.code);

-- -----------------------------------------------------------------------------
-- 3. Golos icónicos (dados de referência): vídeo + conquista associada.
-- -----------------------------------------------------------------------------
create table if not exists public.iconic_goal (
  id             bigint generated always as identity primary key,
  code           text not null unique,
  achievement_id bigint not null unique references public.achievement (id) on delete cascade,
  scorer         text not null,
  title          text not null,
  year           int,
  youtube_id     text not null,
  video_start    int not null default 0,
  difficulty     smallint not null default 1 check (difficulty between 1 and 5),
  sort_order     int not null default 0,
  active         boolean not null default true
);

comment on table public.iconic_goal is 'Golos icónicos do desafio: vídeo YouTube + conquista associada (data-driven).';

alter table public.iconic_goal enable row level security;

drop policy if exists "iconic_goal_select" on public.iconic_goal;
create policy "iconic_goal_select" on public.iconic_goal for select to authenticated using (true);

insert into public.iconic_goal (code, achievement_id, scorer, title, year, youtube_id, difficulty, sort_order)
select v.code, a.id, v.scorer, v.title, v.year, v.youtube_id, v.difficulty, v.sort_order
from (values
  ('ig_roberto_carlos', 'Roberto Carlos',      'Livre impossível vs França',       1997, 'crKwlbwvr88', 2, 10),
  ('ig_van_basten',     'Marco van Basten',    'Voleio na final do Euro 88',       1988, '4CwzbO9IXnc', 3, 20),
  ('ig_zidane',         'Zinedine Zidane',     'Voleio na final da Champions',     2002, 'rFfomw-Z4uE', 4, 30),
  ('ig_bergkamp',       'Dennis Bergkamp',     'Pirueta vs Newcastle',             2002, '1t_Dv2LEa3c', 4, 40),
  ('ig_ibrahimovic',    'Zlatan Ibrahimović',  'Bicicleta de 30m vs Inglaterra',   2012, 'RM_5tJncHww', 5, 50),
  ('ig_rooney',         'Wayne Rooney',        'Bicicleta no dérbi de Manchester', 2011, 'PbFG9b9Nciw', 5, 60),
  ('ig_ronaldo',        'Cristiano Ronaldo',   'Bicicleta vs Juventus',            2018, 'T2EcMiEywE8', 5, 70),
  ('ig_giroud',         'Olivier Giroud',      'Pontapé escorpião',                2017, 'wGOhxt5Ksc0', 5, 80),
  ('ig_maradona',       'Diego Maradona',      'Slalom vs Inglaterra',             1986, 'Da_CDPRG2j0', 3, 90),
  ('ig_messi',          'Lionel Messi',        'Golo solo vs Getafe',              2007, 'mMiL4_1Yewg', 3, 100)
) as v(code, scorer, title, year, youtube_id, difficulty, sort_order)
join public.achievement a on a.code = v.code
where not exists (select 1 from public.iconic_goal g where g.code = v.code);

-- -----------------------------------------------------------------------------
-- 4. Spin ativo (1 por jogador). Só o dono lê; escrita apenas pelas RPCs.
-- -----------------------------------------------------------------------------
create table if not exists public.iconic_goal_spin (
  player_id      uuid primary key references public.profile (id) on delete cascade,
  iconic_goal_id bigint not null references public.iconic_goal (id) on delete cascade,
  spun_at        timestamptz not null default now()
);

alter table public.iconic_goal_spin enable row level security;

drop policy if exists "iconic_goal_spin_select" on public.iconic_goal_spin;
create policy "iconic_goal_spin_select" on public.iconic_goal_spin for select to authenticated
  using (player_id = auth.uid());

-- -----------------------------------------------------------------------------
-- 5. RPCs (security definer): rodar, replicar, desistir.
-- -----------------------------------------------------------------------------

-- Sorteia um golo por replicar. Se já houver spin ativo, devolve-o (não re-rola).
create or replace function public.iconic_goal_roll()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_goal_id bigint;
begin
  if v_uid is null then
    raise exception 'Não autenticado';
  end if;

  select iconic_goal_id into v_goal_id
  from public.iconic_goal_spin where player_id = v_uid;
  if found then
    return v_goal_id;
  end if;

  select g.id into v_goal_id
  from public.iconic_goal g
  where g.active
    and not exists (
      select 1 from public.user_achievement ua
      where ua.player_id = v_uid and ua.achievement_id = g.achievement_id
    )
  order by random()
  limit 1;

  if v_goal_id is null then
    return null; -- já replicou todos os golos disponíveis
  end if;

  insert into public.iconic_goal_spin (player_id, iconic_goal_id)
  values (v_uid, v_goal_id);

  return v_goal_id;
end $$;

grant execute on function public.iconic_goal_roll() to authenticated;

-- Auto-declaração: desbloqueia a conquista do golo ativo e limpa o spin.
create or replace function public.iconic_goal_replicate()
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_goal public.iconic_goal%rowtype;
begin
  if v_uid is null then
    raise exception 'Não autenticado';
  end if;

  select g.* into v_goal
  from public.iconic_goal_spin s
  join public.iconic_goal g on g.id = s.iconic_goal_id
  where s.player_id = v_uid;

  if not found then
    raise exception 'Sem golo ativo';
  end if;

  insert into public.user_achievement (player_id, achievement_id)
  values (v_uid, v_goal.achievement_id)
  on conflict do nothing;

  delete from public.iconic_goal_spin where player_id = v_uid;

  return v_goal.achievement_id;
end $$;

grant execute on function public.iconic_goal_replicate() to authenticated;

-- Liberta o spin ativo (pode voltar a rodar; o próximo é aleatório).
create or replace function public.iconic_goal_forfeit()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Não autenticado';
  end if;
  delete from public.iconic_goal_spin where player_id = auth.uid();
end $$;

grant execute on function public.iconic_goal_forfeit() to authenticated;

-- -----------------------------------------------------------------------------
-- 6. Ranking: nº de golos icónicos replicados por jogador.
-- -----------------------------------------------------------------------------
create or replace view public.v_iconic_goal_leaderboard
with (security_invoker = on) as
select
  p.id as player_id,
  p.name,
  p.photo_url,
  count(ua.achievement_id)::int as replicated
from public.profile p
join public.user_achievement ua on ua.player_id = p.id
join public.iconic_goal g on g.achievement_id = ua.achievement_id
group by p.id, p.name, p.photo_url;

grant select on public.v_iconic_goal_leaderboard to authenticated;
