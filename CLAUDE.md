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

O frontend também corre em container ("clonar e correr" sem instalar Node): `docker compose up` a partir da raiz (`docker-compose.yml` + `web/Dockerfile`) sobe o dev server do Vite em `http://localhost:5173`. O backend continua a ser o Supabase CLI à parte — o browser corre no host e fala com `127.0.0.1:44321` diretamente, os containers não partilham rede.

## Arquitetura

Monorepo com dois mundos: `web/` (frontend React) e `supabase/` (backend as code). A **segurança vive na base de dados** (RLS), não no frontend — a anon key é pública.

### Frontend (`web/`)

- **Stack:** React 18 + Vite + TypeScript + TanStack Query + React Router + react-hook-form + Zod. Mapas com **Leaflet + react-leaflet** (usado só na feature `places`) — é a única biblioteca de UI "pesada"; fora dela, mantém-se o mínimo de dependências. **Não há framework de CSS** — o Tailwind foi removido por completo (`3540ea7`); não o reintroduzir nem a qualquer sucedâneo.
- **Alias de import:** `@/` → `web/src/` (configurado em `vite.config.ts` e `tsconfig`).
- **Composição da app** (`src/app/App.tsx`): providers encadeados — `ThemeProvider` → `I18nProvider` → `QueryClientProvider` → `ToastProvider` → `ConfirmProvider` → `AuthProvider` → `RouterProvider`. `ThemeProvider`/`useTheme` (`shared/theme/`) e `I18nProvider`/`useT` (`shared/i18n/`) ficam fora de tudo o resto porque não dependem de sessão — o tema/idioma persistem em `localStorage` (chaves `peladinhas-theme`/`peladinhas-lang`) e o `data-theme` é aplicado antes do primeiro paint por um `<script>` em `index.html` (evita flash do tema errado).
- **i18n (PT/EN):** cada feature é dona do seu texto num ficheiro `<feature>.i18n.ts` ao lado do resto (ex. `features/settings/settings.i18n.ts`, `features/auth/auth.i18n.ts`) — mesmo padrão dos `*.schemas.ts`. `shared/i18n/` é só o motor (`I18nProvider`/`useT`, tipos `LangCode`/`TranslationDict`) e **não pode importar de `features/`** (quebrava a regra de dependência de `shared/`); quem junta os dicionários é `app/i18nRegistry.ts` (a única camada com licença para conhecer todas as features), passado ao `I18nProvider` via prop `dictionary`. Chave em falta devolve a própria chave (visível, não rebenta). **Cobertura:** cromo sempre-visível (nav, Home, Definições, autenticação, consentimento, notificações, cabeçalho do perfil, lista de jogos) está traduzido; o resto da app (jogos em detalhe, admin, equipas, desafios, rankings, conquistas) continua só em português — ao adicionar um ecrã novo a essas áreas, criar/estender o `*.i18n.ts` da feature em vez de texto direto no componente.
- **Rotas** (`src/app/router.tsx`): páginas autenticadas usam `lazyWithReload` (code-splitting + recarrega 1x quando um chunk fica desatualizado após deploy). Rotas protegidas ficam dentro de `<ProtectedRoute>` → `<AppLayout>`. A navegação vive toda no `NavDrawer` (hambúrguer em qualquer largura); a `Navbar` só tem logótipo, avatar e menu. Rotas públicas: `/login /signup /recover /update-password`. Protegidas: `/ /profile /players/:id /games /games/new /games/:id /rankings /challenges /challenges/crossbar/new /challenges/crossbar/:sessionId /challenges/penalty/new /challenges/penalty/:sessionId /places /settings /notifications /admin`.
- **Cliente Supabase:** singleton tipado em `src/shared/lib/supabase.ts` (`createClient<Database>`), partilhado por toda a app.
- **Camada transversal `src/shared/`:** código usado por várias features vive aqui, não dentro de uma feature. `shared/lib/` (utilitários puros: `supabase`, `datetime`, `env`, `queryClient`, `lazyWithReload`), `shared/components/` (UI partilhada: `ui/`, `toast/`), `shared/tokens/` (design tokens CSS), `shared/theme/` (`ThemeProvider`/`useTheme` — claro/escuro/sistema) e `shared/i18n/` (`I18nProvider`/`useT` — PT/EN). Importa-se via `@/shared/...`. As features podem depender de `shared/` (e de `auth`/`health`, que são fundacionais), nunca o contrário.

