# Peladinhas - Documento Técnico de Arquitetura

> Plataforma web para gestão de jogos de futebol entre amigos: jogos, estatísticas, rankings, desafios, XP e conquistas.
> **Estado:** Proposta de arquitetura para aprovação. **Não contém código.**
> **Autor/Manutenção:** 1 pessoa. **Custo-alvo:** 0 € recorrentes.

---

## Sumário executivo (TL;DR)

| Camada | Escolha | Custo |
|---|---|---|
| Frontend | **React + Vite + TypeScript** | 0 € |
| Hosting frontend | **Vercel** (ou Cloudflare Pages) via GitHub | 0 € |
| Backend / API | **Supabase** (Postgres + PostgREST + Edge Functions) - sem servidor próprio | 0 € |
| Base de dados | **PostgreSQL** (gerido pelo Supabase) | 0 € |
| Autenticação | **Supabase Auth** (email+password, magic link, reset embutido) | 0 € |
| Armazenamento de imagens | **Supabase Storage** (buckets + RLS) | 0 € |
| Lógica de confiança | **Funções Postgres (RPC/SQL) + Edge Functions (Deno)** | 0 € |
| Tarefas agendadas | **pg_cron** (fecho de votações) + **GitHub Actions cron** (keep-alive/backup) | 0 € |
| CI/CD | **GitHub Actions** + deploy automático Vercel | 0 € |

**Padrão arquitetural:** *Backend-as-a-Service (BaaS) com segurança na base de dados (Row Level Security)*. O React comunica diretamente com o Postgres através da API do Supabase; toda a autorização é imposta na base de dados por RLS, e a lógica que **não pode** confiar no cliente (equilíbrio de equipas, cálculo de XP, fecho de votações, conquistas) vive em funções no servidor. Isto elimina a operação de um servidor aplicacional próprio - o principal fator de custo e de manutenção.

**O risco número 1 a mitigar:** projetos Supabase no plano gratuito **suspendem após ~7 dias de inatividade**. Resolvido com um *ping* agendado (secção 3.9). É o único ponto que ameaça o requisito "online 24/7" e tem solução gratuita e automática.

---

## 1. Análise de Requisitos

### 1.1 Requisitos Funcionais (RF)

**Utilizadores**
- RF-01 Login e logout.
- RF-02 Recuperação de password (email).
- RF-03 Alteração de password (autenticado).
- RF-04 Edição de perfil: nome, email, foto (opcional), idade, peso, altura, género, localidade, pé preferido, posição principal, posições secundárias.

**Jogos**
- RF-05 Criar jogos futuros com data, hora, localização, tipo/formato (1v1…11v11), nº máximo de jogadores.
- RF-06 Adicionar jogadores na criação, posteriormente ou durante o jogo.
- RF-07 Gerir o ciclo de vida do jogo através de estados bem definidos.

**Equipas**
- RF-08 Gerar equipas equilibradas automaticamente considerando posição principal, secundárias, experiência, desempenho histórico e equilíbrio global.
- RF-09 Permitir ajuste manual das equipas geradas (implícito e recomendado).

**Eventos**
- RF-10 Registar eventos durante/após o jogo (golo, assistência, defesa, penálti convertido/falhado, livre convertido…).
- RF-11 Cada evento guarda jogador, jogo, momento e informação adicional.
- RF-12 Suportar *tags* em golos e defesas (bicicleta, cabeceamento, pé esquerdo/direito, voleio, remate de longe…).
- RF-13 Adicionar novos tipos de evento **sem refatoração** (tipos e tags orientados a dados, não a código).

**MVP / Flop**
- RF-14 Cada participante vota 1 MVP e 1 Flop por jogo.
- RF-15 Não pode votar em si próprio; um voto por categoria.
- RF-16 Votação fecha automaticamente no dia seguinte ao jogo.

**Estatísticas**
- RF-17 Estatísticas individuais: jogos, vitórias, empates, derrotas, golos, assistências, defesas, MVPs, Flops.
- RF-18 Estatísticas consistentes e derivadas de uma fonte de verdade única (eventos/resultados).

**Rankings**
- RF-19 Rankings geral, por posição, por formato (5v5, 7v7, 11v11…), mensal e anual.

**XP / Progressão**
- RF-20 Ganhar XP por participação, vitória, golo, assistência, MVP (regras configuráveis).
- RF-21 Alterar regras de XP no futuro **sem corromper o histórico**.

**Desafios**
- RF-22 Área separada dos jogos: Crossbar Challenge, Penáltis, Livres, 1v1.
- RF-23 Histórico, vitórias/derrotas, recordes e rankings de desafios.
- RF-24 Estatísticas de desafios **não** afetam as estatísticas gerais dos jogos.

**Conquistas**
- RF-25 Achievements orientados a dados (primeiro jogo, 10/100 jogos, primeiro golo, hat-trick, 50 assistências, 10 MVPs…), facilmente extensíveis.

### 1.2 Requisitos Não Funcionais (RNF)

