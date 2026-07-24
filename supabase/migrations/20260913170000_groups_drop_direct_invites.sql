-- =============================================================================
-- Grupos · remove os convites diretos a utilizadores existentes
-- =============================================================================
-- Simplificação de produto: entrar num grupo privado passa a ser SÓ por
-- código de convite (join_group_by_code); grupos públicos continuam a
-- entrar-se diretamente (join_public_group). O convite dirigido a uma pessoa
-- específica (invite_user_to_group/accept_.../decline_.../cancel_...) deixa
-- de existir - nada mais escreve em group_invite, por isso a tabela também
-- sai.
-- =============================================================================

drop function if exists public.invite_user_to_group(uuid, uuid);
drop function if exists public.accept_group_invite(uuid);
drop function if exists public.decline_group_invite(uuid);
drop function if exists public.cancel_group_invite(uuid);

drop table if exists public.group_invite;
