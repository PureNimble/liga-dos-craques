-- =============================================================================
-- Número de camisola
-- =============================================================================
-- Atributo do jogador (não do jogo - as equipas são geradas de novo em cada
-- jogo). O capitão não tem coluna própria: é calculado no cliente como o
-- jogador da equipa com mais jogos disputados na plataforma.
-- =============================================================================

alter table public.profile
  add column if not exists jersey_number smallint
    check (jersey_number is null or jersey_number between 1 and 99);

comment on column public.profile.jersey_number is 'Número de camisola preferido do jogador (1-99).';

-- Grant por coluna é aditivo: basta conceder a nova coluna.
grant update (jersey_number) on public.profile to authenticated;