- RNF-01 **Custo recorrente = 0 €.** Só planos gratuitos.
- RNF-02 **Disponibilidade 24/7** de frontend, backend e BD (com mitigação de suspensão por inatividade).
- RNF-03 **Deploy fácil via GitHub** (push → deploy).
- RNF-04 **Manutenção mínima** (1 pessoa; preferir serviços geridos a auto-alojados).
- RNF-05 **Segurança correta**: autenticação robusta, autorização por linha, proteção de dados pessoais (peso, idade, etc.).
- RNF-06 **Escalabilidade** até dezenas→centenas de utilizadores e milhares de jogos/grandes históricos **sem reescrita**.
- RNF-07 **Manutenibilidade/extensibilidade**: novos tipos de evento, regras de XP e conquistas sem migrações destrutivas.
- RNF-08 **Consistência de dados**: estatísticas e rankings sempre coerentes com os eventos registados.
- RNF-09 **Portabilidade / anti-lock-in razoável**: dados em Postgres padrão, exportáveis (`pg_dump`).
- RNF-10 **Observabilidade mínima**: logs e um backup periódico.

### 1.3 Riscos

| # | Risco | Impacto | Probabilidade | Mitigação |
|---|---|---|---|---|
| R1 | Suspensão do projeto Supabase por inatividade (~7 dias) | Alto (viola 24/7) | Alta (app de amigos tem períodos mortos) | *Ping* agendado (GitHub Actions cron + Edge Function/health endpoint) |
| R2 | Limites do plano gratuito (≈500 MB BD, 1 GB storage, 5 GB banda, 50k MAU) | Médio | Baixa a esta escala | Fotos comprimidas; limpeza de logs; monitorizar; caminho de upgrade existe |
| R3 | Perda de dados / sem backup automático rico no free tier | Alto | Baixa | `pg_dump` semanal via GitHub Action para o próprio repo/artefacto privado |
| R4 | Vendor lock-in (Supabase/Vercel) | Médio | - | Postgres padrão + migrações versionadas; RLS/SQL portável; frontend estático migrável |
| R5 | Chave `anon` é pública → confiança indevida no cliente | Alto (segurança) | Média se mal desenhado | **RLS obrigatório em todas as tabelas**; lógica sensível em funções `SECURITY DEFINER` |
| R6 | Regras de XP mudam e corrompem histórico | Médio | Média | XP como **ledger append-only** versionado por regra; nunca recalcular destrutivamente |
| R7 | Estatísticas divergem dos eventos (dupla fonte de verdade) | Médio | Média | Estatísticas **derivadas** (vistas/materialized views), não colunas mantidas à mão |
| R8 | Algoritmo de equilíbrio "injusto" gera insatisfação social | Baixo (mas sensível) | Média | Transparência do rating + ajuste manual + pesos configuráveis |
| R9 | Manipulação de votos/eventos por participantes | Médio | Média | Autorização por RLS + janela temporal imposta no servidor + unicidade de voto |
| R10 | Fuso horário no "dia seguinte ao jogo" | Baixo | Média | Guardar timestamps em UTC + timezone da app (Europe/Lisbon) explícito |

### 1.4 Desafios Técnicos

1. **"24/7 a custo zero"** é uma contradição parcial: nenhum free tier garante SLA. A arquitetura assume *best-effort* com keep-alive - adequado para uso entre amigos, e honesto quanto às garantias.
2. **Extensibilidade orientada a dados** (eventos, tags, XP, conquistas) sem refatoração exige modelação por *lookup tables* e regras-como-dados desde o início.
3. **Consistência das estatísticas** com histórico grande: derivar vs. materializar. Escolha: derivar por vistas; materializar rankings pesados quando necessário.
4. **Segurança sem backend próprio**: toda a autorização tem de ser expressável em RLS/funções SQL. É poderoso mas exige rigor.
5. **Equilíbrio de equipas** é um problema de otimização; precisa de ser um módulo substituível (o utilizador quer melhorá-lo no futuro).

---

## 2. Arquitetura Proposta

### 2.1 Visão geral

```
                         ┌──────────────────────────────────────┐
                         │              GitHub (repo)            │
                         │  /web  /supabase  /.github/workflows  │
                         └──────────────┬─────────────┬─────────┘
                     push (frontend)    │             │  push (migrations/functions)
                                        ▼             ▼
                         ┌───────────────────┐   ┌───────────────────────────┐
   Browser  ── HTTPS ──▶ │  Vercel (CDN)     │   │  GitHub Actions           │
   (React SPA)           │  React estático   │   │  - CI (lint/test/types)   │
        │                └───────────────────┘   │  - Deploy migrations      │
        │                                         │  - Cron keep-alive        │
        │  Supabase JS client (JWT)               │  - Cron pg_dump backup    │
        ▼                                         └────────────┬──────────────┘
 ┌───────────────────────────────────────────────┐            │
 │                  SUPABASE                       │◀───────────┘
 │  ┌───────────┐  ┌──────────┐  ┌──────────────┐  │
 │  │ Auth (GoTrue) │ PostgREST │  Storage       │  │
 │  └─────┬─────┘  └────┬─────┘  └──────┬───────┘  │
 │        │  JWT        │ REST/Realtime  │ imagens  │
 │        ▼             ▼                ▼          │
 │  ┌────────────────────────────────────────────┐ │
 │  │            PostgreSQL                        │ │
 │  │  Tabelas + RLS + Vistas + Funções (RPC)      │ │
 │  │  pg_cron (fecho de votações) + pg_net        │ │
 │  └────────────────────────────────────────────┘ │
 │  ┌────────────────────────────────────────────┐ │
 │  │  Edge Functions (Deno): balanceamento,       │ │
 │  │  cálculo de XP/conquistas, jobs pesados      │ │
 │  └────────────────────────────────────────────┘ │
 └─────────────────────────────────────────────────┘
```

