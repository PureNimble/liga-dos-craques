# Setup para desenvolvimento

Como pôr o Peladinhas a correr localmente. Este guia não contém segredos —
cada pessoa usa as suas próprias credenciais e nunca as committa.

## Pré-requisitos

- **Node 20+** e **npm**
- Opcional (para a base de dados local): **Docker** e o **Supabase CLI** (já vem
  como dependência, usar via `npx supabase`)

## Frontend

```bash
cd web
cp .env.example .env.local   # preencher com o URL e a anon key do Supabase
npm install
npm run dev                  # http://localhost:5173
```

As variáveis necessárias estão documentadas em `web/.env.example`. Os valores (URL
do projeto e anon key) obtêm-se no painel do Supabase; o `.env.local` está no
`.gitignore` e nunca deve ser committado.

## Base de dados local (opcional)

Requer Docker. A partir da raiz do repositório:

```bash
npx supabase start    # sobe Postgres + Studio local
npx supabase db reset # aplica as migrações e o seed
npm run db:types      # regenera os tipos TypeScript a partir do schema
```

## Scripts (em `web/`)

| Comando | Faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (typecheck + Vite) |
| `npm run lint` | ESLint (0 warnings) |
| `npm run typecheck` | Verificação de tipos |
| `npm test` | Testes unitários (Vitest) |
| `npm run test:db` | Testes de BD/RLS (pgTAP, requer Docker) |

## Onde fica o quê

- `web/` — frontend React (Vite + TypeScript).
- `supabase/` — backend como código: migrações SQL, Edge Functions e testes.
- `docs/` — documentação técnica.

Para a arquitetura e as decisões técnicas, ver [ARQUITETURA.md](ARQUITETURA.md).
