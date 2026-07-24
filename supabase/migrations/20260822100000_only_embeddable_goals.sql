-- =============================================================================
-- Só golos embutíveis na app
-- =============================================================================
-- Política: se o vídeo não joga embutido, o golo não entra na app. Os marcados
-- embeddable=false (footage FIFA/UEFA/PL bloqueada) saem - golo e conquista
-- passam a inativos, por isso o spinner deixa de os sortear e a conquista some
-- da grelha. Reversível: repor active=true se um dia houver clip embutível.
-- =============================================================================

update public.achievement a set active = false
from public.iconic_goal g
where g.achievement_id = a.id and g.embeddable = false;

update public.iconic_goal set active = false where embeddable = false;
