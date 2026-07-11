# Peladinhas ⚽ (repo: `liga-dos-craques`)

Plataforma web para gerir jogos de futebol entre amigos: jogos, estatísticas, rankings, desafios, sistema de XP e conquistas.

- **Custo:** 0 € recorrentes (só planos gratuitos).
- **Manutenção:** 1 pessoa.
- **Docs:** [Arquitetura](docs/ARQUITETURA.md) · [Plano da F0](docs/F0-PLANO.md)

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React + Vite + TypeScript + Tailwind + TanStack Query |
| Backend / BD / Auth / Storage | Supabase (PostgreSQL + PostgREST + Edge Functions) |
| Hosting frontend | Vercel |
| CI/CD | GitHub Actions |

## Estrutura

```
liga-dos-craques/
├─ web/                  # Frontend React (Vite)
├─ supabase/             # Backend as code
│  ├─ migrations/        # SQL versionado (schema + RLS + funções)
│  ├─ functions/         # Edge Functions (Deno) — inclui health (keep-alive)
│  └─ seed/              # Dados de referência (lookup tables)
├─ .github/workflows/    # ci · deploy · keepalive · backup
└─ docs/                 # Arquitetura e planos
```

## Desenvolvimento local

Pré-requisitos: **Node 20+**, **npm**, e (para a BD local) **Docker** + **Supabase CLI** (já vem como devDependency, use `npx supabase`).

```bash
# 1. Frontend
cd web
cp .env.example .env.local      # preencher com URL + anon key do Supabase
npm install
npm run dev                     # http://localhost:5173

# 2. Base de dados local (opcional, requer Docker)
npx supabase start              # sobe Postgres + Studio local
npx supabase db reset           # aplica migrações + seed
npm run db:types                # regenera src/types/database.ts a partir do schema
```

### Scripts (em `web/`)

| Script | Faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (typecheck + Vite) |
| `npm run lint` | ESLint (0 warnings) |
| `npm run typecheck` | Verificação de tipos |
| `npm test` | Testes (Vitest) |
| `npm run db:types` | Gera tipos TS a partir do schema Supabase |

## Deploy

- **Frontend:** push para `main` → a Vercel faz build e publica automaticamente (Root Directory = `web`). PRs geram *preview URLs*.
- **Base de dados / funções:** push para `main` que toque em `supabase/**` → o workflow `deploy.yml` aplica migrações e faz deploy das Edge Functions.

## Configuração inicial (uma vez)

Ver o **guia de handoff**: [docs/F0-HANDOFF.md](docs/F0-HANDOFF.md) — passos manuais nas plataformas (criar projeto Supabase, ligar Vercel, configurar segredos, UptimeRobot).

## Regras de ouro

- **RLS em TODAS as tabelas.** A chave anon é pública; a segurança vive na base de dados.
- **Segredos** (`service_role`, DB password, access token) **só** em GitHub Secrets / Edge Functions — nunca no bundle nem no repo.
- **Schema só via `migrations/`.** Nunca alterar o schema pela UI do Supabase sem gerar migração.
- **XP nunca é editado destrutivamente** — é um ledger append-only com regras versionadas.
