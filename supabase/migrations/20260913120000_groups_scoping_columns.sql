-- =============================================================================
-- Grupos · colunas de âmbito (ainda sem RLS/backfill — ver migrações seguintes)
-- =============================================================================
-- `game` é a "raiz" do âmbito: game_player/event/event_tag/session_player/
-- session_turn não ganham a sua própria coluna, seguem o group_id do
-- game_id/session_id a que pertencem. As restantes tabelas ganham group_id
-- diretamente porque não têm todas uma FK comum para o derivar.
--
-- Colunas nullable por agora — a migração de backfill (seguinte) preenche os
-- dados existentes e só depois é que ficam NOT NULL. Isto evita uma janela em
-- que a app fica sem conseguir escrever por falta de valor.
-- =============================================================================

alter table public.game add column if not exists group_id uuid references public.app_group (id);
alter table public.xp_ledger add column if not exists group_id uuid references public.app_group (id);
alter table public.user_achievement add column if not exists group_id uuid references public.app_group (id);
alter table public.challenge_attempt add column if not exists group_id uuid references public.app_group (id);
alter table public.challenge_session add column if not exists group_id uuid references public.app_group (id);

create index if not exists idx_game_group on public.game (group_id);
create index if not exists idx_xp_ledger_group on public.xp_ledger (group_id);
create index if not exists idx_user_achievement_group on public.user_achievement (group_id);
create index if not exists idx_challenge_attempt_group on public.challenge_attempt (group_id);
create index if not exists idx_challenge_session_group on public.challenge_session (group_id);

-- -----------------------------------------------------------------------------
-- Helpers para RLS de tabelas que só têm o grupo indiretamente (via game_id /
-- session_id). Mesma forma de is_game_organizer().
-- -----------------------------------------------------------------------------
create or replace function public.is_game_group_member(p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_group_member(g.group_id) from public.game g where g.id = p_game_id;
$$;

grant execute on function public.is_game_group_member(uuid) to authenticated;

create or replace function public.is_session_group_member(p_session_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_group_member(s.group_id) from public.challenge_session s where s.id = p_session_id;
$$;

grant execute on function public.is_session_group_member(uuid) to authenticated;
