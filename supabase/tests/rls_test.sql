-- Testes de invariantes de segurança/BD (pgTAP).
-- Correr com:  supabase test db   (requer `supabase start` / Docker).
-- =============================================================================
begin;
select plan(3);

-- 1) INVARIANTE CRÍTICO: todas as tabelas do schema public têm RLS ativado.
--    (a chave anon é pública; uma tabela sem RLS expõe tudo)
select is(
  (
    select count(*)::int
    from pg_tables t
    join pg_class c on c.relname = t.tablename and c.relnamespace = 'public'::regnamespace
    where t.schemaname = 'public' and not c.relrowsecurity
  ),
  0,
  'Todas as tabelas public têm RLS ativado'
);

-- 2) A função de health responde.
select is(public.ping(), 'pong', 'ping() devolve pong');

-- 3) xp_ledger é read-only para clientes (sem política de INSERT).
select is(
  (
    select count(*)::int
    from pg_policies
    where schemaname = 'public' and tablename = 'xp_ledger' and cmd = 'INSERT'
  ),
  0,
  'xp_ledger não tem política de INSERT (só a função de atribuição escreve)'
);

select * from finish();
rollback;