### Estilos (CSS puro, sem framework)

- **Cada componente estiliza-se num `*.module.css` ao lado** (CSS Modules, ~54 ficheiros). Não há utility classes — não escrever `className="flex gap-2"`.
- **Design tokens** vivem em `src/shared/tokens/` (`colors`, `typography`, `spacing`, `radius`, `shadows`, `motion`), agregados por `theme.css`. Os `*.module.css` referenciam os tokens via `var(--...)`; **valores hard-coded (cores, espaçamentos) não entram nos módulos**. Regra do ficheiro: *um token só existe se for usado*. `colors.css` tem primitivos únicos (mesmo hex nos dois temas) e uma camada semântica com valores claro/escuro — o tema escuro é o `:root` por omissão, o claro entra por `@media (prefers-color-scheme: light)` (segue o sistema) ou por `[data-theme='light']` (escolha explícita, maior especificidade, ganha sempre). Grupos decorativos/ilustrados ficam iguais nos dois temas de propósito — são elementos "de marca", não cromo de interface: cores de equipa, campo de jogo (`teams/Pitch.module.css`), pódio, cena de estádio dos penáltis (`challenges/penalty/`), spinner dos golos icónicos (`challenges/iconic/IconicSpinner.module.css`) e o campo do crossbar (`challenges/crossbar/CrossbarField.module.css`). O cartão de jogador (`profile/PlayerCard.module.css`) já foi tratado como elemento de marca, mas passou a seguir o tema (`--surface-card`/`--text-color`/`--text-subtle`) — decisão revista. Todo o resto (`shared/components/ui/`, cromo da app, e as páginas de feature) já referencia os tokens (`--surface-well/panel/chip`, `--border-default/subtle`, etc.) em vez de `var(--gray-7/8/9xx)` a direito. **Exceção conhecida:** a célula do `admin/UsageHeatmap.module.css` mistura `--accent` com `--surface-ghost-hover` num `color-mix` de intensidade variável — o texto branco fixo perde contraste nas células de baixa intensidade em tema claro; precisa de uma cor de texto sensível à intensidade, não só ao tema, por resolver.
- **Ordem de import global** (`src/main.tsx`, é a única): `shared/tokens/theme.css` (tokens) antes de `index.css` (reset mínimo + base). `index.css` é o único CSS global — não acrescentar outros.
- **Responsividade prefere container queries nativas** (`@container`, ex. `events/EventSoundboard.module.css`, `stats/StatsGrid.module.css`) a media queries, para os componentes reagirem ao seu contentor e não ao viewport.

### Organização por features

O código vive em `src/features/<domínio>/` (auth, games, teams, events, stats, xp, rankings, achievements, challenges, places, profile, settings, notifications, tracking, admin, awards, feedback, health, groups). Cada feature agrupa os seus componentes, schemas Zod e hooks. Convenções dentro de uma feature:

