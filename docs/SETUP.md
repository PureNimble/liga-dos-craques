# Setup para desenvolvimento

Como pôr o Peladinhas a correr localmente. Este guia não contém segredos -
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

O `supabase/seed.sql` corre no `db reset` (nunca no `db push`/produção) e concede
localmente os privilégios base que a plataforma alojada dá por omissão - sem ele, o
app apanha `permission denied for table ...` ao ler como autenticado.

Depois de `npx supabase status`, apontar o `web/.env.local` ao stack local:

```env
VITE_SUPABASE_URL=http://127.0.0.1:44321
VITE_SUPABASE_ANON_KEY=<anon key de `npx supabase status`>
```

Emails de confirmação/recuperação caem no Inbucket (<http://127.0.0.1:44324>); o
Studio fica em <http://127.0.0.1:44323>.

As portas locais estão na gama 443xx (e não nas 543xx do Supabase por omissão)
porque no Windows o Hyper-V/winnat reserva blocos aleatórios acima de 49152 a
cada arranque e o Docker deixa de conseguir publicar as portas.

## Correr o frontend em Docker (opcional)

Para correr o frontend sem instalar Node, há um `Dockerfile` em `web/` e um
`docker-compose.yml` na raiz. O backend continua a subir pelo Supabase CLI (já é
Docker). Depois dos passos da secção anterior (backend a correr + `web/.env.local`
preenchido):

```bash
docker compose up     # frontend em http://localhost:5173
```

O browser corre no host, por isso fala diretamente com o Supabase em
`127.0.0.1:44321` - os containers não precisam de estar na mesma rede.

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

- `web/` - frontend React (Vite + TypeScript).
- `supabase/` - backend como código: migrações SQL, Edge Functions e testes.
- `docs/` - documentação técnica.

Para a arquitetura e as decisões técnicas, ver [ARQUITETURA.md](ARQUITETURA.md).
