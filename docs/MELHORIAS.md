# Peladinhas — Plano de Melhorias (pós-roadmap F0–F11)

> A base está completa e funcional. Este documento organiza o que fazer a seguir,
> por prioridade, impacto e esforço. Escala: 🟢 baixo · 🟡 médio · 🔴 alto.

## Contexto que motiva as prioridades

O bug recente ("eventos não apareciam") é revelador: a query **compilava** (typecheck ✓)
mas **falhava em runtime** (embed ambíguo do PostgREST). A app tem quase nenhuma
cobertura de testes da camada de dados. **A melhoria de maior valor é fechar essa
lacuna** — evita que bugs assim cheguem a produção.

---

## P0 — Robustez e correção (fazer primeiro)

### P0.1 — Harness de testes de integração da BD 🔴
- **Problema:** queries e políticas RLS só são exercitadas manualmente; um erro de
  relação/coluna passa o typecheck e rebenta em produção.
- **Proposta:** `supabase start` local + testes que correm as queries reais (events,
  votos, rankings, stats) e validam RLS (com utilizadores diferentes). pgTAP para as
  políticas; Vitest + cliente Supabase para as queries.
- **Impacto:** enorme (segurança + correção). **Esforço:** 🔴

### P0.2 — Auditar todos os embeds PostgREST 🟢
- Tabelas com várias FKs para `profile` (`vote`, `challenge_attempt`, `event`) são
  propensas a ambiguidade. Rever todas e adicionar a hint `alias:fk_column(...)`.
- Já corrigido: `event`. Já ok: `challenge_attempt`. **Verificar** `vote` se algum dia
  fizer embed de nomes.

### P0.3 — Backfill de XP e conquistas para o histórico 🟡
- XP/conquistas só se aplicam a jogos fechados **após** a F7/F9. Jogos antigos ficam sem.
- **Proposta:** RPC `backfill()` (admin) que percorre jogos `closed` sem `xp_processed_at`
  e chama `award_game_xp` + `evaluate_game_achievements`. Idempotente.

### P0.4 — Geração automática de tipos da BD em CI 🟡
- Hoje `web/src/types/database.ts` é mantido à mão → risco de divergir do schema.
- **Proposta:** job de CI que corre `supabase gen types` contra o schema das migrações e
  falha se o ficheiro versionado estiver desatualizado.

---

## P1 — Produto e experiência (alto valor)

### P1.1 — Realtime no jogo ao vivo 🟡
- Placar, timeline de eventos e plantel a atualizar sem refresh (Supabase Realtime).
- Ligar só na página de detalhe do jogo para poupar recursos.

### P1.2 — PWA completo + registo de eventos offline 🔴
- Service worker (vite-plugin-pwa) + ícones PNG (192/512) → instalável a 100%.
- **Fila offline** para registar golos/defesas no campo com rede fraca, sincronizando
  quando volta a ligação. É o cenário de uso real (balneário/campo).

### P1.3 — Fluxo de presença / convites 🟡
- `game_player.status` já suporta `invited/confirmed`. Falta o fluxo: organizador convida,
  jogador confirma/desiste; contagem "X/Y confirmados"; lista de espera quando cheio.

### P1.4 — Painel de administração 🟡
- Corrigir resultados; gerir regras de XP (criar nova versão sem editar histórico);
  gerir tipos de evento, tags, conquistas e desafios; promover admins.
- Tudo já é orientado a dados — falta só a UI sobre as tabelas existentes.

### P1.5 — Página de detalhe de jogador 🟢
- Ver perfil/estatísticas/conquistas de outro jogador (hoje só o próprio).
- As vistas já são por `player_id`; falta a rota `/players/:id`.

### P1.6 — Notificações/lembretes 🟡
- Email (ou push) de jogo próximo e de "votação aberta até amanhã". Cron + Edge Function.

---

## P2 — Polimento e escala (quando fizer sentido)

- **UX:** toasts em vez de alerts inline; skeletons de carregamento; empty states com
  ilustração; confirmações mais amigáveis. 🟢
- **Privacidade do perfil:** separar campos sensíveis (`birth_date`, `weight_kg`,
  `height_cm`) para `profile_private` com RLS restrita ao dono (já documentado no README). 🟡
- **Época/temporada:** conceito de "época" para rankings e resets anuais. 🟡
- **Rankings materializados:** quando o histórico crescer, `materialized view` + refresh
  por `pg_cron` para leitura rápida. 🟡
- **Estatística de golos:** decidir se penáltis/livres contam para "Golos" (hoje só `goal`).
  É config de produto; a vista muda numa linha. 🟢
- **Observabilidade:** Sentry (free) para erros de frontend; logs estruturados. 🟢
- **E2E:** Playwright a cobrir o fluxo crítico (criar jogo → eventos → votação → fecho). 🟡
- **Acessibilidade:** foco visível, labels ARIA, contraste — passar um axe audit. 🟢

---

## Sequência recomendada

1. **P0.2** (auditar embeds) + **P0.1** (harness de testes) — travar a classe de bugs
   que acabámos de ver.
2. **P0.3** (backfill) + **P0.4** (tipos em CI) — consistência de dados e manutenção.
3. **P1.1** (realtime) e **P1.3** (presença) — o que mais melhora o uso no dia do jogo.
4. **P1.2** (PWA offline) — resolver o registo de eventos no campo.
5. **P1.4** (admin) — autonomia para gerir o sistema sem SQL manual.
6. **P2** conforme necessidade.

## Nota de dívida técnica conhecida

- `web/src/types/database.ts` mantido à mão (ver P0.4).
- PWA é "lite" (manifest sem service worker) — ver P1.2.
- Sem testes da camada de dados/RLS (ver P0.1) — a maior dívida.
- V/E/D dependem de equipas atribuídas; jogos sem equipas não contam resultado.
