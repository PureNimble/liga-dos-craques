-- =============================================================================
-- Seed LOCAL - corre só em `supabase db reset` (NUNCA em `db push`/produção).
-- =============================================================================
-- A plataforma Supabase alojada concede por omissão os privilégios base
-- (SELECT/INSERT/UPDATE/DELETE) a `anon`/`authenticated` em todas as tabelas de
-- `public` - a segurança real vem do RLS, não de esconder estes grants. O
-- Supabase local NÃO reproduz esse default, por isso o app apanha
-- "permission denied for table ..." ao ler qualquer tabela como autenticado.
-- Reproduzimos aqui os grants base para o ambiente local ficar funcional.
--
-- As restrições finas por coluna (ex.: profile.role, created_by) vivem nas
-- migrações e continuam a valer em produção. Localmente os grants são mais
-- amplos - é um ambiente de dev descartável e o RLS continua a ser a guarda.
-- =============================================================================

grant select, insert, update, delete on all tables in schema public to anon, authenticated;
grant usage, select on all sequences in schema public to anon, authenticated;
