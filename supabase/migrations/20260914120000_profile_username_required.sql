-- =============================================================================
-- Nome de utilizador deixa de ser opcional — passa a ser pedido no registo
-- (necessário para o login por username, ver 20260914110000) e a ser
-- exigido para sempre haver um valor a resolver.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Backfill: perfis existentes sem username recebem um derivado do nome,
-- desambiguado com sufixo numérico em caso de colisão. Os donos podem
-- trocá-lo depois em Editar perfil.
-- -----------------------------------------------------------------------------
do $$
declare
  r record;
  base text;
  candidate text;
  suffix int;
begin
  for r in select id, name from public.profile where username is null loop
    base := lower(regexp_replace(coalesce(r.name, 'jogador'), '[^a-zA-Z0-9]+', '_', 'g'));
    base := trim(both '_' from base);
    if base = '' then
      base := 'jogador';
    end if;
    if length(base) < 3 then
      base := rpad(base, 3, '0');
    end if;
    base := left(base, 20);

    candidate := base;
    suffix := 1;
    while exists (select 1 from public.profile where username = candidate) loop
      suffix := suffix + 1;
      candidate := left(base, 20 - length(suffix::text) - 1) || '_' || suffix::text;
    end loop;

    update public.profile set username = candidate where id = r.id;
  end loop;
end $$;

alter table public.profile alter column username set not null;

-- -----------------------------------------------------------------------------
-- Registo: o signup passa a exigir username (enviado em raw_user_meta_data),
-- validado outra vez aqui como defesa em profundidade.
-- -----------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_username text := lower(trim(new.raw_user_meta_data ->> 'username'));
begin
  if v_username is null or v_username !~ '^[a-z0-9_]{3,20}$' then
    raise exception 'Nome de utilizador em falta ou inválido.';
  end if;

  insert into public.profile (id, name, username)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1)),
    v_username
  )
  on conflict (id) do nothing;
  return new;
end $$;

-- -----------------------------------------------------------------------------
-- Verificação de disponibilidade a partir do formulário de registo (ainda
-- sem sessão, por isso security definer — profile só é legível a
-- `authenticated`).
-- -----------------------------------------------------------------------------
create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.profile where username = lower(trim(p_username))
  );
$$;

grant execute on function public.username_available(text) to anon, authenticated;
