# F0 — Fundações · Plano de Execução

> Primeira fase do roadmap de [ARQUITETURA.md](ARQUITETURA.md). Objetivo: ter o **esqueleto ponta-a-ponta a funcionar em produção** — frontend publicado, Supabase ligado, CI/CD e keep-alive ativos — antes de escrever qualquer funcionalidade de domínio.
> **Ainda sem código de funcionalidades.** Este documento é o plano; a implementação só arranca após aprovação.

---

## 1. Objetivo da fase

No fim da F0, um `git push` para `main` deve:
1. Correr CI (lint + typecheck + build) automaticamente.
2. Publicar o frontend React na Vercel com HTTPS.
3. Aplicar migrações à base de dados Supabase.

E o projeto deve **manter-se acordado 24/7** sem intervenção manual.

**Critério de sucesso global:** abrir o URL público, ver a app React a carregar, confirmar que ela consegue falar com o Supabase (uma leitura trivial autenticada/anónima), e que o keep-alive corre sozinho.

**Fora de âmbito na F0:** auth real, perfis, jogos, qualquer tabela de domínio. Isso é F1+.

---

## 2. Pré-requisitos (contas — todas gratuitas)

| Conta | Para quê | Nota |
|---|---|---|
| GitHub | Repositório, CI/CD, cron | Provavelmente já existe |
| Supabase | Projeto Postgres+Auth+Storage | Criar 1 projeto "peladinhas" |
| Vercel | Hosting do frontend | Ligar via GitHub (login com GitHub) |
| UptimeRobot (opcional) | Monitor externo + alerta email | Reforça o keep-alive |

**Segredos a obter e guardar** (nunca no código; vão para *GitHub Secrets*):
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` — usados pelo frontend (públicos por natureza, mas geridos por env).
- `SUPABASE_ACCESS_TOKEN`, `SUPABASE_PROJECT_REF`, `SUPABASE_DB_PASSWORD` — usados pelas Actions para aplicar migrações/backup.
- `SERVICE_ROLE_KEY` — **só** em Actions/Edge Functions, nunca no bundle.

---

## 3. Tarefas passo-a-passo

### T1 — Repositório e higiene base 🟢
- Inicializar Git no diretório `Peladinhas`, branch `main`.
- `.gitignore` (node_modules, dist, .env*, .vercel, .DS_Store).
- `README.md` com descrição, stack e como correr localmente.
- Mover/manter `docs/` (arquitetura + este plano) versionados.
- **Entregável:** repo no GitHub com estrutura de pastas da secção 7 da arquitetura (vazias/placeholder).
- **Aceitação:** `git clone` traz a estrutura; nada sensível versionado.

### T2 — Scaffold do frontend 🟢
- `web/` com Vite + React + TypeScript.
- Adicionar: React Router, TanStack Query, Tailwind CSS, React Hook Form + Zod, cliente `@supabase/supabase-js`.
- Estrutura `src/` conforme arquitetura (`app/`, `features/`, `components/ui/`, `lib/`, `types/`).
- Uma página "Home" mínima que renderiza e faz **um ping ao Supabase** (ex.: `select 1` via RPC ou uma tabela `health`) para provar a ligação.
- Variáveis de ambiente via `.env.local` (git-ignored) + `.env.example` versionado.
- **Entregável:** app corre em `localhost` e mostra estado da ligação ao Supabase.
- **Aceitação:** `npm run dev` arranca; `npm run build` passa; typecheck limpo.

### T3 — Projeto Supabase + "backend as code" 🟡
- Criar projeto Supabase (região Europa — ex.: Frankfurt — pela latência).
- Instalar Supabase CLI; `supabase init` em `supabase/`; `supabase link` ao projeto.
- Primeira migração **mínima** (só para provar o pipeline): tabela `health(id, checked_at)` **com RLS ativado** e uma política de leitura, ou uma função `rpc ping()`. Sem tabelas de domínio ainda.
- `supabase gen types` → gerar tipos TS para `web/src/types/`.
- Seed vazio/placeholder para estruturar a pasta `seed/`.
- **Entregável:** migração aplicável localmente e remotamente; tipos gerados.
- **Aceitação:** `supabase db push` aplica sem erros; RLS confirmado ativo (checklist).

### T4 — Deploy do frontend na Vercel 🟢
- Importar o repo na Vercel; *Root Directory* = `web`; framework Vite auto-detetado.
- Configurar env vars na Vercel (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`).
- Ativar *Preview Deployments* por PR.
- **Entregável:** URL público HTTPS a servir a app.
- **Aceitação:** abrir o URL mostra a Home e o ping ao Supabase com sucesso; um PR gera preview URL.

### T5 — CI (GitHub Actions) 🟢
- `ci.yml`: em PR e push → instalar deps, ESLint, typecheck, Vitest (suite vazia inicial), `vite build`.
- Configurar ESLint + Prettier + regras TS.
- **Entregável:** workflow verde em cada PR.
- **Aceitação:** um PR de teste corre CI e bloqueia merge se falhar.

