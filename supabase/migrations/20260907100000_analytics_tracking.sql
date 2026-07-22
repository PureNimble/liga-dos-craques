-- =============================================================================
-- Tracking de utilização (com consentimento explícito)
-- =============================================================================
-- Para o dashboard de analytics saber o que se usa mesmo (páginas, sessões),
-- e não só inferir a partir dos dados de domínio.
--
-- Privacidade: nada é registado sem consentimento — o INSERT em `app_event`
-- exige uma linha `analytics_consent` com `granted = true`. Retirar o
-- consentimento apaga o histórico do próprio (RPC `analytics_set_consent`).
-- Só o admin lê os eventos; ninguém os altera ou apaga diretamente.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- ANALYTICS_CONSENT (decisão de cada jogador)
-- -----------------------------------------------------------------------------
create table if not exists public.analytics_consent (
  user_id    uuid primary key references public.profile (id) on delete cascade,
  granted    boolean not null,
  decided_at timestamptz not null default now()
);

comment on table public.analytics_consent is 'Consentimento de tracking por jogador; sem linha = ainda não decidiu.';

alter table public.analytics_consent enable row level security;

-- Leitura: o próprio vê a sua decisão; o admin vê todas (para medir cobertura).
drop policy if exists "analytics_consent_select" on public.analytics_consent;
create policy "analytics_consent_select"
  on public.analytics_consent for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());

-- Escrita só pela RPC (security definer) — daí não haver políticas de escrita.
revoke insert, update, delete on public.analytics_consent from authenticated;
grant select on public.analytics_consent to authenticated;

-- -----------------------------------------------------------------------------
-- APP_EVENT (eventos de utilização, append-only)
-- -----------------------------------------------------------------------------
create table if not exists public.app_event (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profile (id) on delete cascade,
  session_id uuid not null,
  name       text not null check (char_length(name) between 1 and 60),
  path       text check (path is null or char_length(path) <= 200),
  props      jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

comment on table public.app_event is 'Eventos de utilização (page_view, session_start). Só com consentimento.';
comment on column public.app_event.path is 'Rota normalizada (ex.: /games/:id) — não guarda ids de entidades.';

create index if not exists app_event_created_at_idx on public.app_event (created_at desc);
create index if not exists app_event_user_idx on public.app_event (user_id);

alter table public.app_event enable row level security;

-- Leitura: só admin (é dado agregado de gestão).
drop policy if exists "app_event_select_admin" on public.app_event;
create policy "app_event_select_admin"
  on public.app_event for select
  to authenticated
  using (public.is_admin());

-- Escrita: só em nome próprio e só com consentimento ativo.
drop policy if exists "app_event_insert_self" on public.app_event;
create policy "app_event_insert_self"
  on public.app_event for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.analytics_consent c
      where c.user_id = auth.uid() and c.granted
    )
  );

-- Sem UPDATE/DELETE: append-only. Apagar acontece ao retirar o consentimento.
revoke insert, update, delete on public.app_event from authenticated;
grant select on public.app_event to authenticated;
grant insert (user_id, session_id, name, path, props) on public.app_event to authenticated;

-- -----------------------------------------------------------------------------
-- RPC: decidir (ou mudar) o consentimento
-- -----------------------------------------------------------------------------
create or replace function public.analytics_set_consent(p_granted boolean)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Sem sessão';
  end if;

  insert into public.analytics_consent (user_id, granted, decided_at)
  values (auth.uid(), p_granted, now())
  on conflict (user_id) do update
    set granted = excluded.granted, decided_at = now();

  -- Retirar o consentimento apaga o histórico já recolhido.
  if not p_granted then
    delete from public.app_event where user_id = auth.uid();
  end if;
end $$;

comment on function public.analytics_set_consent(boolean) is 'Aceita/retira o tracking; retirar apaga os eventos do próprio.';

revoke all on function public.analytics_set_consent(boolean) from public;
grant execute on function public.analytics_set_consent(boolean) to authenticated;
