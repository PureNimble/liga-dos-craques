-- =============================================================================
-- Crossbar Challenge · sessão ao vivo (jogo guiado)
-- =============================================================================
-- A app conduz o desafio no dia: adiciona-se os jogadores, sorteia-se a ordem e
-- vai-se registando acerto/falha remate a remate. Ganha o primeiro que acerta em
-- todas as posições - e é gravado como uma tentativa vencedora em challenge_attempt
-- (alimenta o v_challenge_leaderboard existente).
-- =============================================================================

-- -----------------------------------------------------------------------------
-- CHALLENGE_SESSION - uma sessão ao vivo de um desafio (por agora, crossbar).
-- -----------------------------------------------------------------------------
create table if not exists public.challenge_session (
  id                 uuid primary key default gen_random_uuid(),
  challenge_id       bigint not null references public.challenge (id) on delete cascade,
  spot_count         int not null check (spot_count > 0),
  status             text not null default 'setup' check (status in ('setup', 'active', 'finished')),
  current_turn_index int not null default 0,
  winner_id          uuid references public.profile (id) on delete set null,
  created_by         uuid not null references public.profile (id),
  created_at         timestamptz not null default now(),
  finished_at        timestamptz
);

create index if not exists idx_challenge_session_challenge on public.challenge_session (challenge_id);

alter table public.challenge_session enable row level security;

drop policy if exists "challenge_session_select" on public.challenge_session;
create policy "challenge_session_select"
  on public.challenge_session for select to authenticated using (true);

drop policy if exists "challenge_session_insert" on public.challenge_session;
create policy "challenge_session_insert"
  on public.challenge_session for insert to authenticated
  with check (created_by = auth.uid());

drop policy if exists "challenge_session_update" on public.challenge_session;
create policy "challenge_session_update"
  on public.challenge_session for update to authenticated
  using (created_by = auth.uid() or public.is_admin())
  with check (created_by = auth.uid() or public.is_admin());

drop policy if exists "challenge_session_delete" on public.challenge_session;
create policy "challenge_session_delete"
  on public.challenge_session for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

-- -----------------------------------------------------------------------------
-- SESSION_PLAYER - participantes da sessão, ordem de jogo e progresso.
-- current_spot = índice da posição que o jogador vai tentar a seguir.
-- current_spot == challenge_session.spot_count ⇒ completou todas.
-- -----------------------------------------------------------------------------
create table if not exists public.session_player (
  id           uuid primary key default gen_random_uuid(),
  session_id   uuid not null references public.challenge_session (id) on delete cascade,
  player_id    uuid not null references public.profile (id) on delete cascade,
  turn_order   int not null default 0,
  current_spot int not null default 0,
  unique (session_id, player_id)
);

create index if not exists idx_session_player_session on public.session_player (session_id);

alter table public.session_player enable row level security;

-- Escrita permitida ao dono da sessão (ou admin); leitura a todos os autenticados.
drop policy if exists "session_player_select" on public.session_player;
create policy "session_player_select"
  on public.session_player for select to authenticated using (true);

