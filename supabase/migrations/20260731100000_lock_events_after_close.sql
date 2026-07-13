-- =============================================================================
-- Bloquear eventos após o apuramento (fase de revisão vs jogo fechado)
-- =============================================================================
-- Ciclo: 'in_progress' (registo ao vivo) → 'finished' (REVISÃO: ainda se podem
-- adicionar/corrigir eventos em falta) → apuramento MVP/Flop → 'voting_open' ou
-- 'closed' (FECHADO: eventos bloqueados, porque as avaliações já foram fixadas).
-- Até aqui o RLS só verificava o organizador; passa a exigir também que o jogo
-- esteja numa fase editável.
-- =============================================================================

create or replace function public.is_game_events_editable(p_game_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_game_organizer(p_game_id)
    and exists (
      select 1 from public.game g
      where g.id = p_game_id and g.status in ('in_progress', 'finished')
    );
$$;

grant execute on function public.is_game_events_editable(uuid) to authenticated;

-- Eventos: inserir/apagar só nas fases editáveis (ao vivo + revisão).
drop policy if exists "event_insert_organizer" on public.event;
create policy "event_insert_organizer"
  on public.event for insert
  to authenticated
  with check (public.is_game_events_editable(game_id) and created_by = auth.uid());

drop policy if exists "event_delete_organizer" on public.event;
create policy "event_delete_organizer"
  on public.event for delete
  to authenticated
  using (public.is_game_events_editable(game_id));

-- Tags dos eventos seguem a mesma regra.
drop policy if exists "event_tag_write_organizer" on public.event_tag;
create policy "event_tag_write_organizer"
  on public.event_tag for all
  to authenticated
  using (
    exists (
      select 1 from public.event e
      where e.id = event_id and public.is_game_events_editable(e.game_id)
    )
  )
  with check (
    exists (
      select 1 from public.event e
      where e.id = event_id and public.is_game_events_editable(e.game_id)
    )
  );
