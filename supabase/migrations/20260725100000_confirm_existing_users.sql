-- =============================================================================
-- Desbloquear contas presas por confirmação de email
-- =============================================================================
-- O plano gratuito do Supabase tem limites de envio de email muito baixos, pelo
-- que a confirmação de email obrigatória impede as pessoas de entrar. Decidimos
-- NÃO exigir confirmação (app entre amigos).
--
-- Esta migração confirma retroativamente todos os utilizadores já registados
-- (que ficaram com email_confirmed_at a NULL). Para NOVOS registos, é preciso
-- desligar "Confirm email" no painel Supabase (ver docs/AUTH-SEM-EMAIL.md).
-- =============================================================================

update auth.users
set email_confirmed_at = coalesce(email_confirmed_at, now())
where email_confirmed_at is null;