drop policy if exists "session_player_write" on public.session_player;
create policy "session_player_write"
  on public.session_player for all to authenticated
  using (
    exists (
      select 1 from public.challenge_session s
      where s.id = session_id and (s.created_by = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.challenge_session s
      where s.id = session_id and (s.created_by = auth.uid() or public.is_admin())
    )
  );

-- -----------------------------------------------------------------------------
-- SESSION_TURN - histórico de cada remate (auditável, base para futura anulação).
-- -----------------------------------------------------------------------------
create table if not exists public.session_turn (
  id         uuid primary key default gen_random_uuid(),
  session_id uuid not null references public.challenge_session (id) on delete cascade,
  player_id  uuid not null references public.profile (id) on delete cascade,
  spot_index int not null,
  hit        boolean not null,
  turn_no    int not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_session_turn_session on public.session_turn (session_id);

alter table public.session_turn enable row level security;

drop policy if exists "session_turn_select" on public.session_turn;
create policy "session_turn_select"
  on public.session_turn for select to authenticated using (true);

drop policy if exists "session_turn_write" on public.session_turn;
create policy "session_turn_write"
  on public.session_turn for all to authenticated
  using (
    exists (
      select 1 from public.challenge_session s
      where s.id = session_id and (s.created_by = auth.uid() or public.is_admin())
    )
  )
  with check (
    exists (
      select 1 from public.challenge_session s
      where s.id = session_id and (s.created_by = auth.uid() or public.is_admin())
    )
  );

-- -----------------------------------------------------------------------------
-- crossbar_start_session - sorteia a ordem e arranca a sessão.
-- -----------------------------------------------------------------------------
create or replace function public.crossbar_start_session(p_session_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.challenge_session;
  v_count   int;
begin
  select * into v_session from public.challenge_session where id = p_session_id;
  if v_session.id is null then
    raise exception 'Sessão inexistente.';
  end if;
  if v_session.created_by <> auth.uid() and not public.is_admin() then
    raise exception 'Sem permissão para gerir esta sessão.';
  end if;
  if v_session.status <> 'setup' then
    raise exception 'A sessão já foi iniciada.';
  end if;

  select count(*) into v_count from public.session_player where session_id = p_session_id;
  if v_count < 2 then
    raise exception 'São precisos pelo menos 2 jogadores.';
  end if;

  -- Ordem aleatória: 0..n-1 por random().
  with ordered as (
    select id, row_number() over (order by random()) - 1 as ord
    from public.session_player
    where session_id = p_session_id
  )
  update public.session_player sp
  set turn_order = ordered.ord
  from ordered
  where sp.id = ordered.id;

  update public.challenge_session
  set status = 'active', current_turn_index = 0
  where id = p_session_id;
end $$;

grant execute on function public.crossbar_start_session(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- crossbar_record_turn - regista o remate do jogador da vez e avança o jogo.
-- Acerta → sobe uma posição; se completar todas, termina e grava a vitória.
-- Passa sempre a vez ao jogador seguinte (1 remate por turno).
-- Devolve o novo status ('active' | 'finished').
-- -----------------------------------------------------------------------------
create or replace function public.crossbar_record_turn(p_session_id uuid, p_hit boolean)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session   public.challenge_session;
  v_player    public.session_player;
  v_count     int;
  v_turn_no   int;
  v_new_spot  int;
begin
  select * into v_session from public.challenge_session where id = p_session_id;
  if v_session.id is null then
    raise exception 'Sessão inexistente.';
  end if;
  if v_session.created_by <> auth.uid() and not public.is_admin() then
    raise exception 'Sem permissão para gerir esta sessão.';
  end if;
  if v_session.status <> 'active' then
    raise exception 'A sessão não está a decorrer.';
  end if;

  select * into v_player
  from public.session_player
  where session_id = p_session_id and turn_order = v_session.current_turn_index;
  if v_player.id is null then
    raise exception 'Jogador da vez não encontrado.';
  end if;

  select coalesce(max(turn_no), 0) + 1 into v_turn_no
  from public.session_turn where session_id = p_session_id;

  insert into public.session_turn (session_id, player_id, spot_index, hit, turn_no)
  values (p_session_id, v_player.player_id, v_player.current_spot, p_hit, v_turn_no);

  v_new_spot := v_player.current_spot + (case when p_hit then 1 else 0 end);
  if p_hit then
    update public.session_player set current_spot = v_new_spot where id = v_player.id;
  end if;

  -- Completou todas as posições → vencedor.
  if p_hit and v_new_spot >= v_session.spot_count then
    update public.challenge_session
    set status = 'finished', winner_id = v_player.player_id, finished_at = now()
    where id = p_session_id;

    insert into public.challenge_attempt (challenge_id, player_id, score, result, created_by)
    values (v_session.challenge_id, v_player.player_id, v_session.spot_count, 'win', auth.uid());

    return 'finished';
  end if;

  -- Passa a vez ao jogador seguinte.
  select count(*) into v_count from public.session_player where session_id = p_session_id;
  update public.challenge_session
  set current_turn_index = (v_session.current_turn_index + 1) % v_count
  where id = p_session_id;

  return 'active';
end $$;

grant execute on function public.crossbar_record_turn(uuid, boolean) to authenticated;