> **Dashboard de admin** (`features/admin/`): rotas aninhadas sob `/admin` — `AdminLayout` (gate por `role='admin'` + barra lateral `AdminSidebar` + `<Outlet>` com Suspense) e uma sub-página por secção: `AdminDashboard` (índice: KPIs + gráficos), `players`, `games`, `goals`, `achievements`, `reference`, `analytics`, `reports`, `system`. As secções ligam-se em `adminSections.ts`. Cada secção editável tem uma migração `*_admin_write.sql` que abre INSERT/UPDATE via RLS `is_admin()` (padrão de `iconic_goal`/`achievement`/`reference`); `admin_set_role` e apagar jogos fechados são protegidos no servidor (RPC / trigger). Sobre um jogador o admin **só promove/despromove**: não edita o perfil de ninguém (a política `profile_admin_update` foi removida em `20260908100000_admin_no_profile_edit.sql` e há um teste pgTAP a garantir que não volta). **Gráficos hand-built** (CSS/SVG, ex. `RankedBars`, `PlayHeatmap`) convivem com o `recharts` das páginas de `/admin`. Dados criados pela app (golos, conquistas) vivem só na BD — não em migrações.
>
> **Notificações** (`features/notifications/`): avisos por jogador em `notification` (RLS: lê os seus; só pode escrever `read_at`; INSERT/DELETE só do servidor via `notify_user`). Quem os gera é a BD: `evaluate_player_achievements` passou a **dar e tirar** conquistas (só revoga critérios que sabe avaliar) e avisa a cada remoção; `admin_reopen_game` avisa quem jogou; e o trigger `game_player_notify` cobre a convocatória (convite → convidado; inscrição/confirmação/desmarcação/saída → organizador; remoção → jogador), nunca avisando quem fez a ação. Página em `/notifications`, com contador na gaveta e ponto no menu.
>
> **Tracking** (`features/tracking/`): analytics de utilização **com consentimento explícito**. `analytics_consent` (uma linha por jogador; sem linha = ainda não decidiu) e `app_event` (append-only: `page_view`/`session_start`, rota normalizada em `tracker.ts` — nunca ids de entidades). O INSERT em `app_event` só passa o RLS se houver consentimento ativo; só o admin lê. Decidir/retirar passa pela RPC `analytics_set_consent` (security definer) — retirar apaga o histórico do próprio. `ConsentBanner` aparece no `AppLayout` enquanto não há decisão; o `PrivacyCard` vive em `/settings` e deixa mudar de ideias. O `/admin/analytics` mostra estes dados quando existem e cai nas ações de domínio quando não.
>
> **Feedback** (`features/feedback/`): reportes de bugs. `bug_report` (RLS: cria o próprio, lê o próprio ou admin, resolve só admin), `ReportBugModal` acessível da `Navbar`/`NavDrawer`, e a lista de admin em `/admin/reports`.

> **Nota:** MVP/Flop é 100% por rating (não há votação — a tabela `vote` e as funções foram removidas em `20260802100000_drop_voting.sql`). O apuramento vive na feature `awards/` (`AwardsPanel.tsx`, `awardHooks.ts`), que continua **em uso** — `awardHooks` lê as views `v_game_player_rating`/`v_game_award` e chama a RPC `resolve_awards`, e `GameDetailPage` renderiza o `AwardsPanel`. (Esta feature chamava-se `voting/`.)

