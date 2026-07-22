-- =============================================================================
-- Grupos · backfill (dados existentes entram todos num grupo "Peladinhas")
-- =============================================================================
-- A app já tem jogos/xp/conquistas/tentativas de desafio e perfis reais em
-- produção. Cria-se UM grupo original com todos os perfis existentes como
-- membros (admins da app tornam-se também admins deste grupo) e todo o
-- histórico é associado a ele — nada se perde, a app continua a funcionar
-- como antes para quem já lá está, só que agora dentro de um grupo com nome.
--
-- Idempotente: identifica o grupo original pelo invite_code fixo 'ORIGINAL'.
-- Numa BD vazia (sem perfis), não há nada para associar — os NOT NULL a seguir
-- ficam corretos na mesma porque as tabelas ficam vazias.
-- =============================================================================

do $do$
declare
  v_group_id uuid;
  v_owner    uuid;
begin
  select id into v_group_id from public.app_group where invite_code = 'ORIGINAL';

  if v_group_id is null then
    select id into v_owner from public.profile where role = 'admin' order by created_at limit 1;
    if v_owner is null then
      select id into v_owner from public.profile order by created_at limit 1;
    end if;

    if v_owner is not null then
      insert into public.app_group (name, invite_code, created_by)
      values ('Peladinhas', 'ORIGINAL', v_owner)
      returning id into v_group_id;

      insert into public.group_member (group_id, player_id, role)
      select v_group_id, id, case when role = 'admin' then 'admin' else 'member' end
      from public.profile;
    end if;
  end if;

  if v_group_id is not null then
    update public.game set group_id = v_group_id where group_id is null;
    update public.xp_ledger set group_id = v_group_id where group_id is null;
    update public.user_achievement set group_id = v_group_id where group_id is null;
    update public.challenge_attempt set group_id = v_group_id where group_id is null;
    update public.challenge_session set group_id = v_group_id where group_id is null;
    update public.profile set active_group_id = v_group_id where active_group_id is null;
  end if;
end $do$;

alter table public.game alter column group_id set not null;
alter table public.xp_ledger alter column group_id set not null;
alter table public.challenge_attempt alter column group_id set not null;
alter table public.challenge_session alter column group_id set not null;

-- Conquistas passam a ser desbloqueadas por grupo (o mesmo jogador pode
-- desbloquear "10 jogos" outra vez num grupo diferente) — a chave primária
-- ganha group_id.
alter table public.user_achievement drop constraint if exists user_achievement_pkey;
alter table public.user_achievement alter column group_id set not null;
alter table public.user_achievement add primary key (player_id, achievement_id, group_id);
