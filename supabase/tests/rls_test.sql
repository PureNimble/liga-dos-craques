-- Testes de invariantes de segurança/BD (pgTAP).
-- Correr com:  supabase test db   (requer `supabase start` / Docker).
-- =============================================================================
begin;
select plan(11);

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

-- 4) iconic_goal_spin só é escrito pelas RPCs security definer (sem políticas de escrita).
select is(
  (
    select count(*)::int
    from pg_policies
    where schemaname = 'public' and tablename = 'iconic_goal_spin'
      and cmd in ('INSERT', 'UPDATE', 'DELETE')
  ),
  0,
  'iconic_goal_spin não tem políticas de escrita (só as RPCs escrevem)'
);

-- 5) A RPC que desbloqueia a conquista corre como security definer.
select is(
  (
    select prosecdef
    from pg_proc
    where proname = 'iconic_goal_replicate' and pronamespace = 'public'::regnamespace
  ),
  true,
  'iconic_goal_replicate é security definer'
);

-- 6) app_event é append-only para clientes (sem políticas de UPDATE/DELETE).
select is(
  (
    select count(*)::int
    from pg_policies
    where schemaname = 'public' and tablename = 'app_event' and cmd in ('UPDATE', 'DELETE')
  ),
  0,
  'app_event não tem políticas de UPDATE/DELETE (é append-only)'
);

-- 7) O consentimento de tracking só se muda pela RPC security definer.
select is(
  (
    select prosecdef
    from pg_proc
    where proname = 'analytics_set_consent' and pronamespace = 'public'::regnamespace
  ),
  true,
  'analytics_set_consent é security definer'
);

-- 8) O admin não edita perfis: nenhuma política de UPDATE em profile passa por
--    is_admin() (a função só muda pela RPC admin_set_role).
select is(
  (
    select count(*)::int
    from pg_policies
    where schemaname = 'public' and tablename = 'profile' and cmd = 'UPDATE'
      and (coalesce(qual, '') like '%is_admin%' or coalesce(with_check, '') like '%is_admin%')
  ),
  0,
  'profile não tem política de UPDATE por admin (só o dono se edita)'
);

-- 9) Reabrir um jogo é operação de servidor (admin) - nunca um UPDATE do cliente.
select is(
  (
    select prosecdef
    from pg_proc
    where proname = 'admin_reopen_game' and pronamespace = 'public'::regnamespace
  ),
  true,
  'admin_reopen_game é security definer'
);

-- 10) Avisos: o cliente não os cria nem apaga (só o servidor escreve).
select is(
  (
    select count(*)::int
    from pg_policies
    where schemaname = 'public' and tablename = 'notification' and cmd in ('INSERT', 'DELETE')
  ),
  0,
  'notification não tem políticas de INSERT/DELETE (só o servidor escreve)'
);

-- 11) A limpeza periódica não é executável por clientes.
select is(
  has_function_privilege('authenticated', 'public.purge_stale_data()', 'execute'),
  false,
  'purge_stale_data() não é executável por authenticated'
);

select * from finish();
rollback;