### 2.2 Componentes

- **React SPA (cliente):** UI, estado de servidor via TanStack Query, formulários e validação (Zod), chamadas ao Supabase JS. Nunca é fonte de autoridade - só apresenta e pede.
- **Supabase Auth (GoTrue):** emissão de JWT, email+password, magic link, reset e alteração de password embutidos.
- **PostgREST:** API REST automática sobre as tabelas/vistas, filtrada por RLS. Também *realtime* (websockets) para atualizações ao vivo do jogo.
- **PostgreSQL:** fonte única de verdade. Contém RLS, vistas de estatísticas/rankings, funções RPC (votar, registar evento, gerar equipas), e `pg_cron` para o fecho automático de votações.
- **Edge Functions (Deno):** lógica que beneficia de linguagem imperativa ou de correr fora da transação SQL - algoritmo de equilíbrio, atribuição de XP/conquistas em lote, health endpoint para keep-alive.
- **Supabase Storage:** bucket `avatars` (fotos de perfil) com políticas de acesso.
- **GitHub + Actions:** repositório, CI, aplicação de migrações (Supabase CLI), cron de keep-alive e de backup.
- **Vercel:** build e distribuição CDN do SPA, preview deployments por PR.

### 2.3 Fluxo de dados (exemplos)

**Registar um golo com tags (durante o jogo):**
1. Cliente chama RPC `register_event(game_id, player_id, type='goal', minute, tags[])`.
2. A função valida (RLS + regras): o autor é participante/organizador; o jogo está `in_progress`; o jogador pertence ao jogo.
3. Insere em `event` e `event_tag`. (XP não é atribuído aqui - ver abaixo.)
4. *Realtime* propaga a alteração; as vistas de estatísticas refletem-na imediatamente.

**Fecho de votação + XP + conquistas (automático):**
1. `pg_cron` corre de hora a hora: seleciona jogos cuja janela de votação expirou (dia seguinte ao jogo) e ainda estão `voting_open`.
2. Fecha a votação, calcula MVP/Flop (desempate definido), transita o jogo para `closed`.
3. Aciona (via `pg_net`/Edge Function) o cálculo de **XP** a partir das `xp_rule` vigentes e escreve linhas em `xp_ledger` (append-only).
4. Avalia definições de **conquistas** e insere `user_achievement` para as recém-desbloqueadas.
5. Rankings/estatísticas atualizam-se (vistas) ou são materializados num refresh.

### 2.4 Decisões arquiteturais (ADR resumidos)

- **ADR-1 - BaaS em vez de servidor próprio.** Elimina o custo e a manutenção de um backend/host aplicacional. *Trade-off:* toda a autorização tem de caber em RLS/SQL. **Aceite** - é o que torna "0 € + manutenção mínima" viável.
- **ADR-2 - Postgres relacional (não NoSQL/Firestore).** O domínio é fortemente relacional (jogos↔jogadores↔eventos↔votos↔rankings com agregações e joins). Postgres dá integridade referencial, vistas e SQL analítico. **Aceite.**
- **ADR-3 - Estatísticas derivadas, não duplicadas.** Fonte de verdade = eventos + resultados; estatísticas via vistas; rankings pesados via *materialized views* com refresh agendado. Evita divergência (R7). **Aceite.**
- **ADR-4 - XP como ledger append-only + regras versionadas.** Preserva histórico quando as regras mudam (R6/RF-21). **Aceite.**
- **ADR-5 - Tipos de evento, tags, regras de XP e conquistas como *dados*.** Novos tipos sem deploy de código (RF-13/RF-21/RF-25). **Aceite.**
- **ADR-6 - Algoritmo de equilíbrio como módulo isolado com pesos configuráveis.** Permite evolução sem tocar no resto (RF-08). **Aceite.**
- **ADR-7 - Desafios em esquema/tabelas separadas.** Isolamento total das estatísticas de jogos (RF-24). **Aceite.**

### 2.5 Justificação das tecnologias

- **React + Vite + TypeScript:** React é imposto; Vite dá build rápido e output estático (ideal para hosting gratuito); TypeScript reduz bugs e documenta o modelo - crítico para 1 manutentor.
- **Supabase:** único serviço que, no plano gratuito, entrega **Postgres + Auth + Storage + API + Realtime + cron** de forma integrada. Substitui 4 serviços por 1, minimizando manutenção. Sem lock-in severo: por baixo é Postgres padrão exportável.
- **PostgREST/RLS:** dá uma API segura sem escrever/servidor manter uma. A segurança "por linha" é exatamente o modelo certo para "cada um só mexe no que pode".
- **Edge Functions (Deno):** para a lógica que não convém em SQL puro, ainda dentro do mesmo fornecedor e do free tier.
- **Vercel/Cloudflare Pages:** deploy Git-driven, CDN global, HTTPS automático, previews por PR - tudo gratuito.
- **GitHub Actions:** CI/CD, cron de keep-alive e backups - sem infra adicional.

