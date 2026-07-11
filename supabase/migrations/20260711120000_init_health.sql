-- =============================================================================
-- F0 · Migração inicial — prova de vida (health) + função ping()
-- =============================================================================
-- Objetivo: validar o pipeline de migrações e o padrão de segurança (RLS ativo
-- desde o primeiro dia). NÃO contém tabelas de domínio — essas chegam na F1.
-- =============================================================================

-- Tabela mínima de saúde. Serve para o keep-alive e para provar leituras.
create table if not exists public.health (
  id         bigint generated always as identity primary key,
  checked_at timestamptz not null default now(),
  note       text
);

comment on table public.health is 'Tabela de saúde (F0). Usada para keep-alive e prova de ligação.';

-- Linha semente para leituras terem sempre conteúdo.
insert into public.health (note) values ('bootstrap') on conflict do nothing;

-- -----------------------------------------------------------------------------
-- SEGURANÇA: RLS ativado desde o início (hábito obrigatório em TODAS as tabelas).
-- Sem RLS, a chave anon (pública) exporia tudo.
-- -----------------------------------------------------------------------------
alter table public.health enable row level security;

-- Leitura pública permitida (é só uma tabela de saúde, sem dados sensíveis).
-- Escrita NÃO é concedida a anon/authenticated — fica reservada ao service role.
drop policy if exists "health_select_public" on public.health;
create policy "health_select_public"
  on public.health
  for select
  to anon, authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- Função ping(): resposta leve para health-check do frontend.
-- SECURITY INVOKER (default) — não precisa de privilégios elevados.
-- -----------------------------------------------------------------------------
create or replace function public.ping()
returns text
language sql
stable
as $$
  select 'pong'::text;
$$;

comment on function public.ping() is 'Health-check leve usado pelo frontend e keep-alive.';

grant execute on function public.ping() to anon, authenticated;
