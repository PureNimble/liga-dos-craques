-- =============================================================================
-- Repor os golos bloqueados com clips de canais de fã
-- =============================================================================
-- Os clips oficiais (FIFA/PL/Sky) bloqueavam o embed; os de canais de fã
-- costumam permitir. Troca os clips do Maradona e do Giroud para versões de fã
-- e reativa os 7 golos (golo + conquista) como embutíveis. Se algum continuar
-- bloqueado no browser, marca-se depois embeddable=false + active=false.
-- =============================================================================

update public.iconic_goal set youtube_id = 'eky6cBXs9mE' where code = 'ig_maradona';
update public.iconic_goal set youtube_id = 'W15UwTK6p-c' where code = 'ig_giroud';

update public.iconic_goal
set embeddable = true, active = true
where code in (
  'ig_giroud', 'ig_maradona', 'ig_rooney', 'ig_ronaldinho',
  'ig_gascoigne', 'ig_carlos_alberto', 'ig_cambiasso'
);

update public.achievement a set active = true
from public.iconic_goal g
where g.achievement_id = a.id
  and g.code in (
    'ig_giroud', 'ig_maradona', 'ig_rooney', 'ig_ronaldinho',
    'ig_gascoigne', 'ig_carlos_alberto', 'ig_cambiasso'
  );
