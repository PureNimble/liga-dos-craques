# F0 — Guia de Handoff (passos manuais nas plataformas)

> O código da F0 está todo escrito e versionado. Faltam os passos que **exigem
> as tuas contas e cliques nos painéis** — não podem ser automatizados por mim.
> Segue esta ordem. Tempo estimado: ~30–45 min.

Email a usar em todas as contas: **vscosousa@gmail.com**

---

## 1. GitHub — criar o repositório remoto

1. Cria um repo **privado** chamado `liga-dos-craques` (sem README/gitignore — já existem localmente).
2. Liga o repo local e faz o primeiro push:
   ```bash
   git remote add origin https://github.com/<o-teu-user>/liga-dos-craques.git
   git add .
   git commit -m "F0: fundações (scaffold, supabase as code, CI/CD)"
   git push -u origin main
   ```

---

## 2. Supabase — criar o projeto

1. Entra em https://supabase.com com a conta Google (`vscosousa@gmail.com`).
2. **New project** →
   - Name: `liga-dos-craques`
   - Region: **Frankfurt (eu-central-1)**
   - Database password: **gera uma forte e guarda-a** (será o `SUPABASE_DB_PASSWORD`).
3. Depois de criado, vai a **Project Settings → General** e copia o **Reference ID** (`SUPABASE_PROJECT_REF`).
4. **Project Settings → API** e copia:
   - **Project URL** (`VITE_SUPABASE_URL`)
   - **anon public** key (`VITE_SUPABASE_ANON_KEY`)
   - **service_role** key (`SERVICE_ROLE_KEY`) — **secreta**, nunca no frontend.
5. **Account → Access Tokens** (https://supabase.com/dashboard/account/tokens) → **Generate new token** → guarda (`SUPABASE_ACCESS_TOKEN`).

---

## 3. Aplicar a primeira migração e a função

No teu PC (uma vez, para ligar e publicar):

```bash
npx supabase login                        # cola o access token
npx supabase link --project-ref <PROJECT_REF>
npx supabase db push                      # cria a tabela health + função ping()
npx supabase functions deploy health --project-ref <PROJECT_REF>
```

> A partir daqui, o workflow `deploy.yml` faz isto automaticamente em cada push.

---

## 4. GitHub — configurar os Secrets

No repo → **Settings → Secrets and variables → Actions → New repository secret**. Cria:

| Secret | Valor | Usado por |
|---|---|---|
| `SUPABASE_ACCESS_TOKEN` | token do passo 2.5 | deploy, backup |
| `SUPABASE_PROJECT_REF` | Reference ID | deploy, keepalive, backup |
| `SUPABASE_DB_PASSWORD` | password da BD | deploy, backup |
| `SUPABASE_ANON_KEY` | anon public key | keepalive |

> **Não** ponhas a `service_role` key aqui a menos que uma função a exija — na F0 não é necessária.

---

## 5. Vercel — ligar e publicar o frontend

1. https://vercel.com → login com GitHub.
2. **Add New → Project** → importa `liga-dos-craques`.
3. Configurar:
   - **Root Directory:** `web`
   - Framework: **Vite** (auto-detetado)
4. **Environment Variables** (para Production e Preview):
   - `VITE_SUPABASE_URL` = Project URL
   - `VITE_SUPABASE_ANON_KEY` = anon public key
5. **Deploy.** No fim tens um URL HTTPS público.
6. Volta ao Supabase → **Authentication → URL Configuration** e adiciona o domínio Vercel a **Site URL** e **Redirect URLs** (necessário para os links de login/recuperação na F1).

---

## 6. UptimeRobot — monitor externo (keep-alive reforçado)

1. https://uptimerobot.com → conta gratuita.
2. **Add New Monitor**:
   - Type: **HTTP(s)**
   - URL: `https://<PROJECT_REF>.supabase.co/functions/v1/health`
   - Intervalo: 5 min (ou o mínimo do plano)
   - Alert contact: email `vscosousa@gmail.com`

> Nota: se a função exigir header de autorização, o monitor pode receber 401.
> Como o keep-alive principal é o cron do GitHub (que envia o header), o
> UptimeRobot serve sobretudo de alerta de indisponibilidade. Em alternativa,
> podemos tornar a função `health` totalmente pública (já tem `verify_jwt = false`).

---

## 7. Validação final (Definition of Done da F0)

- [ ] `git push` para `main` → workflow **CI** fica verde.
- [ ] Push que toca em `supabase/**` → workflow **Deploy** aplica migração/função.
- [ ] Abrir o **URL da Vercel** → vê-se "Peladinhas ⚽" e **"Ligado ao Supabase ✓"**.
- [ ] Separador **Actions** mostra o **Keep-alive** agendado (dispara manualmente uma vez com "Run workflow" para testar).
- [ ] Correr o **Backup** manualmente uma vez → produz um artefacto descarregável.
- [ ] Passada ~1 semana, o projeto Supabase **não** suspendeu.

Quando estes pontos estiverem verdes, a **F0 está concluída** e podemos avançar para a **F1 — Auth & Perfil**.

---

## Referência rápida de segredos

| Nome | Onde vive | Público? |
|---|---|---|
| `VITE_SUPABASE_URL` | Vercel env + `.env.local` | Sim (vai no bundle) |
| `VITE_SUPABASE_ANON_KEY` | Vercel env + `.env.local` + GH Secret | Sim (protegido por RLS) |
| `SUPABASE_ACCESS_TOKEN` | GitHub Secrets | **Não** |
| `SUPABASE_DB_PASSWORD` | GitHub Secrets | **Não** |
| `SUPABASE_PROJECT_REF` | GitHub Secrets | Não sensível, mas mantém em secret |
| `service_role` key | (não usar na F0) | **Nunca no frontend** |
