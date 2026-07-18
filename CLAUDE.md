# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## O que é

**Peladinhas** (repo: `liga-dos-craques`) — plataforma web para gerir jogos de futebol entre amigos: jogos, estatísticas, rankings, desafios, XP e conquistas. App entre amigos, manutenção por 1 pessoa, custo 0 € (só planos gratuitos). Documentação em português; escreve código, comentários e mensagens de commit em português.

## Comandos

Todos os comandos do frontend correm dentro de `web/`. O ambiente principal é Windows/PowerShell (há também um shell Bash disponível); os comandos npm/npx são agnósticos do shell, mas utilitários POSIX (`tail`, `ls | tail -1`, etc.) não são nativos do PowerShell — usar o equivalente (`Get-Content -Tail 1`) ou o shell Bash.

```bash
npm run dev        # servidor de dev (http://localhost:5173)
npm run build      # tsc -b && vite build (typecheck + build de produção)
npm run typecheck  # tsc -b --noEmit
npm run lint       # eslint . --max-warnings 0  (0 warnings é obrigatório)
npm test           # vitest run (unitários)
npm run test:watch # vitest em watch
npm run format     # prettier --write . (formata o código)
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

- **Stack:** React 18 + Vite + TypeScript + TanStack Query + React Router + react-hook-form + Zod. **Não há framework de CSS** — o Tailwind foi removido por completo (`3540ea7`); não o reintroduzir nem a qualquer sucedâneo.
- **Alias de import:** `@/` → `web/src/` (configurado em `vite.config.ts` e `tsconfig`).
- **Composição da app** (`src/app/App.tsx`): providers encadeados — `QueryClientProvider` → `ToastProvider` → `ConfirmProvider` → `AuthProvider` → `RouterProvider`.
- **Rotas** (`src/app/router.tsx`): páginas autenticadas usam `lazyWithReload` (code-splitting + recarrega 1x quando um chunk fica desatualizado após deploy). Rotas protegidas ficam dentro de `<ProtectedRoute>` → `<AppLayout>`. Rotas públicas: `/login /signup /recover /update-password`. Protegidas: `/ /profile /players/:id /games /games/new /games/:id /rankings /challenges /challenges/crossbar/new /challenges/crossbar/:sessionId /challenges/penalty/new /challenges/penalty/:sessionId /admin`.
- **Cliente Supabase:** singleton tipado em `src/shared/lib/supabase.ts` (`createClient<Database>`), partilhado por toda a app.
- **Camada transversal `src/shared/`:** código usado por várias features vive aqui, não dentro de uma feature. `shared/lib/` (utilitários puros: `supabase`, `datetime`, `env`, `queryClient`, `lazyWithReload`), `shared/components/` (UI partilhada: `ui/`, `toast/`) e `shared/tokens/` (design tokens CSS). Importa-se via `@/shared/...`. As features podem depender de `shared/` (e de `auth`/`health`, que são fundacionais), nunca o contrário.

### Estilos (CSS puro, sem framework)

- **Cada componente estiliza-se num `*.module.css` ao lado** (CSS Modules, ~54 ficheiros). Não há utility classes — não escrever `className="flex gap-2"`.
- **Design tokens** vivem em `src/shared/tokens/` (`colors`, `typography`, `spacing`, `radius`, `shadows`, `motion`), agregados por `theme.css`. Os `*.module.css` referenciam os tokens via `var(--...)`; **valores hard-coded (cores, espaçamentos) não entram nos módulos**. Regra do ficheiro: *um token só existe se for usado*.
- **Ordem de import global** (`src/main.tsx`, é a única): `shared/tokens/theme.css` (tokens) antes de `index.css` (reset mínimo + base). `index.css` é o único CSS global — não acrescentar outros.
- **Responsividade prefere container queries nativas** (`@container`, ex. `events/EventSoundboard.module.css`, `stats/StatsGrid.module.css`) a media queries, para os componentes reagirem ao seu contentor e não ao viewport.

### Organização por features

O código vive em `src/features/<domínio>/` (auth, games, teams, events, stats, xp, rankings, achievements, challenges, profile, admin, awards, health). Cada feature agrupa os seus componentes, schemas Zod e hooks. Convenções dentro de uma feature:

> **Nota:** MVP/Flop é 100% por rating (não há votação — a tabela `vote` e as funções foram removidas em `20260802100000_drop_voting.sql`). O apuramento vive na feature `awards/` (`AwardsPanel.tsx`, `awardHooks.ts`), que continua **em uso** — `awardHooks` lê as views `v_game_player_rating`/`v_game_award` e chama a RPC `resolve_awards`, e `GameDetailPage` renderiza o `AwardsPanel`. (Esta feature chamava-se `voting/`.)

- **`<feature>Hooks.ts`** — toda a I/O de dados passa por hooks TanStack Query (`useQuery`/`useMutation`) que chamam `supabase.from(...)`, **agrupados num único ficheiro por feature** (`gameHooks.ts`, `profileHooks.ts`, `statsHooks.ts`, …). Os tipos de linha derivam de `Database['public']['Tables'][...]['Row']`; joins embebidos ganham interfaces `...WithProfile` / `...WithFormat`. É aqui que se lê/escreve dados — não chamar o supabase diretamente dos componentes.
- **Hooks que não são I/O de dados** (acesso a contexto, timers, subscrições realtime) ficam em ficheiros próprios `useX.ts`, não no `<feature>Hooks.ts`: ex. `auth/useAuth.ts` (contexto), `games/useMatchClock.ts` (cronómetro), `games/useGameRealtime.ts` (subscrição).
- **`*.schemas.ts`** (+ `*.schemas.test.ts`) — validação com Zod, testável isoladamente.
- **Lógica pura** (ex.: `teamBalancer.ts`, `playerRating.ts`, `gameStatus.ts`, `shared/lib/datetime.ts`) fica separada e coberta por testes unitários.
- **Gráficos são SVG feito à mão** (`stats/PlayerCharts.tsx`, `stats/RatingTrend.tsx`) — não há biblioteca de charts nas dependências e não se deve adicionar uma (custo 0 € / mínimo de dependências).
- **Desafios em tempo real usam sessões efémeras** (padrão distinto do resto da app, que é persistente/append-only). Servem o **Crossbar** (`challenges/crossbar/`) e os **Penáltis** (`challenges/penalty/`), partilhando o mesmo esquema de sessão (`challenge_session` / `session_player` / `session_turn`) com um discriminador `challenge_session.mode` (`'crossbar'` | `'pen_goals'` | `'pen_zones'` | `'pen_target'`). O setup é 100% client-side — nada é gravado antes de começar. A `challenge_session` só existe na BD enquanto o jogo decorre: é criada já `active` (com a ordem sorteada) por uma RPC `security definer` (`crossbar_create_and_start` / `penalty_create_and_start`), avança por turnos/rondas via `*_record_turn` (colunas `round`/`phase`, morte súbita; penáltis usam `session_player.goals`/`zones`/`target`), e ao terminar (`*_finish`) a sessão é **apagada** — sobra apenas o `+1` no ranking (`challenge_attempt`). Lógica pura testável em `crossbarSpots.ts` / `penaltyModes.ts`. Na `ChallengesPage`, ambos os desafios são "wins-based" (o ranking mostra vitórias, não score).

### Backend (`supabase/`)

- **`migrations/`** — schema versionado (`YYYYMMDDHHMMSS_nome.sql`): tabelas, RLS, funções, e **dados de referência** (posições, formatos, tipos de evento). Nunca alterar o schema pela UI do Supabase sem gerar migração. O `seed/` **não** corre em `db push`, por isso dados de referência vão nas migrações, não no seed. As migrações correm por ordem de timestamp no nome — uma migração nova tem de usar um timestamp posterior ao da última existente. **Confirmar sempre o tip com `ls supabase/migrations | tail -1` contra o `main` atualizado, nunca de memória.** O `schema_migrations` é indexado **só pelo timestamp** (o nome do ficheiro não conta): duas migrações com o mesmo timestamp — típico de branches paralelos criados no mesmo dia — passam no CI local e só rebentam no deploy com `duplicate key ... schema_migrations_pkey`. Nesse caso, renumerar **a que ainda não foi aplicada** (a que não está em `main`); nunca renumerar uma já aplicada em produção.
- **`functions/`** — Edge Functions (Deno). `health` é o keep-alive público (`verify_jwt=false`, retorna 200).
- **`tests/`** — pgTAP (`rls_test.sql`) para invariantes de RLS.
- **Tipos DB** (`web/src/types/database.ts`) são mantidos **à mão** (e podem ser regenerados com `npm run db:types` quando há BD local). Ao adicionar/alterar tabelas numa migração, atualizar este ficheiro.

## Regras de ouro

- **Comentários: só JSDoc simples.** Uma linha (ou duas) a dizer o que a coisa é. Nada de comentários a narrar a história da mudança ("antes fazia X", "isto estava mal porque…"), a justificar a alteração, a repetir o que o código já diz, ou a explicar o óbvio. Se um porquê é mesmo preciso, é uma frase curta — não um parágrafo. O contexto da mudança vai na mensagem de commit e no PR, não no ficheiro.
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
