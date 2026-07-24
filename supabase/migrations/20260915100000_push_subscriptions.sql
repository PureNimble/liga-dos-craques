-- =============================================================================
-- Push notifications (Web Push)
-- =============================================================================
-- Leva os avisos que já existem em `notification` para fora da app (PC/telemóvel),
-- via Web Push. Cada dispositivo em que o jogador aceita a permissão grava uma
-- subscrição; qualquer INSERT em `notification` dispara, de forma assíncrona,
-- a Edge Function `send-push` (via pg_net), que envia o push a cada subscrição
-- do jogador. O URL da function e o segredo partilhado ficam no Supabase Vault
-- (configurados fora deste ficheiro) - nunca em texto numa migração.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- PUSH_SUBSCRIPTION (uma linha por dispositivo/browser inscrito)
-- -----------------------------------------------------------------------------
create table if not exists public.push_subscription (
  id         bigint generated always as identity primary key,
  user_id    uuid not null references public.profile (id) on delete cascade,
  endpoint   text not null unique,
  p256dh     text not null,
  auth_key   text not null,
  created_at timestamptz not null default now()
);

comment on table public.push_subscription is 'Subscrições Web Push por dispositivo; escritas pelo próprio dono.';

create index if not exists push_subscription_user_idx on public.push_subscription (user_id);

alter table public.push_subscription enable row level security;

drop policy if exists "push_subscription_select_own" on public.push_subscription;
create policy "push_subscription_select_own"
  on public.push_subscription for select
  to authenticated
  using (user_id = auth.uid());

drop policy if exists "push_subscription_insert_own" on public.push_subscription;
create policy "push_subscription_insert_own"
  on public.push_subscription for insert
  to authenticated
  with check (user_id = auth.uid());

drop policy if exists "push_subscription_delete_own" on public.push_subscription;
create policy "push_subscription_delete_own"
  on public.push_subscription for delete
  to authenticated
  using (user_id = auth.uid());

-- Sem UPDATE: reinscrever é apagar + inserir do lado do cliente.
revoke insert, update, delete on public.push_subscription from authenticated;
grant select, delete on public.push_subscription to authenticated;
grant insert (user_id, endpoint, p256dh, auth_key) on public.push_subscription to authenticated;

-- -----------------------------------------------------------------------------
-- Trigger: cada novo aviso dispara o envio do push (assíncrono, via pg_net).
-- -----------------------------------------------------------------------------
-- pg_net não é relocatable - instala sempre no seu próprio schema `net`.
create extension if not exists pg_net;

create or replace function public.push_notify_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_url    text;
  v_secret text;
begin
  select decrypted_secret into v_url
    from vault.decrypted_secrets where name = 'push_function_url';
  select decrypted_secret into v_secret
    from vault.decrypted_secrets where name = 'push_function_secret';

  -- Sem configuração no Vault (ex.: ambiente local sem os segredos), não há push.
  if v_url is null or v_secret is null then
    return new;
  end if;

  perform net.http_post(
    url := v_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_secret
    ),
    body := jsonb_build_object(
      'user_id', new.user_id,
      'title', new.title,
      'body', new.body,
      'data', new.data
    )
  );

  return new;
end $$;

comment on function public.push_notify_trigger() is 'Envia cada aviso novo como Web Push via a Edge Function send-push.';

drop trigger if exists notification_push on public.notification;
create trigger notification_push
  after insert on public.notification
  for each row execute function public.push_notify_trigger();
