# Autenticação sem dependência de email

**Decisão:** app entre amigos → **não exigir confirmação de email**. O serviço de
email gratuito do Supabase tem limites de envio muito baixos, que bloqueavam o
registo/login. Com a confirmação desligada, criar conta com email+password entra
logo, sem qualquer email.

## Passo obrigatório no painel Supabase (só tu podes fazer)

1. Abre o teu projeto em https://supabase.com/dashboard
2. **Authentication → Sign In / Providers → Email** (em versões antigas: **Authentication → Providers → Email**)
3. **Desliga "Confirm email"** (Confirmar email) → **Save**

A partir daí, novos registos são criados e autenticados de imediato.

> Alternativa em algumas versões do painel: **Authentication → Settings →
> "Enable email confirmations"** → desligar.

## O que já foi tratado no código/BD

- Migração `20260725100000_confirm_existing_users.sql` **confirma retroativamente**
  todos os utilizadores que já tinham ficado presos (email_confirmed_at a NULL),
  para poderem entrar assim que o deploy correr.
- `config.toml` documenta `enable_confirmations = false` (afeta o ambiente local).

## E o "link mágico" e a recuperação de password?

Ambos **enviam email**, por isso continuam sujeitos aos mesmos limites baixos:

- **Recuperação de password:** uso ocasional; deve funcionar na maioria dos casos,
  mas pode falhar se muitos emails forem enviados na mesma hora.
- **Link mágico:** mesma limitação. O fluxo recomendado é **email + password**
  (que não envia email nenhum).

Se quiseres eliminar totalmente a dependência de email, opções futuras:
- Remover o "link mágico" da UI e deixar só password.
- Recuperação de password feita por um admin (repõe a password do utilizador no
  painel/`/admin`) em vez de email.
- Configurar um SMTP próprio (ex.: um serviço gratuito com limites maiores) em
  **Authentication → SMTP Settings** — deixa de depender do email do Supabase.
