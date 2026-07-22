-- =============================================================================
-- Limpa todos os golos icónicos (lista vai ser repovoada de raiz)
-- =============================================================================
-- Esvazia iconic_goal; os spins ativos e os replicados saem em cascata (FK
-- on delete cascade). A infraestrutura (tabela, RPCs, spinner) fica intacta —
-- só os dados dos golos é que são removidos, para entrar uma lista nova.
-- =============================================================================

delete from public.iconic_goal;