---

## 3. Infraestrutura

### 3.1 Frontend
- **Tecnologia:** React 18 + Vite + TypeScript. Router: React Router. Estado de servidor: **TanStack Query** (cache, revalidação). Formulários: React Hook Form + **Zod**. UI: **Tailwind CSS** + componentes headless (Radix/shadcn) para acessibilidade sem CSS pesado.
- **Hosting:** **Vercel** (grátis; deploy automático por push; previews por PR; HTTPS). *Alternativa:* **Cloudflare Pages** (banda ilimitada) ou GitHub Pages (mais limitado, sem previews).
- **Porquê:** output estático → hosting gratuito e sem servidor a manter; SPA suficiente (não há necessidade de SEO/SSR numa app privada entre amigos).

### 3.2 Backend
- **Sem servidor aplicacional.** A "API" é o PostgREST do Supabase + funções RPC no Postgres + Edge Functions para lógica específica.
- **Porquê:** cumpre "não pagar servidores" e "manutenção mínima". A lógica de confiança fica junto dos dados (menos superfícies, menos deploys).

### 3.3 Base de dados
- **PostgreSQL gerido pelo Supabase** (free: ~500 MB, suficiente para milhares de jogos e grandes históricos de eventos textuais).
- **Porquê:** relacional, transacional, com vistas/materialized views, `pg_cron`, extensões. Exportável (`pg_dump`) → sem lock-in real.

### 3.4 Autenticação
- **Supabase Auth**: email+password com **reset** e **alteração** embutidos (RF-02/03), e **magic link** como opção "sem password" para os menos técnicos (RF: "autenticação simples").
- Confirmação de email ativável. OAuth (Google) opcional no futuro sem custo.
- **Porquê:** implementação de auth segura é onde mais projetos falham; delegar num serviço testado é a decisão certa para 1 pessoa.

### 3.5 Armazenamento de imagens
- **Supabase Storage**, bucket `avatars` (privado ou público-restrito), políticas por utilizador (só o dono escreve o seu avatar). Compressão/resize no cliente antes do upload (ex.: máx. 512×512, WebP) para poupar o 1 GB.
- **Porquê:** integrado com a mesma Auth/RLS; URLs assinadas; transformação de imagem disponível.

### 3.6 Deploy
- **Frontend:** push para `main` → Vercel faz build e publica. PRs geram *preview URLs*.
- **BD/Funções:** migrações SQL e Edge Functions versionadas em `/supabase`; aplicadas por GitHub Action com a **Supabase CLI** (`supabase db push`, `supabase functions deploy`).
- **Porquê:** "deploy fácil via GitHub" cumprido de ponta a ponta; base de dados como código (reprodutível, revisável).

### 3.7 CI/CD (GitHub Actions)
- **CI (por PR):** typecheck, lint (ESLint), testes (Vitest), build.
- **CD (em `main`):** aplicar migrações + deploy de funções; Vercel trata do frontend.
- **Cron keep-alive:** ver 3.9.
- **Cron backup:** `pg_dump` semanal → artefacto/commit num repo privado.

### 3.8 Tarefas agendadas
- **`pg_cron` (dentro do Postgres):** fecho automático das votações MVP/Flop e disparo de XP/conquistas (RF-16).
- **GitHub Actions cron:** keep-alive e backup (fora do Supabase, para não depender dele estar acordado).

### 3.9 Mitigação do "24/7" (crítica)
- **Problema:** projeto free suspende após ~7 dias sem tráfego.
- **Solução:** GitHub Action agendada (ex.: 2×/dia) faz um pedido leve a uma Edge Function `health` (ou a uma tabela via API). Isto conta como atividade e mantém o projeto ativo, a custo zero, gerido pelo próprio GitHub. Complementarmente, um *uptime monitor* gratuito (UptimeRobot) pode fazer o mesmo e alertar por email se algo cair.
- **Honestidade de engenharia:** isto é *best-effort*, não um SLA. Para uma app entre amigos é perfeitamente adequado; deve ficar documentado que não há garantia contratual de disponibilidade.

---

## 4. Modelo de Dados

Princípios: 3ª forma normal como base; *lookup tables* para tudo o que deve crescer sem migração; estatísticas **derivadas**; XP **append-only**; timestamps em `timestamptz` (UTC) com timezone aplicacional `Europe/Lisbon`.

### 4.1 Entidades principais

**Identidade e perfil**
- `auth.users` - gerida pelo Supabase (email, hash de password, etc.). Não tocar diretamente.
- `profile` - 1:1 com `auth.users`. Campos: `id (=auth uid)`, `name`, `photo_url`, `birth_date` (guardar data, não idade - idade é derivada), `weight_kg`, `height_cm`, `gender`, `locality`, `preferred_foot` (enum: left/right/both), `main_position_id`, `role` (player/admin), `created_at`.
- `position` - lookup (GK, DEF, MID, FWD, e sub-posições). `secondary_position` - N:N entre `profile` e `position`.

