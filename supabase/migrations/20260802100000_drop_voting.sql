-- =============================================================================
-- Limpeza: remover o sistema de votação (MVP/Flop passou a ser 100% por rating)
-- =============================================================================
-- Já nada depende destes objetos: v_game_award (awards_no_voting) é
-- self-contained, v_player_stats lê v_game_award, award_game_xp lê v_game_award.
-- =============================================================================

-- Ordem importa: a tabela `vote` e as suas policies dependem de can_cast_vote,
-- e as vistas dependem das funções. Removemos primeiro os dependentes (tabela +
-- policies, depois vistas) e só no fim as funções.
drop table if exists public.vote cascade;
drop view if exists public.v_game_vote_tally;
drop view if exists public.v_game_award_candidate;
drop function if exists public.can_cast_vote(uuid, text, uuid);
drop function if exists public.can_cast_vote(uuid, uuid);
drop function if exists public.open_voting(uuid);
