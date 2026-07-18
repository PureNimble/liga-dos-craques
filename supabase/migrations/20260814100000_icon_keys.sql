-- =============================================================================
-- Ícones semânticos (chaves) em vez de emojis
-- =============================================================================
-- Os desafios e as conquistas passam a guardar uma CHAVE (ex.: 'ball', 'medal')
-- que o frontend mapeia para um SVG (sem emojis na UI). Migra os dados existentes
-- e ajusta os defaults; continua data-driven (acrescentar = INSERT com a chave).
-- =============================================================================

alter table public.challenge alter column icon set default 'target';

update public.challenge set icon = case code
  when 'crossbar' then 'target'
  when 'penalty'  then 'ball'
  when 'freekick' then 'goal'
  when '1v1'      then 'versus'
  else 'target'
end;

alter table public.achievement alter column icon set default 'medal';

update public.achievement set icon = case code
  when 'first_game' then 'spark'
  when 'games_10'   then 'ball'
  when 'games_100'  then 'medal'
  when 'first_win'  then 'check'
  when 'first_goal' then 'goal'
  when 'hat_trick'  then 'hat'
  when 'goals_50'   then 'flame'
  when 'assists_50' then 'target'
  when 'first_mvp'  then 'star'
  when 'mvps_10'    then 'trophy'
  else 'medal'
end;
