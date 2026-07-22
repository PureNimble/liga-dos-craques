-- =============================================================================
-- Avisos de convocatória (convite, confirmação, recusa, saída)
-- =============================================================================
-- O plantel move-se de quatro maneiras: o organizador convida (INSERT como
-- 'invited'), o jogador inscreve-se (INSERT como 'confirmed'), confirma ou
-- desmarca (UPDATE ao status) e sai ou é retirado (DELETE). Cada uma delas
-- passa a deixar um aviso a quem interessa:
--
--   • convidado          → o jogador convidado
--   • inscreveu-se       → o organizador
--   • confirmou/desmarcou→ o organizador
--   • saiu               → o organizador
--   • foi retirado       → o jogador
--
-- Quem faz a ação nunca é notificado da própria ação. Como os avisos nascem em
-- trigger, valem para qualquer caminho de escrita — app, admin ou SQL à mão.
-- =============================================================================

create or replace function public.trg_notify_game_player()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.game_player%rowtype := coalesce(new, old);
  v_actor uuid := auth.uid();
  v_organizer uuid;
  v_when timestamptz;
  v_label text;
  v_name text;
begin
  select created_by, scheduled_at into v_organizer, v_when
    from public.game where id = v_row.game_id;
  if v_organizer is null then
    return coalesce(new, old);
  end if;

  v_label := to_char(v_when at time zone 'Europe/Lisbon', 'DD/MM "às" HH24:MI');
  select name into v_name from public.profile where id = v_row.player_id;
  v_name := coalesce(v_name, 'Um jogador');

  if tg_op = 'INSERT' then
    if new.player_id is distinct from v_actor then
      perform public.notify_user(
        new.player_id,
        'game_invite',
        'Convite para um jogo',
        format('Foste convocado para o jogo de %s. Confirma se contas ir.', v_label),
        jsonb_build_object('game_id', new.game_id)
      );
    elsif v_organizer is distinct from v_actor then
      perform public.notify_user(
        v_organizer,
        'game_rsvp',
        format('%s juntou-se ao jogo', v_name),
        format('Inscreveu-se no jogo de %s.', v_label),
        jsonb_build_object('game_id', new.game_id, 'player_id', new.player_id)
      );
    end if;

  elsif tg_op = 'UPDATE' then
    if new.status is distinct from old.status and v_organizer is distinct from v_actor then
      if new.status = 'confirmed' then
        perform public.notify_user(
          v_organizer,
          'game_rsvp',
          format('%s confirmou presença', v_name),
          format('Vai ao jogo de %s.', v_label),
          jsonb_build_object('game_id', new.game_id, 'player_id', new.player_id)
        );
      elsif old.status = 'confirmed' and new.status = 'invited' then
        perform public.notify_user(
          v_organizer,
          'game_rsvp',
          format('%s desmarcou a presença', v_name),
          format('Já não conta como confirmado no jogo de %s.', v_label),
          jsonb_build_object('game_id', new.game_id, 'player_id', new.player_id)
        );
      end if;
    end if;

  elsif tg_op = 'DELETE' then
    if old.player_id is not distinct from v_actor then
      if v_organizer is distinct from v_actor then
        perform public.notify_user(
          v_organizer,
          'game_rsvp',
          format('%s saiu do jogo', v_name),
          format('Deixou o plantel do jogo de %s.', v_label),
          jsonb_build_object('game_id', old.game_id, 'player_id', old.player_id)
        );
      end if;
    else
      perform public.notify_user(
        old.player_id,
        'game_rsvp',
        'Saíste do plantel',
        format('Já não estás no jogo de %s.', v_label),
        jsonb_build_object('game_id', old.game_id)
      );
    end if;
  end if;

  return coalesce(new, old);
end $$;

comment on function public.trg_notify_game_player() is 'Avisa convidado/organizador sobre convites e confirmações do plantel.';

drop trigger if exists game_player_notify on public.game_player;
create trigger game_player_notify
  after insert or update or delete on public.game_player
  for each row execute function public.trg_notify_game_player();
