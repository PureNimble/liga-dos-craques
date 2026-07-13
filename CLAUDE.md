# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é

**Peladinhas** (repo: `liga-dos-craques`) — plataforma web para gerir jogos de futebol entre amigos: jogos, estatísticas, rankings, desafios, XP e conquistas. App entre amigos, manutenção por 1 pessoa, custo 0 € (só planos gratuitos). Documentação em português; escreve código, comentários e mensagens de commit em português.

## Comandos

Todos os comandos do frontend correm dentro de `web/`:

```bash
npm run dev        # servidor de dev (http://localhost:5173)
npm run build      # tsc -b && vite build (typecheck + build de produção)
npm run typecheck  # tsc -b --noEmit
npm run lint       # eslint . --max-warnings 0  (0 warnings é obrigatório)
npm test           # vitest run (unitários)
npm run test:watch # vitest em watch
npm run db:types   # regenera src/types/database.ts a partir do schema Supabase local
npm run test:db    # supabase test db (pgTAP, requer Docker + supabase start)
```

Correr um único teste unitário: `npm test -- teamBalancer` (filtra por nome de ficheiro/teste).

Pré-requisitos: Node 20+ e npm; para a BD local também Docker (o Supabase CLI já vem como devDependency, usar `npx supabase`).

Base de dados local (opcional, requer Docker), a partir da raiz:

```bash
npx supabase start      # sobe Postgres + Studio local
npx supabase db reset   # aplica migrações + seed
```

## Arquitetura

Monorepo com dois mundos: `web/` (frontend React) e `supabase/` (backend as code). A **segurança vive na base de dados** (RLS), não no frontend — a anon key é pública.

### Frontend (`web/`)

- **Stack:** React 18 + Vite + TypeScript + Tailwind + TanStack Query + React Router + react-hook-form + Zod.
- **Alias de import:** `@/` → `web/src/` (configurado em `vite.config.ts` e `tsconfig`).
- **Composição da app** (`src/app/App.tsx`): providers encadeados — `QueryClientProvider` → `ToastProvider` → `ConfirmProvider` → `AuthProvider` → `RouterProvider`.
- **Rotas** (`src/app/router.tsx`): páginas autenticadas usam `lazyWithReload` (code-splitting + recarrega 1x quando um chunk fica desatualizado após deploy). Rotas protegidas ficam dentro de `<ProtectedRoute>` → `<AppLayout>`. Rotas públicas: `/login /signup /recover /update-password`. Protegidas: `/ /profile /players/:id /games /games/new /games/:id /rankings /challenges /admin`.
- **Cliente Supabase:** singleton tipado em `src/lib/supabase.ts` (`createClient<Database>`), partilhado por toda a app.

### Organização por features

O código vive em `src/features/<domínio>/` (auth, games, teams, events, stats, xp, rankings, achievements, challenges, profile, admin, health). Cada feature agrupa os seus componentes, schemas Zod e hooks. Convenções dentro de uma feature:

> **Nota:** a feature `voting/` está descontinuada — o backend de votação (tabela `vote`, funções) foi removido na migração `20260802100000_drop_voting.sql`; MVP/Flop passou a ser 100% por rating. Os ficheiros que restam (`VotingPanel.tsx`, `voteHooks.ts`) são código órfão e não devem ser reutilizados.

- **`*Hooks.ts`** — toda a I/O passa por hooks TanStack Query (`useQuery`/`useMutation`) que chamam `supabase.from(...)`. Os tipos de linha derivam de `Database['public']['Tables'][...]['Row']`; joins embebidos ganham interfaces `...WithProfile` / `...WithFormat`. É aqui que se lê/escreve dados — não chamar o supabase diretamente dos componentes.
- **`*.schemas.ts`** (+ `*.schemas.test.ts`) — validação com Zod, testável isoladamente.
- **Lógica pura** (ex.: `teamBalancer.ts`, `playerRating.ts`, `gameStatus.ts`, `lib/datetime.ts`) fica separada e coberta por testes unitários.

### Backend (`supabase/`)

- **`migrations/`** — schema versionado (`YYYYMMDDHHMMSS_nome.sql`): tabelas, RLS, funções, e **dados de referência** (posições, formatos, tipos de evento). Nunca alterar o schema pela UI do Supabase sem gerar migração. O `seed/` **não** corre em `db push`, por isso dados de referência vão nas migrações, não no seed.
- **`functions/`** — Edge Functions (Deno). `health` é o keep-alive público (`verify_jwt=false`, retorna 200).
- **`tests/`** — pgTAP (`rls_test.sql`) para invariantes de RLS.
- **Tipos DB** (`web/src/types/database.ts`) são mantidos **à mão** (e podem ser regenerados com `npm run db:types` quando há BD local). Ao adicionar/alterar tabelas numa migração, atualizar este ficheiro.

## Regras de ouro

- **RLS em TODAS as tabelas.** A chave anon é pública; a segurança está na BD. Padrão: RLS + GRANTs por coluna para impedir editar campos sensíveis (`role`, `created_by`) — o próprio nunca escala privilégios. Helpers SQL `is_admin()` e `is_game_organizer()` são `security definer`.
- **Segredos** (`service_role`, DB password, access token) **só** em GitHub Secrets / Edge Functions — nunca no bundle nem no repo.
- **Schema só via `migrations/`.**
- **XP é um ledger append-only** (`xp_ledger`) com regras versionadas (`xp_rule`); nunca editado destrutivamente.
- **Privacidade de perfis:** todos os autenticados leem todos os perfis (decisão deliberada — é uma app entre amigos); colunas sensíveis (`birth_date`, `weight_kg`, `height_cm`) estão isoladas em `profile_private` com RLS restrita ao dono.

## Deploy (CI/CD via GitHub Actions)

Push para `main`:
- Frontend → a Vercel faz build e publica automaticamente (Root Directory = `web`); PRs geram preview URLs.
- Alterações em `supabase/**` → `deploy.yml` aplica migrações e faz deploy das Edge Functions.

Workflows: `ci.yml` (lint/typecheck/test/build), `db-check.yml` (pgTAP), `deploy.yml`, `keepalive.yml`, `backup.yml`.

## Docs

`docs/ARQUITETURA.md` (arquitetura completa) e `docs/SETUP.md` (arranque local para novos devs).
