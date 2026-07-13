-- =============================================================================
-- F9 · Conquistas (achievements)
-- =============================================================================
-- Orientadas a dados: cada conquista tem um `criteria` jsonb avaliado por uma
-- função. Acrescentar conquistas novas é só um INSERT (sem código novo, desde
-- que o tipo de critério já exista). Avaliadas automaticamente no fecho do jogo.
-- =============================================================================

create table if not exists public.achievement (
  id          bigint generated always as identity primary key,
  code        text not null unique,
  label       text not null,
  description text not null,
  icon        text not null default '🏅',
  criteria    jsonb not null,
  sort_order  int not null default 0,
  active      boolean not null default true
);

comment on table public.achievement is 'Definições de conquistas (data-driven). criteria: {type:stat,metric,gte} | {type:special,key}.';

alter table public.achievement enable row level security;

drop policy if exists "achievement_select" on public.achievement;
create policy "achievement_select" on public.achievement for select to anon, authenticated using (true);

create table if not exists public.user_achievement (
  player_id      uuid not null references public.profile (id) on delete cascade,
  achievement_id bigint not null references public.achievement (id) on delete cascade,
  unlocked_at    timestamptz not null default now(),
  primary key (player_id, achievement_id)
);

alter table public.user_achievement enable row level security;

-- Leitura permitida; escrita só pela função de avaliação (security definer).
drop policy if exists "user_achievement_select" on public.user_achievement;
create policy "user_achievement_select" on public.user_achievement for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- Seeds
-- -----------------------------------------------------------------------------
insert into public.achievement (code, label, description, icon, criteria, sort_order)
select v.code, v.label, v.description, v.icon, v.criteria::jsonb, v.sort_order
from (values
  ('first_game',  'Estreia',        'Joga o teu primeiro jogo',        '🎉', '{"type":"stat","metric":"games","gte":1}',    10),
  ('games_10',    'Habitué',        'Joga 10 jogos',                    '⚽', '{"type":"stat","metric":"games","gte":10}',   20),
  ('games_100',   'Veterano',       'Joga 100 jogos',                   '🎖️', '{"type":"stat","metric":"games","gte":100}',  30),
  ('first_win',   'Primeira vitória','Vence o teu primeiro jogo',       '✅', '{"type":"stat","metric":"wins","gte":1}',     40),
  ('first_goal',  'Primeiro golo',  'Marca o teu primeiro golo',        '🥅', '{"type":"stat","metric":"goals","gte":1}',    50),
  ('hat_trick',   'Hat-trick',      'Marca 3 golos num só jogo',        '🎩', '{"type":"special","key":"hat_trick"}',        60),
  ('goals_50',    'Goleador',       'Marca 50 golos',                   '🔥', '{"type":"stat","metric":"goals","gte":50}',   70),
  ('assists_50',  'Maestro',        'Faz 50 assistências',              '🎯', '{"type":"stat","metric":"assists","gte":50}', 80),
  ('first_mvp',   'Figura',         'Sê MVP pela primeira vez',         '⭐', '{"type":"stat","metric":"mvps","gte":1}',     90),
  ('mvps_10',     'Estrela',        'Sê MVP 10 vezes',                  '🌟', '{"type":"stat","metric":"mvps","gte":10}',   100)
) as v(code, label, description, icon, criteria, sort_order)
where not exists (select 1 from public.achievement);

-- =============================================================================
-- Avaliação (idempotente via ON CONFLICT + PK).
-- =============================================================================
create or replace function public.evaluate_player_achievements(p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.v_player_stats%rowtype;
  a public.achievement%rowtype;
  v_max_goals int;
  v_val int;
  v_ok boolean;
begin
  select * into s from public.v_player_stats where player_id = p_player_id;
  if not found then
    return;
  end if;

  -- Máximo de golos num único jogo (para conquistas "special").
  select coalesce(max(cnt), 0) into v_max_goals
  from (
    select count(*) as cnt
    from public.event e
    join public.event_type et on et.id = e.event_type_id
    where e.player_id = p_player_id and et.code = 'goal'
    group by e.game_id
  ) q;

  for a in select * from public.achievement where active loop
    v_ok := false;

    if a.criteria ->> 'type' = 'stat' then
      v_val := case a.criteria ->> 'metric'
        when 'games' then s.games
        when 'wins' then s.wins
        when 'draws' then s.draws
        when 'losses' then s.losses
        when 'goals' then s.goals
        when 'assists' then s.assists
        when 'saves' then s.saves
        when 'mvps' then s.mvps
        else 0
      end;
      v_ok := v_val >= (a.criteria ->> 'gte')::int;

    elsif a.criteria ->> 'type' = 'special' then
      if a.criteria ->> 'key' = 'hat_trick' then
        v_ok := v_max_goals >= 3;
      end if;
    end if;

    if v_ok then
      insert into public.user_achievement (player_id, achievement_id)
      values (p_player_id, a.id)
      on conflict do nothing;
    end if;
  end loop;
end $$;

create or replace function public.evaluate_game_achievements(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  r record;
begin
  for r in select player_id from public.game_player where game_id = p_game_id loop
    perform public.evaluate_player_achievements(r.player_id);
  end loop;
end $$;

-- Ligar ao trigger de fecho do jogo (XP + conquistas).
create or replace function public.trg_award_xp_on_close()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'closed' and (old.status is distinct from 'closed') then
    perform public.award_game_xp(new.id);
    perform public.evaluate_game_achievements(new.id);
  end if;
  return new;
end $$;
