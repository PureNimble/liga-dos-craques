-- =============================================================================
-- P1.1 · Realtime no jogo ao vivo
-- =============================================================================
-- Adiciona as tabelas do jogo à publicação supabase_realtime para que o cliente
-- receba alterações em tempo real (placar, timeline de eventos, plantel).
-- O Realtime respeita o RLS de quem recebe (as tabelas permitem leitura a
-- autenticados). Idempotente.
-- =============================================================================

do $$
declare
  t text;
begin
  foreach t in array array['game', 'event', 'game_player'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