**Jogos e equipas**
- `game` - `id`, `created_by`, `scheduled_at (timestamptz)`, `location`, `format_id`, `max_players`, `status`, `home_score`, `away_score`, `voting_closes_at`, `created_at`.
- `game_format` - lookup (1v1…11v11, com `players_per_side`).
- `game_status` - enum controlado (ver 4.4).
- `game_player` - N:N `game`↔`profile`: `game_id`, `player_id`, `status` (invited/confirmed/played/no_show), `team` (A/B/null), `added_at`.
- `team_assignment` (opcional) - histórico da geração de equipas (rating usado, versão do algoritmo, pesos), para transparência/reprodutibilidade.

**Eventos**
- `event_type` - **lookup** (`code`, `label`, `supports_tags bool`, `default_xp` opcional, `affects_score bool`). Novos tipos = INSERT (RF-13).
- `event` - `id`, `game_id`, `player_id`, `event_type_id`, `minute` (nullable), `team` (A/B), `meta jsonb` (informação adicional flexível), `created_by`, `created_at`.
- `tag` - lookup (`code`, `label`, `category` p/ filtrar por tipo de evento).
- `event_tag` - N:N `event`↔`tag`.

**Votação MVP/Flop**
- `vote` - `id`, `game_id`, `voter_id`, `category` (mvp/flop), `votee_id`, `created_at`. Constraints: `UNIQUE(game_id, voter_id, category)`; `CHECK(voter_id <> votee_id)`; inserção só permitida se `now() < game.voting_closes_at` e ambos são participantes.

**XP e progressão**
- `xp_rule` - regras versionadas: `id`, `code` (participation/win/goal/assist/mvp…), `points`, `valid_from`, `valid_to`, `active`. Nunca editar destrutivamente - criar nova versão.
- `xp_ledger` - **append-only**: `id`, `player_id`, `game_id` (nullable), `source_code`, `points`, `xp_rule_id`, `created_at`. XP total = `SUM(points)` por jogador. `level` derivado por curva (ver `xp_level`).
- `xp_level` - mapa nível↔XP mínimo (curva configurável).

**Desafios (isolados)**
- `challenge` - lookup: `code` (crossbar/penalty/freekick/1v1), `label`, `scoring_type` (higher_better/lower_better), `record_metric`.
- `challenge_attempt` - `id`, `challenge_id`, `player_id`, `opponent_id` (nullable, p/ 1v1), `score`, `result` (win/loss/draw/na), `played_at`, `meta jsonb`.
- `challenge_record` - recordes correntes por desafio (derivável ou materializado).

**Conquistas (orientadas a dados)**
- `achievement` - `id`, `code`, `label`, `description`, `icon`, `criteria jsonb` (ex.: `{metric:'goals', op:'>=', value:1}` ou `{metric:'games', value:100}`), `active`.
- `user_achievement` - `player_id`, `achievement_id`, `unlocked_at`. `UNIQUE(player_id, achievement_id)`.

### 4.2 Estatísticas e rankings (derivados - não são tabelas base)
- `v_player_stats` (view): por jogador agrega de `event`, `game`, `game_player`, `vote` → jogos, V/E/D, golos, assistências, defesas, MVPs, Flops.
- `v_ranking_general`, `v_ranking_by_position`, `v_ranking_by_format`, `v_ranking_monthly`, `v_ranking_yearly` (views; materializar as pesadas com refresh via `pg_cron`).
- **Porquê derivar:** garante RF-08/RNF-08 (consistência) - nunca há um contador desincronizado dos eventos.

### 4.3 ERD textual

```
auth.users 1───1 profile
profile *───* position           (via secondary_position; + main_position_id)
profile 1───* game               (created_by)
profile 1───* xp_ledger
profile 1───* user_achievement
profile 1───* challenge_attempt

game 1───* game_player *───1 profile
game 1───1 game_format
game 1───* event *───1 event_type
event *───* tag                  (via event_tag)
event *───1 profile              (player_id)
game 1───* vote                  (voter_id, votee_id → profile)

xp_rule 1───* xp_ledger
xp_level (curva, sem FK)

challenge 1───* challenge_attempt
challenge 1───* challenge_record

achievement 1───* user_achievement
```

### 4.4 Estados do jogo (máquina de estados)

```
draft ─▶ scheduled ─▶ open (inscrições)
                          │
                          ▼
                   teams_generated ──▶ in_progress ──▶ finished
                                                          │
                                                          ▼
                                                    voting_open ──(dia seguinte / pg_cron)──▶ closed
   qualquer estado ─▶ cancelled
```

- `draft`: a ser criado. `scheduled`: publicado com data. `open`: aceita inscrições/jogadores. `teams_generated`: equipas equilibradas geradas (ajustáveis). `in_progress`: a decorrer, permite registo de eventos ao vivo. `finished`: terminado, resultado fechado. `voting_open`: votação MVP/Flop ativa até `voting_closes_at`. `closed`: XP/conquistas processados, imutável. `cancelled`: anulado.

### 4.5 Índices e constraints (essenciais)
- **PK/FK** em todas as relações; `ON DELETE` pensado (ex.: apagar jogo → *cascade* de eventos/votos; apagar perfil → política de anonimização, não *cascade* cego).
- Índices: `event(game_id)`, `event(player_id)`, `event(event_type_id)`, `game(scheduled_at)`, `game(status)`, `game_player(game_id)`, `game_player(player_id)`, `vote(game_id)`, `xp_ledger(player_id)`.
- Constraints: `vote UNIQUE(game_id,voter_id,category)` + `CHECK(voter_id<>votee_id)`; `game_player UNIQUE(game_id,player_id)`; `user_achievement UNIQUE(player_id,achievement_id)`; `CHECK` de coerência de scores/estado.
- Enums controlados via lookup ou `CHECK`, preferindo lookup onde deve crescer.

