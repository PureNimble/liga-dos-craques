-- =============================================================================
-- Nome de utilizador (username) - identificador único e opcional, além do
-- nome de exibição (que continua livre e não-único).
-- =============================================================================

alter table public.profile
  add column if not exists username text
    constraint profile_username_unique unique
    constraint profile_username_format check (username is null or username ~ '^[a-z0-9_]{3,20}$');

comment on column public.profile.username is
  'Identificador único opcional (minúsculas, dígitos, underscore; 3-20 carateres).';

-- GRANTs por coluna são aditivos: autoriza o próprio a escrever a coluna nova
-- sem repetir as já concedidas em 20260712100000_profiles.sql.
grant update (username) on public.profile to authenticated;
