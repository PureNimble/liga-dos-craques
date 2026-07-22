-- =============================================================================
-- Proteger o ledger: não apagar jogos fechados
-- =============================================================================
-- A XP é atribuída quando o jogo fecha (status='closed') e vive no xp_ledger,
-- que é append-only. O FK xp_ledger.game_id é ON DELETE SET NULL, por isso
-- apagar um jogo fechado deixaria a XP nos totais dos jogadores sem o jogo de
-- origem — inconsistente. Bloqueia-se a remoção no servidor (a UI já a esconde,
-- mas a garantia real vive na BD). Cancelar (status='cancelled') continua a ser
-- o caminho reversível.
-- =============================================================================

create or replace function public.forbid_delete_closed_game()
returns trigger
language plpgsql
as $$
begin
  if old.status = 'closed' then
    raise exception 'Jogos fechados não podem ser apagados (a XP já foi atribuída).';
  end if;
  return old;
end $$;

drop trigger if exists trg_forbid_delete_closed_game on public.game;
create trigger trg_forbid_delete_closed_game
  before delete on public.game
  for each row execute function public.forbid_delete_closed_game();