### 4.6 Normalização
- Núcleo em **3FN**. Exceção deliberada e controlada: `event.meta jsonb` para atributos raros/variáveis (evita colunas esparsas) e *materialized views* de ranking (desnormalização só para leitura, reconstruível). Estatísticas nunca são desnormalizadas em tabelas base.

---

## 5. Segurança

### 5.1 Autenticação
- Supabase Auth com JWT de curta duração + refresh tokens; password hashing gerido (bcrypt/argon). Reset por email com token temporário. Confirmação de email recomendada. Política de password mínima e, opcionalmente, magic link (sem password = sem password para roubar).

### 5.2 Autorização (o núcleo do modelo)
- **RLS ativado em TODAS as tabelas** (a chave `anon` é pública; sem RLS, tudo fica exposto - R5).
- Políticas típicas:
  - `profile`: qualquer autenticado lê campos públicos; só o dono edita o seu perfil; dados sensíveis (peso, idade) só visíveis ao próprio e/ou por opção de privacidade.
  - `game`: leitura para autenticados; escrita/edição só `created_by` ou `admin`.
  - `game_player`: gerido pelo organizador; o próprio pode confirmar/desistir.
  - `event`: inserção só por organizador/participante e só com o jogo `in_progress/finished`; edição limitada.
  - `vote`: inserção só por participante, dentro da janela, respeitando unicidade e "não votar em si" - imposto por RLS + `CHECK` + verificação temporal no servidor.
  - `xp_ledger`, `user_achievement`: **escrita só por funções `SECURITY DEFINER`** (nunca diretamente pelo cliente).
- **Papéis:** `player` e `admin` (via claim/coluna). Ações administrativas (corrigir resultado, apagar jogo) restritas a `admin`.

### 5.3 Proteção contra abuso
- Regras de negócio no servidor (não no cliente): janela de votação, não-auto-voto, integridade de eventos.
- Rate limiting do Auth (embutido) contra brute-force; captcha opcional no signup.
- Validação dupla: Zod no cliente (UX) + `CHECK`/constraints/funções na BD (verdade).
- Uploads: validar tipo/tamanho, restringir bucket por RLS, servir via URLs assinadas.

### 5.4 Proteção de dados (privacidade)
- Dados pessoais sensíveis (idade/data de nascimento, peso, altura, localidade): privados por omissão, com controlo de visibilidade por utilizador.
- Minimização: guardar `birth_date` e derivar idade; permitir apagar conta com anonimização (manter estatísticas agregadas sem PII).
- Transporte sempre HTTPS (garantido por Vercel/Supabase). Segredos (service role key) **apenas** em GitHub Secrets/Edge Functions, nunca no bundle do frontend.
- Backups num local privado; sem PII em logs.

---

## 6. UX/UI - Wireframes textuais

Convenções: topo = navegação; conteúdo mobile-first (a maioria vai usar telemóvel no balneário/campo).

**Login**
```
┌───────────────────────────┐
│         PELADINHAS ⚽       │
│  ┌─────────────────────┐  │
│  │ Email               │  │
│  │ Password            │  │
│  └─────────────────────┘  │
│  [ Entrar ]               │
│  ─ ou ─                   │
│  [ Enviar link mágico ]   │
│  Esqueci a password ·  Criar conta │
└───────────────────────────┘
```

**Dashboard**
```
┌ Peladinhas ── Jogos Rankings Desafios Perfil ┐
│ Olá, Vasco 👋   Nível 7 ▰▰▰▰▱ 320 XP p/ nível 8 │
├───────────────────────────────────────────────┤
│ PRÓXIMO JOGO                                   │
│  Sáb 12 Jul · 20:00 · Pavilhão X · 5v5        │
│  8/10 confirmados   [Confirmar presença]       │
├───────────────────────────────────────────────┤
│ AÇÕES RÁPIDAS  [+ Criar jogo] [Votar MVP/Flop] │
├───────────────────────────────────────────────┤
│ RESUMO   J 42 · V 25 · G 30 · A 18 · MVP 5    │
│ CONQUISTAS RECENTES  🏅 Hat-trick  🏅 50 assist.│
└───────────────────────────────────────────────┘
```

**Perfil**
```
┌ Perfil ───────────────────────────────────────┐
│  (foto)  Nome ▸ editável                       │
│  Posição principal: MID   Secundárias: FWD, DEF│
│  Pé: Direito  · Localidade: Aveiro             │
│  [Editar perfil] [Alterar password]            │
├─ Privado (só tu) ─ Idade 29 · 74kg · 1.80m ────┤
│ ESTATÍSTICAS  J/V/E/D · G/A/Def · MVP/Flop     │
│ XP  Nível 7 · gráfico de evolução              │
│ CONQUISTAS  grelha de medalhas (bloq/desbloq)  │
└───────────────────────────────────────────────┘
```

