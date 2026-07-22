-- =============================================================================
-- Notificações + conquistas revogáveis
-- =============================================================================
-- Reabrir e corrigir um jogo pode fazer um jogador deixar de cumprir o critério
-- de uma conquista. Até aqui a avaliação só dava conquistas; passa a tirá-las
-- também — e ninguém fica a descobrir sozinho: cada remoção deixa um aviso na
-- caixa de notificações do jogador (`/notifications`).
--
-- A avaliação só revoga o que sabe avaliar (critérios `stat` com métrica
-- conhecida e o `special` do hat-trick). Critério que não saiba ler nunca tira
-- nada — uma conquista nova mal configurada não apaga o que já foi ganho.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- NOTIFICATION (avisos por jogador)
-- -----------------------------------------------------------------------------
create table if not exists public.notification (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profile (id) on delete cascade,
  kind       text not null check (char_length(kind) between 1 and 40),
  title      text not null check (char_length(title) between 1 and 120),
  body       text check (body is null or char_length(body) <= 500),
  data       jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  read_at    timestamptz
);

comment on table public.notification is 'Avisos ao jogador (ex.: conquista removida). Escritos só pelo servidor.';

create index if not exists notification_user_idx on public.notification (user_id, created_at desc);

alter table public.notification enable row level security;

-- Leitura: só as próprias.
drop policy if exists "notification_select_own" on public.notification;
create policy "notification_select_own"
  on public.notification for select
  to authenticated
  using (user_id = auth.uid());

-- Marcar como lida: só as próprias, e só a coluna read_at (GRANT por coluna).
drop policy if exists "notification_update_own" on public.notification;
create policy "notification_update_own"
  on public.notification for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Sem INSERT/DELETE ao cliente: quem escreve avisos é o servidor.
revoke insert, update, delete on public.notification from authenticated;
grant select on public.notification to authenticated;
grant update (read_at) on public.notification to authenticated;

-- -----------------------------------------------------------------------------
-- Helper interno para deixar um aviso (não concedido a clientes).
-- -----------------------------------------------------------------------------
create or replace function public.notify_user(
  p_user_id uuid,
  p_kind text,
  p_title text,
  p_body text default null,
  p_data jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.notification (user_id, kind, title, body, data)
  values (p_user_id, p_kind, p_title, p_body, coalesce(p_data, '{}'::jsonb));
$$;

revoke all on function public.notify_user(uuid, text, text, text, jsonb) from public;

-- -----------------------------------------------------------------------------
-- Avaliação de conquistas nos dois sentidos (dá e tira).
-- -----------------------------------------------------------------------------
create or replace function public.evaluate_player_achievements(p_player_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  s public.v_player_stats%rowtype;
  a public.achievement%rowtype;
  v_max_goals int;
  v_val int;
  v_ok boolean;
  v_known boolean;
  v_removed int;
begin
  select * into s from public.v_player_stats where player_id = p_player_id;
  if not found then
    return;
  end if;

  -- Máximo de golos num único jogo (para conquistas "special").
  select coalesce(max(cnt), 0) into v_max_goals
  from (
    select count(*) as cnt
    from public.event e
    join public.event_type et on et.id = e.event_type_id
    where e.player_id = p_player_id and et.code = 'goal'
    group by e.game_id
  ) q;

  for a in select * from public.achievement where active loop
    v_ok := false;
    v_known := false;

    if a.criteria ->> 'type' = 'stat' then
      v_val := case a.criteria ->> 'metric'
        when 'games' then s.games
        when 'wins' then s.wins
        when 'draws' then s.draws
        when 'losses' then s.losses
        when 'goals' then s.goals
        when 'assists' then s.assists
        when 'saves' then s.saves
        when 'mvps' then s.mvps
        else null
      end;
      if v_val is not null and (a.criteria ->> 'gte') ~ '^\d+$' then
        v_known := true;
        v_ok := v_val >= (a.criteria ->> 'gte')::int;
      end if;

    elsif a.criteria ->> 'type' = 'special' and a.criteria ->> 'key' = 'hat_trick' then
      v_known := true;
      v_ok := v_max_goals >= 3;
    end if;

    if v_ok then
      insert into public.user_achievement (player_id, achievement_id)
      values (p_player_id, a.id)
      on conflict do nothing;

    elsif v_known then
      -- Deixou de cumprir: tira-se e avisa-se (só se estava mesmo desbloqueada).
      delete from public.user_achievement
       where player_id = p_player_id and achievement_id = a.id;
      get diagnostics v_removed = row_count;

      if v_removed > 0 then
        perform public.notify_user(
          p_player_id,
          'achievement_revoked',
          format('Conquista removida: %s', a.label),
          format(
            'Depois de uma correção nos jogos deixaste de cumprir o critério (%s). Volta a ser tua assim que o cumprires outra vez.',
            a.description
          ),
          jsonb_build_object('achievement_code', a.code, 'achievement_id', a.id)
        );
      end if;
    end if;
  end loop;
end $$;

comment on function public.evaluate_player_achievements(uuid) is 'Dá e tira conquistas conforme os critérios; cada remoção deixa um aviso ao jogador.';

-- -----------------------------------------------------------------------------
-- Reabrir um jogo passa a avisar quem lá jogou (a XP sai e volta ao fechar).
-- -----------------------------------------------------------------------------
create or replace function public.admin_reopen_game(p_game_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_status text;
  v_when timestamptz;
  r record;
begin
  if not public.is_admin() then
    raise exception 'Apenas admin';
  end if;

  select status, scheduled_at into v_status, v_when from public.game where id = p_game_id;
  if v_status is null then
    raise exception 'Jogo inexistente';
  end if;
  if v_status not in ('closed', 'voting_open') then
    raise exception 'Só se reabrem jogos fechados';
  end if;

  -- Estorno da XP deste jogo (a soma dos movimentos passa a zero).
  insert into public.xp_ledger (player_id, game_id, source_code, points, xp_rule_id)
  select player_id, game_id, source_code, -points, xp_rule_id
  from public.xp_ledger
  where game_id = p_game_id and points <> 0;

  update public.game
     set status = 'finished',
         xp_processed_at = null,
         voting_closes_at = null
   where id = p_game_id;

  for r in select player_id from public.game_player where game_id = p_game_id loop
    perform public.notify_user(
      r.player_id,
      'game_reopened',
      'Jogo reaberto para correção',
      format(
        'O jogo de %s está a ser corrigido. A XP desse jogo foi retirada e volta a ser atribuída, já com os dados certos, quando o jogo fechar outra vez.',
        to_char(v_when, 'DD/MM/YYYY')
      ),
      jsonb_build_object('game_id', p_game_id)
    );
  end loop;
end $$;
