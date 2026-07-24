-- =============================================================================
-- Grupos · convites diretos a utilizadores existentes
-- =============================================================================
-- Complementa o código de convite (join_group_by_code) com um convite dirigido
-- a um utilizador já registado - assíncrono, por isso fica pendente até ser
-- aceite/recusado. Não há sistema de notificações na app: a superfície é a
-- própria lista de convites pendentes (invitee_id = auth.uid()), sem bell/inbox
-- genérico - seria over-engineering para este único caso de uso.
-- =============================================================================

create table if not exists public.group_invite (
  id           uuid primary key default gen_random_uuid(),
  group_id     uuid not null references public.app_group (id) on delete cascade,
  invitee_id   uuid not null references public.profile (id) on delete cascade,
  invited_by   uuid not null references public.profile (id),
  status       text not null default 'pending' check (status in ('pending', 'accepted', 'declined', 'cancelled')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz
);

create index if not exists idx_group_invite_invitee on public.group_invite (invitee_id);
create index if not exists idx_group_invite_group on public.group_invite (group_id);

-- Só um convite PENDENTE por (grupo, convidado) de cada vez - recusar/cancelar
-- liberta para voltar a convidar a mesma pessoa mais tarde.
create unique index if not exists uq_group_invite_pending
  on public.group_invite (group_id, invitee_id)
  where status = 'pending';

comment on table public.group_invite is 'Convite direto a um utilizador existente. Escrita só por RPCs.';

alter table public.group_invite enable row level security;

drop policy if exists "group_invite_select" on public.group_invite;
create policy "group_invite_select"
  on public.group_invite for select to authenticated
  using (invitee_id = auth.uid() or public.is_group_admin(group_id));

revoke insert, update, delete on public.group_invite from authenticated;

-- -----------------------------------------------------------------------------
-- RPCs
-- -----------------------------------------------------------------------------
create or replace function public.invite_user_to_group(p_group_id uuid, p_invitee_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  if not public.is_group_admin(p_group_id) then
    raise exception 'Sem permissão para gerir este grupo.';
  end if;
  if exists (
    select 1 from public.group_member where group_id = p_group_id and player_id = p_invitee_id
  ) then
    raise exception 'Já é membro do grupo.';
  end if;

  insert into public.group_invite (group_id, invitee_id, invited_by)
  values (p_group_id, p_invitee_id, auth.uid())
  returning id into v_id;

  return v_id;
end $$;

grant execute on function public.invite_user_to_group(uuid, uuid) to authenticated;

create or replace function public.accept_group_invite(p_invite_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.group_invite;
begin
  select * into v_invite from public.group_invite where id = p_invite_id;
  if v_invite.id is null or v_invite.invitee_id <> auth.uid() or v_invite.status <> 'pending' then
    raise exception 'Convite inválido.';
  end if;

  update public.group_invite set status = 'accepted', responded_at = now() where id = p_invite_id;

  insert into public.group_member (group_id, player_id, role)
  values (v_invite.group_id, auth.uid(), 'member')
  on conflict do nothing;

  update public.profile set active_group_id = v_invite.group_id where id = auth.uid();

  return v_invite.group_id;
end $$;

grant execute on function public.accept_group_invite(uuid) to authenticated;

create or replace function public.decline_group_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.group_invite
  set status = 'declined', responded_at = now()
  where id = p_invite_id and invitee_id = auth.uid() and status = 'pending';
end $$;

grant execute on function public.decline_group_invite(uuid) to authenticated;

create or replace function public.cancel_group_invite(p_invite_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_group_id uuid;
begin
  select group_id into v_group_id from public.group_invite where id = p_invite_id and status = 'pending';
  if v_group_id is null or not public.is_group_admin(v_group_id) then
    raise exception 'Sem permissão.';
  end if;
  update public.group_invite set status = 'cancelled', responded_at = now() where id = p_invite_id;
end $$;

grant execute on function public.cancel_group_invite(uuid) to authenticated;