- **`<feature>Hooks.ts`** — toda a I/O de dados passa por hooks TanStack Query (`useQuery`/`useMutation`) que chamam `supabase.from(...)`, **agrupados num único ficheiro por feature** (`gameHooks.ts`, `profileHooks.ts`, `statsHooks.ts`, …). Os tipos de linha derivam de `Database['public']['Tables'][...]['Row']`; joins embebidos ganham interfaces `...WithProfile` / `...WithFormat`. É aqui que se lê/escreve dados — não chamar o supabase diretamente dos componentes.
- **Hooks que não são I/O de dados** (acesso a contexto, timers, subscrições realtime) ficam em ficheiros próprios `useX.ts`, não no `<feature>Hooks.ts`: ex. `auth/useAuth.ts` (contexto), `games/useMatchClock.ts` (cronómetro), `games/useGameRealtime.ts` (subscrição).
- **`*.schemas.ts`** (+ `*.schemas.test.ts`) — validação com Zod, testável isoladamente.
- **Lógica pura** (ex.: `teamBalancer.ts`, `playerRating.ts`, `gameStatus.ts`, `shared/lib/datetime.ts`) fica separada e coberta por testes unitários.
- **Gráficos:** nas features viradas ao jogador são **SVG/CSS feitos à mão** (`stats/PlayerCharts.tsx`, `stats/RatingTrend.tsx`, `admin/RankedBars.tsx`, `admin/PlayHeatmap.tsx`) — mantém-se assim para não pesar no bundle principal. **Exceção: o dashboard de admin usa `recharts`** (decisão do dono), isolado nas páginas lazy de `/admin` (não entra no bundle inicial). Cores dos gráficos vêm de uma paleta categórica validada (dataviz) em `admin/charts/chartTheme.ts` — não hard-coded avulso.
- **Largura:** a app é **full-width** — o cabeçalho e o `main` (`AppLayout`) ocupam toda a largura do ecrã (sem `max-width` central). Vistas focadas e estreitas (ex.: sessão de penáltis/crossbar) põem o seu próprio `max-width` + `margin-inline: auto` para não esticarem.
- **Mapa de locais** (`places/`) — `PlacesMapPage` desenha os limites de distritos/concelhos de Portugal a partir de GeoJSON versionado no repo (`districts.json`, `municipalities.json`) e sobrepõe os `place` (locais de jogo). A tabela `place` liga-se aos jogos via `game_place` (`20260815100000_game_place.sql`).
- **Desafios em tempo real usam sessões efémeras** (padrão distinto do resto da app, que é persistente/append-only). Servem o **Crossbar** (`challenges/crossbar/`) e os **Penáltis** (`challenges/penalty/`), partilhando o mesmo esquema de sessão (`challenge_session` / `session_player` / `session_turn`) com um discriminador `challenge_session.mode` (`'crossbar'` | `'pen_goals'` | `'pen_zones'` | `'pen_target'`). O setup é 100% client-side — nada é gravado antes de começar. A `challenge_session` só existe na BD enquanto o jogo decorre: é criada já `active` (com a ordem sorteada) por uma RPC `security definer` (`crossbar_create_and_start` / `penalty_create_and_start`), avança por turnos/rondas via `*_record_turn` (colunas `round`/`phase`, morte súbita; penáltis usam `session_player.goals`/`zones`/`target`), e ao terminar (`*_finish`) a sessão é **apagada** — sobra apenas o `+1` no ranking (`challenge_attempt`). Lógica pura testável em `crossbarSpots.ts` / `penaltyModes.ts`. Na `ChallengesPage`, ambos os desafios são "wins-based" (o ranking mostra vitórias, não score).
- **Golos Icónicos** (`challenges/iconic/`) é o terceiro desafio e **não segue o padrão de sessão** — é persistente e single-player, sem rotas próprias (o `IconicGoalsEntry` é renderizado dentro da `ChallengesPage`). O jogador roda um carrossel estilo Forza (`iconicSpin.ts`, testado; som em `web/public/sounds/`) que sorteia um golo da tabela curada `iconic_goal` — as definições vivem em migrações, não em seed. O estado passa por três RPCs `security definer` (`iconic_goal_roll` / `iconic_goal_replicate` / `iconic_goal_forfeit`) sobre `iconic_goal_spin` (sorteio em curso, 1 por jogador) e `iconic_goal_replica` (append-only), com ranking na view `v_iconic_goal_leaderboard`. Ao replicar, o `AchievementToast` faz o desbloqueio estilo consola (fanfarra + nome enigmático em `iconic_goal.achievement_name`, curado em migração; cai para o título do golo se for nulo). Os clips são embebidos pelo `shared/components/ui/YouTubeEmbed/`; quando o dono do vídeo bloqueia o embed (`iconic_goal.embeddable = false`) mostra-se miniatura + link. O admin cria/edita golos pela UI (`AdminIconicGoals`, na secção `/admin/goals`) — a escrita em `iconic_goal` é gated por RLS `is_admin()` (`20260901100000_iconic_goal_admin_write.sql`); golos criados pela app vivem **só na BD** (não em migrações), por isso não sobrevivem a um `db reset`. Não há delete — desativa-se com `active=false`.
- **Grupos (`groups/`) são a unidade de multi-tenancy** — um jogador pode pertencer a vários grupos de amigos e alterna entre eles pelo seletor no `Navbar` (`GroupSwitcherModal`). Tudo o que é competitivo (jogos, rankings, XP/nível, conquistas, tentativas/sessões de desafios) é calculado **só com dados do grupo ativo** — as vistas `v_player_stats`/`v_player_xp`/`v_ranking_*`/`v_challenge_leaderboard`/`v_game_award` agrupam por `(player_id, group_id)`, não só `player_id`. `place`/posições/formatos/tipos de evento continuam globais (catálogo partilhado). `GroupProvider` + `useActiveGroupId()` (`groups/GroupProvider.tsx`, `groups/useActiveGroup.ts`) expõem o grupo ativo a qualquer hook — é montado dentro do `AppLayout` (não no `App.tsx`, porque depende do perfil já carregado) e só depois de o utilizador ter pelo menos um grupo; sem grupos, o `AppLayout` mostra `GroupOnboardingPage` em vez do shell normal (não é uma rota). `profile.active_group_id` persiste o grupo ativo no servidor (sobrevive entre dispositivos), escrito só pela RPC `set_active_group`. Entrar num grupo é sempre por **código de convite** (`join_group_by_code`) — grupos públicos (`app_group.visibility = 'public'`) entram-se diretamente com `join_public_group`, sem código. Não há convite dirigido a um utilizador específico (removido — nunca reintroduzir sem decisão explícita) nem sistema de notificações genérico. Toda a escrita em `app_group`/`group_member` passa por RPCs `security definer`; a tabela chama-se `app_group` (não `group`, que é palavra reservada em SQL).

