-- =============================================================================
-- F7 · Sistema de XP
-- =============================================================================
-- Regras VERSIONADAS (xp_rule) + ledger APPEND-ONLY (xp_ledger) + curva de
-- níveis (xp_level). O XP é atribuído automaticamente quando o jogo fecha, por
-- um trigger idempotente. Alterar regras no futuro nunca corrompe o histórico:
-- fecha-se a regra antiga (valid_to) e cria-se uma nova versão.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- XP_RULE (versionadas)
-- -----------------------------------------------------------------------------
create table if not exists public.xp_rule (
  id         bigint generated always as identity primary key,
  code       text not null,
  points     int not null,
  valid_from timestamptz not null default now(),
  valid_to   timestamptz,
  active     boolean not null default true
);

comment on table public.xp_rule is 'Regras de XP versionadas. Nunca editar destrutivamente: fechar (valid_to) e criar nova versão.';

alter table public.xp_rule enable row level security;

drop policy if exists "xp_rule_select" on public.xp_rule;
create policy "xp_rule_select" on public.xp_rule for select to anon, authenticated using (true);

-- Regras iniciais (só se a tabela estiver vazia).
insert into public.xp_rule (code, points)
select v.code, v.points
from (values ('participation', 10), ('win', 15), ('goal', 8), ('assist', 5), ('mvp', 20)) as v(code, points)
where not exists (select 1 from public.xp_rule);

-- Regra ativa para um código, no momento atual.
create or replace function public.active_xp_rule(p_code text)
returns table (rule_id bigint, points int)
language sql
stable
security definer
set search_path = public
as $$
  select id, points
  from public.xp_rule
  where code = p_code and active
    and valid_from <= now()
    and (valid_to is null or valid_to > now())
  order by valid_from desc
  limit 1;
$$;

-- -----------------------------------------------------------------------------
-- XP_LEDGER (append-only)
-- -----------------------------------------------------------------------------
create table if not exists public.xp_ledger (
  id          uuid primary key default gen_random_uuid(),
  player_id   uuid not null references public.profile (id) on delete cascade,
  game_id     uuid references public.game (id) on delete set null,
  source_code text not null,
  points      int not null,
  xp_rule_id  bigint references public.xp_rule (id),
  created_at  timestamptz not null default now()
);

comment on table public.xp_ledger is 'Movimentos de XP (append-only). XP total = SUM(points). Só escrito por award_game_xp.';

create index if not exists idx_xp_ledger_player on public.xp_ledger (player_id);
create index if not exists idx_xp_ledger_game on public.xp_ledger (game_id);

alter table public.xp_ledger enable row level security;

-- Leitura permitida; escrita só pela função (security definer). Sem policies de
-- INSERT/UPDATE/DELETE → clientes não podem escrever.
drop policy if exists "xp_ledger_select" on public.xp_ledger;
create policy "xp_ledger_select" on public.xp_ledger for select to authenticated using (true);

-- -----------------------------------------------------------------------------
-- XP_LEVEL (curva de níveis)
-- -----------------------------------------------------------------------------
create table if not exists public.xp_level (
  level  int primary key,
  min_xp int not null
);

alter table public.xp_level enable row level security;

drop policy if exists "xp_level_select" on public.xp_level;
create policy "xp_level_select" on public.xp_level for select to anon, authenticated using (true);

-- Curva: min_xp(nível) = 25 * (n-1) * n  → 0, 50, 150, 300, 500, 750, …
insert into public.xp_level (level, min_xp)
select g, (25 * (g - 1) * g)::int
from generate_series(1, 30) as g
where not exists (select 1 from public.xp_level);

-- -----------------------------------------------------------------------------
-- Coluna de idempotência no jogo.
-- -----------------------------------------------------------------------------
alter table public.game add column if not exists xp_processed_at timestamptz;