### T6 — CD de base de dados/funções 🟡
- `deploy.yml`: em push para `main` → `supabase db push` (migrations) e `supabase functions deploy` (quando existirem).
- Usar `SUPABASE_ACCESS_TOKEN` / `PROJECT_REF` dos Secrets.
- Edge Function `health/` mínima (endpoint que responde 200) — servirá de alvo do keep-alive.
- **Entregável:** migração e função publicadas por push.
- **Aceitação:** alterar a migração e fazer push aplica a mudança no Supabase automaticamente.

### T7 — Keep-alive 24/7 🟢 (crítico — mitiga R1)
- `keepalive.yml`: cron (ex.: 2×/dia, 08:00 e 20:00 UTC) que faz `curl` à Edge Function `health` (ou a uma leitura via API).
- Configurar UptimeRobot (opcional) a apontar para o mesmo endpoint, com alerta email para `vscosousa@gmail.com`.
- **Entregável:** atividade recorrente garantida sem intervenção.
- **Aceitação:** ver execuções agendadas no separador Actions; endpoint responde 200.

### T8 — Backup automático 🟢 (rede de segurança — mitiga R3)
- `backup.yml`: cron semanal → `pg_dump` → guardar como *artifact* privado da Action (retenção) e/ou commit num repo privado dedicado.
- **Entregável:** dump semanal recuperável.
- **Aceitação:** primeira execução produz um artefacto descarregável.

### T9 — Documentação de arranque 🟢
- README com: setup local, variáveis de ambiente, como criar/aplicar migração, como correr CI localmente, checklist de RLS.
- **Aceitação:** um novo clone consegue chegar a "app a correr" só com o README.

---

## 4. Sequência e dependências

```
T1 ─▶ T2 ─▶ T4 (deploy frontend)
 │     └──▶ T5 (CI)
 └──▶ T3 ─▶ T6 ─▶ T7 (keep-alive)
              └──▶ T8 (backup)
T2+T3 ─▶ T9 (docs)
```

Caminho crítico: **T1 → T3 → T6 → T7** (é o que garante o "24/7 a custo zero"). T2/T4/T5 correm em paralelo.

---

## 5. Entregáveis da F0 (Definition of Done)

- [ ] Repo GitHub com estrutura da arquitetura e `docs/` versionados.
- [ ] App React publicada num URL HTTPS público (Vercel).
- [ ] Ligação frontend ↔ Supabase provada (ping visível na UI).
- [ ] Migrações versionadas e aplicadas por push; tipos TS gerados.
- [ ] CI verde em PRs (lint + types + build + testes).
- [ ] Edge Function `health` + keep-alive agendado a correr sozinho.
- [ ] Backup semanal `pg_dump` a produzir artefacto.
- [ ] RLS ativo mesmo na tabela `health` (hábito desde o primeiro dia).
- [ ] README que leva de zero a "a correr".

---

## 6. Riscos específicos da F0 e mitigação

| Risco | Mitigação |
|---|---|
| Segredos expostos no repo/bundle | `SERVICE_ROLE_KEY` só em Actions/Edge; só `anon` no frontend; `.env` git-ignored; `.env.example` sem valores |
| Esquecer RLS numa tabela | Checklist obrigatório por migração; começar já com RLS na `health` para criar o hábito |
| Região do Supabase com latência para PT | Escolher região Europa (Frankfurt) na criação — decisão irreversível fácil de acertar agora |
| Keep-alive não conta como "atividade" suficiente | Combinar Action cron + UptimeRobot; validar que o projeto não suspende após uma semana real |
| Deriva entre schema local e remoto | Uma única fonte: pasta `migrations/`; nunca alterar schema pela UI do Supabase sem gerar migração |

---

## 7. O que a F0 deixa pronto para a F1 (Auth & Perfil)

- Pipeline de migrações → basta acrescentar as tabelas `profile`/`position` e RLS.
- Cliente Supabase e TanStack Query já configurados → só ligar os ecrãs de auth.
- Deploy e previews a funcionar → cada feature de F1 sai para preview automaticamente.
- Geração de tipos → o `profile` fica tipado de ponta a ponta assim que a migração existir.

---

## 8. Decisões operacionais (fechadas)

- ✅ **Repositório:** `liga-dos-craques`, **privado** (guarda dados pessoais de amigos).
- ✅ **Região Supabase:** **Frankfurt (eu-central-1)** — menor latência para Portugal e dados na UE.
- ✅ **Monitor de uptime:** **UptimeRobot** com alertas por email (`vscosousa@gmail.com`) a reforçar o cron do GitHub (T7).
- ✅ **Email de contas** (Supabase/Vercel): `vscosousa@gmail.com`.

> Nota de marca: o produto continua a chamar-se **Peladinhas** na UI; `liga-dos-craques` é o nome do repositório/infra. (Alternativamente, unificar tudo sob um só nome — decisão de produto, sem impacto técnico.)

*Decisões fechadas — a F0 está pronta a ser implementada. A implementação (código) arranca pela T1 assim que for dada luz verde.*