### Backend (`supabase/`)

- **`migrations/`** — schema versionado (`YYYYMMDDHHMMSS_nome.sql`): tabelas, RLS, funções, e **dados de referência** (posições, formatos, tipos de evento). Nunca alterar o schema pela UI do Supabase sem gerar migração. O `seed.sql` **não** corre em `db push`, por isso dados de referência vão nas migrações, não no seed. As migrações correm por ordem de timestamp no nome — uma migração nova tem de usar um timestamp posterior ao da última existente. **Confirmar sempre o tip com `ls supabase/migrations | tail -1` contra o `main` atualizado, nunca de memória.** O `schema_migrations` é indexado **só pelo timestamp** (o nome do ficheiro não conta): duas migrações com o mesmo timestamp — típico de branches paralelos criados no mesmo dia — passam no CI local e só rebentam no deploy com `duplicate key ... schema_migrations_pkey`. Nesse caso, renumerar **a que ainda não foi aplicada** (a que não está em `main`); nunca renumerar uma já aplicada em produção.
- **`seed.sql`** — só ambiente local (`db reset`). Existe porque o Supabase local não reproduz os GRANTs base que a plataforma alojada dá a `anon`/`authenticated`; sem ele a app apanha `permission denied for table ...`. Não é sítio para dados de referência.
- **`functions/`** — Edge Functions (Deno). `health` é o keep-alive público (`verify_jwt=false`, retorna 200).
- **`tests/`** — pgTAP (`rls_test.sql`) para invariantes de RLS.
- **Tipos DB** (`web/src/types/database.ts`) são mantidos **à mão** (e podem ser regenerados com `npm run db:types` quando há BD local). Ao adicionar/alterar tabelas numa migração, atualizar este ficheiro.

## Regras de ouro

- **Comentários: só JSDoc simples.** Uma linha (ou duas) a dizer o que a coisa é. Nada de comentários a narrar a história da mudança ("antes fazia X", "isto estava mal porque…"), a justificar a alteração, a repetir o que o código já diz, ou a explicar o óbvio. Se um porquê é mesmo preciso, é uma frase curta — não um parágrafo. O contexto da mudança vai na mensagem de commit e no PR, não no ficheiro.
- **RLS em TODAS as tabelas.** A chave anon é pública; a segurança está na BD. Padrão: RLS + GRANTs por coluna para impedir editar campos sensíveis (`role`, `created_by`) — o próprio nunca escala privilégios. Helpers SQL `is_admin()` e `is_game_organizer()` são `security definer`.
- **Segredos** (`service_role`, DB password, access token) **só** em GitHub Secrets / Edge Functions — nunca no bundle nem no repo.
- **Schema só via `migrations/`.**
- **XP é um ledger append-only** (`xp_ledger`) com regras versionadas (`xp_rule`); nunca editado destrutivamente. Corrigir um jogo já fechado passa por `admin_reopen_game` (volta a `finished` e **estorna** a XP com movimentos simétricos, em vez de a apagar); fechar outra vez reatribui com os dados certos.
- **Privacidade de perfis:** todos os autenticados leem todos os perfis (decisão deliberada — é uma app entre amigos); colunas sensíveis (`birth_date`, `weight_kg`, `height_cm`) estão isoladas em `profile_private` com RLS restrita ao dono.

## Deploy (CI/CD via GitHub Actions)

Push para `main`:

- Frontend → a Vercel faz build e publica automaticamente (Root Directory = `web`); PRs geram preview URLs.
- Alterações em `supabase/**` → `deploy.yml` aplica migrações e faz deploy das Edge Functions.

Workflows: `ci.yml` (lint/typecheck/test/build), `db-check.yml` (pgTAP), `deploy.yml`, `keepalive.yml`, `backup.yml`, `cleanup.yml` (semanal: chama `purge_stale_data()` com a service_role — apaga avisos lidos, tracking com mais de 180 dias, sessões penduradas e sorteios abandonados; nunca toca em histórico). Precisa do segredo `SUPABASE_SERVICE_ROLE_KEY`.

## Docs

`docs/ARQUITETURA.md` (arquitetura completa) e `docs/SETUP.md` (arranque local para novos devs).