-- =============================================================================
-- Atribuição de XP (idempotente). Corre quando o jogo fecha.
-- =============================================================================
create or replace function public.award_game_xp(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_game public.game%rowtype;
begin
  select * into v_game from public.game where id = p_game_id;
  if v_game.id is null or v_game.xp_processed_at is not null then
    return; -- inexistente ou já processado (idempotente)
  end if;
  if v_game.status not in ('finished', 'voting_open', 'closed') then
    return;
  end if;

  -- Participação: todos os que estão no plantel.
  insert into public.xp_ledger (player_id, game_id, source_code, points, xp_rule_id)
  select gp.player_id, p_game_id, 'participation', ar.points, ar.rule_id
  from public.game_player gp, public.active_xp_rule('participation') ar
  where gp.game_id = p_game_id;

  -- Vitória: jogadores da equipa vencedora.
  insert into public.xp_ledger (player_id, game_id, source_code, points, xp_rule_id)
  select gp.player_id, p_game_id, 'win', ar.points, ar.rule_id
  from public.game_player gp, public.active_xp_rule('win') ar
  where gp.game_id = p_game_id
    and (
      (gp.team = 'A' and v_game.team_a_score > v_game.team_b_score)
      or (gp.team = 'B' and v_game.team_b_score > v_game.team_a_score)
    );

  -- Golos (um movimento por golo).
  insert into public.xp_ledger (player_id, game_id, source_code, points, xp_rule_id)
  select e.player_id, p_game_id, 'goal', ar.points, ar.rule_id
  from public.event e
  join public.event_type et on et.id = e.event_type_id, public.active_xp_rule('goal') ar
  where e.game_id = p_game_id and et.code = 'goal';

  -- Assistências.
  insert into public.xp_ledger (player_id, game_id, source_code, points, xp_rule_id)
  select e.player_id, p_game_id, 'assist', ar.points, ar.rule_id
  from public.event e
  join public.event_type et on et.id = e.event_type_id, public.active_xp_rule('assist') ar
  where e.game_id = p_game_id and et.code = 'assist';

  -- MVP (vencedor(es) da votação, se já fechada).
  insert into public.xp_ledger (player_id, game_id, source_code, points, xp_rule_id)
  select w.player_id, p_game_id, 'mvp', ar.points, ar.rule_id
  from (
    select t.votee_id as player_id
    from public.v_game_vote_tally t
    join (
      select max(votes) as mx
      from public.v_game_vote_tally
      where game_id = p_game_id and category = 'mvp'
    ) m on t.votes = m.mx
    where t.game_id = p_game_id and t.category = 'mvp' and t.votes > 0
  ) w, public.active_xp_rule('mvp') ar;

  update public.game set xp_processed_at = now() where id = p_game_id;
end $$;

-- Trigger: atribui XP quando o jogo passa a 'closed' (por cron ou manualmente).
create or replace function public.trg_award_xp_on_close()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'closed' and (old.status is distinct from 'closed') then
    perform public.award_game_xp(new.id);
  end if;
  return new;
end $$;

drop trigger if exists game_award_xp on public.game;
create trigger game_award_xp
  after update on public.game
  for each row execute function public.trg_award_xp_on_close();

-- =============================================================================
-- Vista de XP por jogador (total, nível, progresso).
-- =============================================================================
create or replace view public.v_player_xp
with (security_invoker = on) as
with totals as (
  select p.id as player_id, coalesce(sum(l.points), 0)::int as total_xp
  from public.profile p
  left join public.xp_ledger l on l.player_id = p.id
  group by p.id
)
select
  t.player_id,
  t.total_xp,
  coalesce((select max(lv.level) from public.xp_level lv where lv.min_xp <= t.total_xp), 1) as level,
  coalesce((select max(lv.min_xp) from public.xp_level lv where lv.min_xp <= t.total_xp), 0) as level_min_xp,
  (select min(lv.min_xp) from public.xp_level lv where lv.min_xp > t.total_xp) as next_level_xp
from totals t;

grant select on public.v_player_xp to anon, authenticated;