**Jogos (lista)**
```
┌ Jogos ───────────────── [+ Criar jogo] ────────┐
│ [Próximos] [A decorrer] [Terminados]            │
│ ┌ Sáb 12 · 20:00 · 5v5 · Pavilhão X ─ open ──┐ │
│ │ 8/10 confirmados            [Ver detalhe] │ │
│ └────────────────────────────────────────────┘ │
│ ┌ Qua 09 · 21:00 · 7v7 ─ voting_open ─────────┐ │
│ │ Vota MVP/Flop até amanhã!   [Votar]        │ │
│ └────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────┘
```

**Detalhe do jogo**
```
┌ Sáb 12 Jul · 20:00 · 5v5 · Pavilhão X ─ in_progress ┐
│ EQUIPA A  3 ── 2  EQUIPA B      [Gerar equipas ⚖]   │
│ A: Vasco, João, Tó...   B: Rui, Zé...  (arrastar↔)  │
├─ Registar evento ─ [Golo][Assist.][Defesa][Penálti] │
│  Jogador ▾  Minuto ▾  Tags: [Voleio][Pé esq.]…      │
├─ Timeline ─ 12' ⚽ Vasco (Voleio) · 18' 🧤 Rui ...   │
├─ Ações ─ [Terminar jogo] → abre votação MVP/Flop    │
└─────────────────────────────────────────────────────┘
```

**Rankings**
```
┌ Rankings ───────────────────────────────────────┐
│ [Geral] [Posição] [Formato ▾ 5v7v11] [Mês][Ano] │
│  #1 🥇 Vasco   1240 pts                          │
│  #2 🥈 Rui      1180                             │
│  #3 🥉 João     1105                             │
│  ...  (por golos / assist. / MVP alternável)     │
└──────────────────────────────────────────────────┘
```

**Desafios**
```
┌ Desafios ────────────────────────────────────────┐
│ [Crossbar] [Penáltis] [Livres] [1v1]              │
│ CROSSBAR CHALLENGE                                │
│  Recorde: 7 seguidos (Rui)   Teu recorde: 4      │
│  [Registar tentativa]                            │
│  Ranking:  1 Rui 7 · 2 Vasco 5 · 3 João 4        │
│  Histórico: tentativas anteriores (V/D)          │
│  (nota: não conta para estatísticas de jogos)     │
└──────────────────────────────────────────────────┘
```

**Estatísticas (detalhe)**
```
┌ Estatísticas - Vasco ─────────────────────────────┐
│ Filtros: [Época ▾][Formato ▾][Posição ▾]          │
│ Jogos 42 · V25 E7 D10 · %V 60                     │
│ Golos 30 (0.71/jogo) · Assist. 18 · Defesas 12    │
│ MVP 5 · Flop 1                                    │
│ Gráficos: golos por mês · evolução de XP · win%   │
└───────────────────────────────────────────────────┘
```

---

## 7. Estrutura do Projeto

Monorepo simples (frontend + definição da BD/funções juntos, versionados):

```
peladinhas/
├─ web/                          # React SPA
│  ├─ src/
│  │  ├─ app/                    # router, providers, layout
│  │  ├─ features/               # 1 pasta por domínio
│  │  │  ├─ auth/
│  │  │  ├─ profile/
│  │  │  ├─ games/
│  │  │  ├─ teams/
│  │  │  ├─ events/
│  │  │  ├─ voting/
│  │  │  ├─ stats/
│  │  │  ├─ rankings/
│  │  │  ├─ challenges/
│  │  │  └─ achievements/
│  │  ├─ components/ui/          # componentes partilhados
│  │  ├─ lib/                    # supabase client, query client, utils
│  │  ├─ types/                  # tipos gerados da BD (supabase gen types)
│  │  └─ main.tsx
│  ├─ index.html
│  ├─ vite.config.ts
│  └─ package.json
│
├─ supabase/                     # "backend as code"
│  ├─ migrations/                # SQL versionado (schema, RLS, views, funcs)
│  ├─ functions/                 # Edge Functions (Deno)
│  │  ├─ balance-teams/
│  │  ├─ award-xp/
│  │  ├─ evaluate-achievements/
│  │  └─ health/                 # keep-alive
│  ├─ seed/                      # dados de lookup (event_type, tags, xp_rule…)
│  └─ config.toml
│
├─ .github/workflows/
│  ├─ ci.yml                     # lint/test/types/build
│  ├─ deploy.yml                 # migrations + functions deploy
│  ├─ keepalive.yml              # cron ping (24/7)
│  └─ backup.yml                 # cron pg_dump
│
├─ docs/
│  └─ ARQUITETURA.md             # este documento
└─ README.md
```

---

## 8. Roadmap (fases pequenas e realistas)

Complexidade: 🟢 baixa · 🟡 média · 🔴 alta. Esforço em "sessões" (unidades relativas para 1 pessoa).

