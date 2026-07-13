-- =============================================================================
-- MVP / Flop SEM votação — sempre decididos pela app
-- =============================================================================
-- O melhor rating do jogo é MVP, o pior é Flop. Em caso de EMPATE no topo/fundo,
-- desempata pela CONSISTÊNCIA (média histórica das avaliações do jogador):
--   MVP  → o mais consistente (maior média)
--   Flop → o menos consistente (menor média)
-- O MVP nunca é igual ao Flop. Deixa de haver votação.
-- =============================================================================

create or replace view public.v_game_award
with (security_invoker = on) as
with r as (
  select
    game_id, player_id, rating,
    count(*) over (partition by game_id) as n,
    max(rating) over (partition by game_id) as mx,
    min(rating) over (partition by game_id) as mn
  from public.v_game_player_rating
),
pavg as (
  -- consistência do jogador = média de todas as suas avaliações
  select player_id, avg(rating) as avg_rating
  from public.v_game_player_rating
  group by player_id
),
mvp as (
  select
    r.game_id, 'mvp'::text as category, r.player_id,
    row_number() over (
      partition by r.game_id
      order by coalesce(pa.avg_rating, 6) desc, r.player_id asc
    ) as rn
  from r
  left join pavg pa on pa.player_id = r.player_id
  where r.n >= 2 and r.rating = r.mx
),
flop as (
  select
    r.game_id, 'flop'::text as category, r.player_id,
    row_number() over (
      partition by r.game_id
      order by coalesce(pa.avg_rating, 6) asc, r.player_id desc
    ) as rn
  from r
  left join pavg pa on pa.player_id = r.player_id
  where r.n >= 2 and r.rating = r.mn
),
picked as (
  select game_id, category, player_id from mvp where rn = 1
  union all
  select game_id, category, player_id from flop where rn = 1
)
-- Garante MVP ≠ Flop (caso degenerado de todos com o mesmo rating e média).
select p.game_id, p.category, p.player_id
from picked p
where p.category = 'mvp'
   or not exists (
     select 1 from picked m
     where m.game_id = p.game_id and m.category = 'mvp' and m.player_id = p.player_id
   );

comment on view public.v_game_award is
  'MVP/Flop apurado por jogo — melhor/pior rating; empate desfeito pela consistência (média).';

-- -----------------------------------------------------------------------------
-- Apurar = simplesmente fechar o jogo (o apuramento é derivado da vista acima).
-- Já não abre votação.
-- -----------------------------------------------------------------------------
create or replace function public.resolve_awards(p_game_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_game_organizer(p_game_id) then
    raise exception 'Sem permissão para apurar MVP/Flop.';
  end if;
  update public.game set status = 'closed' where id = p_game_id and status = 'finished';
  return 'closed';
end $$;

grant execute on function public.resolve_awards(uuid) to authenticated;