| Fase | Objetivo | Dependências | Complex. | Esforço |
|---|---|---|---|---|
| **F0 - Fundações** | Repo, Vite+React+TS, Tailwind, Supabase project, CI, deploy Vercel "hello world", keep-alive | - | 🟢 | 2–3 |
| **F1 - Auth & Perfil** | Login/logout, reset/alterar password, `profile` + posições, edição de perfil, upload de avatar, RLS de perfil | F0 | 🟡 | 4–5 |
| **F2 - Jogos (CRUD + estados)** | Criar/editar jogo, formatos, adicionar jogadores (criação/depois/durante), máquina de estados, RLS | F1 | 🟡 | 5–6 |
| **F3 - Eventos & Tags** | `event_type`/`tag` como dados, registo de eventos (live/pós), tags em golos/defesas, timeline, RLS/funções | F2 | 🟡 | 4–5 |
| **F4 - Estatísticas** | Vistas de stats individuais, página de estatísticas e resumo no dashboard | F3 | 🟡 | 3–4 |
| **F5 - MVP/Flop** | Votação com regras (unicidade, não-auto-voto), janela temporal, fecho automático via `pg_cron` | F3 | 🟡 | 3–4 |
| **F6 - Equilíbrio de equipas** | Módulo de rating + algoritmo (Edge Function), pesos configuráveis, ajuste manual | F3, F4 | 🔴 | 5–6 |
| **F7 - XP & Níveis** | `xp_rule` versionadas, `xp_ledger`, curva de níveis, atribuição no fecho do jogo | F4, F5 | 🟡 | 3–4 |
| **F8 - Rankings** | Views geral/posição/formato/mensal/anual, materialização + refresh agendado | F4, F7 | 🟡 | 3–4 |
| **F9 - Conquistas** | `achievement` orientado a dados, avaliador, grelha de medalhas | F4, F7 | 🟡 | 3–4 |
| **F10 - Desafios** | Esquema isolado, tentativas, recordes, rankings de desafios | F1 | 🟡 | 4–5 |
| **F11 - Polimento** | Realtime no jogo ao vivo, backups automáticos, acessibilidade, PWA/instalável, empty states | tudo | 🟡 | 3–4 |

**Ordem crítica:** F0→F1→F2→F3 são a espinha dorsal; F4 desbloqueia F5–F9. F6 (equilíbrio) e F10 (desafios) são relativamente independentes e podem deslizar sem bloquear o resto.

---

## 9. Preparação para Implementação

### 9.1 Melhorias / considerações antes de codar
- **PWA desde cedo:** instalável no telemóvel + registo de eventos com tolerância a rede fraca no campo. Barato e melhora muito a UX real.
- **Realtime seletivo:** ligar Supabase Realtime só na página de detalhe do jogo (placar/timeline ao vivo). Evita consumo desnecessário.
- **Geração de tipos TS a partir da BD** (`supabase gen types`) para tipagem ponta-a-ponta sem escrever tipos à mão.
- **Seed de dados de lookup versionado** (event types, tags, formatos, xp_rules, achievements) - parte das migrações, para ambientes reprodutíveis.
- **Idempotência do fecho de votação/XP:** o job tem de poder correr duas vezes sem duplicar XP (ex.: marca `xp_processed_at` no jogo).

### 9.2 Pontos críticos (a acertar à primeira)
- **RLS por defeito em tudo.** Uma tabela sem RLS = fuga de dados imediata (chave anon pública). Checklist obrigatório por migração.
- **Fuso horário do "dia seguinte".** Definir `voting_closes_at` explicitamente (ex.: 23:59 `Europe/Lisbon` do dia seguinte ao jogo) e guardar em `timestamptz`. Testar com jogos à noite.
- **XP append-only + regras versionadas.** Nunca UPDATE destrutivo em regras; sempre nova versão + `valid_from`. Caso contrário perde-se o histórico (RF-21).
- **Estatísticas derivadas.** Resistir à tentação de manter contadores em colunas - é a fonte nº1 de inconsistência.
- **Backups.** O free tier não garante recuperação a ponto no tempo; o `pg_dump` agendado é a rede de segurança real.
- **Justiça percebida do balanceamento.** Mostrar o rating usado e permitir ajuste manual - é tanto social quanto técnico.

### 9.3 Ajustes sugeridos ao âmbito
- **Papel de organizador/admin explícito** (o enunciado assume ações partilhadas mas alguém tem de ter autoridade para corrigir resultados/apagar jogos).
- **Empates em MVP/Flop:** definir desempate (ex.: mais golos; senão, sorteio/co-vencedores). Decisão de produto a fechar antes de F5.
- **"Durante o jogo" offline:** decidir se o registo ao vivo precisa de resiliência offline (fila local) já em F3 ou fica para F11.
- **Convites de novos amigos:** fluxo de convite (link/email) - provavelmente pós-MVP, mas convém reservar espaço no modelo.

### 9.4 Decisões (estado)
- ✅ **Fornecedor central:** Supabase confirmado.
- ✅ **Login:** email+password **e** magic link (ambos).
- ✅ **Registo "durante o jogo":** online simples na F3; resiliência offline (fila local/PWA) adiada para F11.
- ⬜ **Hosting frontend:** Vercel por omissão (mais simples); Cloudflare Pages fica como alternativa aberta.
- ⬜ **Desempate MVP/Flop:** decisão de produto a fechar antes da F5 (proposta: em empate, co-vencedores; ou desempate por golos no jogo).

---

*Fim do documento. Nenhuma linha de código foi escrita - aguardo aprovação da arquitetura antes de iniciar a implementação.*
