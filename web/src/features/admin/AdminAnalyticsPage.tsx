import { useState } from 'react';
import { CategoryBar } from './charts/CategoryBar';
import { CategoryDonut } from './charts/CategoryDonut';
import { StackedBars } from './charts/StackedBars';
import { TrendAreaChart } from './charts/TrendAreaChart';
import { DONUT_COLORS, SERIES } from './charts/chartTheme';
import { RankedBars } from './RankedBars';
import { UsageHeatmap } from './UsageHeatmap';
import {
  AREAS,
  useBugAnalytics,
  useTrackingAnalytics,
  useUsageAnalytics,
  type AnalyticsMonths,
  type Kpi,
} from './analyticsHooks';
import s from './AdminAnalyticsPage.module.css';

const RANGES: AnalyticsMonths[] = [3, 6, 12];

const int = (n: number) => Math.round(n).toLocaleString('pt-PT');
const dec = (n: number) => n.toLocaleString('pt-PT', { maximumFractionDigits: 1 });

/** Variação face ao período homólogo anterior. */
function Delta({ kpi, invert }: { kpi: Kpi; invert?: boolean }) {
  if (kpi.previous === 0) return <span className={s.deltaFlat}>sem histórico</span>;
  const change = ((kpi.value - kpi.previous) / kpi.previous) * 100;
  if (Math.abs(change) < 1) return <span className={s.deltaFlat}>estável</span>;
  const up = change > 0;
  const good = invert ? !up : up;
  return (
    <span className={good ? s.deltaUp : s.deltaDown}>
      {up ? '▲' : '▼'} {dec(Math.abs(change))}%
    </span>
  );
}

function KpiTile({
  label,
  value,
  kpi,
  hint,
  invert,
}: {
  label: string;
  value: string;
  kpi: Kpi;
  hint: string;
  invert?: boolean;
}) {
  return (
    <div className={s.kpi}>
      <span className={s.kpiLabel}>{label}</span>
      <span className={s.kpiValue}>{value}</span>
      <span className={s.kpiFoot}>
        <Delta kpi={kpi} invert={invert} />
        <span className={s.kpiHint}>{hint}</span>
      </span>
    </div>
  );
}

export function AdminAnalyticsPage() {
  const [months, setMonths] = useState<AnalyticsMonths>(6);
  const { data, isLoading } = useUsageAnalytics(months);
  const { data: bugs } = useBugAnalytics(months);
  const { data: tracking } = useTrackingAnalytics(months);

  const sum = data?.summary;
  const period = `últimos ${months} meses`;
  const areaSeries = AREAS.map((a, i) => ({
    key: a.key,
    name: a.label,
    color: DONUT_COLORS[i % DONUT_COLORS.length],
  }));

  return (
    <>
      <header className={s.head}>
        <p className={s.subtitle}>
          Uso da plataforma nos {period} — quem entra, o que usa e quando. Comparado com os {months}{' '}
          meses anteriores.
        </p>
        <div className={s.range} role="group" aria-label="Período">
          {RANGES.map((r) => (
            <button
              key={r}
              type="button"
              className={r === months ? s.rangeActive : s.rangeButton}
              onClick={() => setMonths(r)}
              aria-pressed={r === months}
            >
              {r}M
            </button>
          ))}
        </div>
      </header>

      {isLoading || !sum || !data ? (
        <p className={s.empty}>A carregar…</p>
      ) : (
        <>
          <section className={s.kpis}>
            <KpiTile
              label="Utilizadores ativos"
              value={int(sum.activeUsers.value)}
              kpi={sum.activeUsers}
              hint={`de ${int(data.totalUsers)} contas`}
            />
            <KpiTile
              label="Taxa de atividade"
              value={`${dec(sum.activityRate.value)}%`}
              kpi={sum.activityRate}
              hint="da base registada"
            />
            <KpiTile
              label="Novos registos"
              value={int(sum.newUsers.value)}
              kpi={sum.newUsers}
              hint={period}
            />
            <KpiTile
              label="Ações"
              value={int(sum.actions.value)}
              kpi={sum.actions}
              hint="interações registadas"
            />
            <KpiTile
              label="Ações por utilizador"
              value={dec(sum.actionsPerUser.value)}
              kpi={sum.actionsPerUser}
              hint="média de quem usou"
            />
            <KpiTile
              label="Contas adormecidas"
              value={int(sum.dormant.value)}
              kpi={sum.dormant}
              hint="sem uso há 30+ dias"
              invert
            />
          </section>

          <section className={s.grid}>
            <article className={`${s.card} ${s.wide}`}>
              <div className={s.cardHead}>
                <h2 className={s.title}>Navegação medida</h2>
                <span className={s.meta}>
                  {int(tracking?.consented ?? 0)} de {int(tracking?.totalUsers ?? 0)} contas
                  autorizaram o tracking
                </span>
              </div>
              {!tracking?.hasData ? (
                <p className={s.empty}>
                  Ainda sem dados de navegação — os cartões seguintes usam as ações registadas na
                  base de dados. Assim que alguém aceitar o tracking no perfil, as visitas aparecem
                  aqui.
                </p>
              ) : (
                <>
                  <div className={s.kpisInline}>
                    <KpiTile
                      label="Visitas"
                      value={int(tracking.pageViews.value)}
                      kpi={tracking.pageViews}
                      hint="páginas vistas"
                    />
                    <KpiTile
                      label="Sessões"
                      value={int(tracking.sessions.value)}
                      kpi={tracking.sessions}
                      hint="separadores abertos"
                    />
                    <KpiTile
                      label="Páginas por sessão"
                      value={dec(tracking.viewsPerSession.value)}
                      kpi={tracking.viewsPerSession}
                      hint="profundidade da visita"
                    />
                    <KpiTile
                      label="Visitantes"
                      value={int(tracking.visitors.value)}
                      kpi={tracking.visitors}
                      hint="com tracking ativo"
                    />
                  </div>
                  <CategoryBar data={tracking.byMonth} color={SERIES.players} height={200} />
                </>
              )}
            </article>

            {tracking?.hasData && (
              <>
                <article className={`${s.card} ${s.wide}`}>
                  <div className={s.cardHead}>
                    <h2 className={s.title}>Páginas mais vistas</h2>
                    <span className={s.meta}>visitas · alcance</span>
                  </div>
                  <RankedBars
                    items={tracking.topPages.map((p) => ({
                      id: p.label,
                      label: p.label,
                      count: p.count,
                      caption: `${dec(p.share)}% da base`,
                    }))}
                    empty="Sem visitas no período."
                    color={SERIES.players}
                    showShare={false}
                  />
                </article>

                {/* Sem outro cartão do mesmo tipo nesta secção condicional para
                    emparelhar (lista vs. donut tinham alturas muito diferentes) —
                    fica cada um a ocupar a linha toda em vez de forçar o par. */}
                <article className={`${s.card} ${s.wide}`}>
                  <div className={s.cardHead}>
                    <h2 className={s.title}>Por onde entram</h2>
                    <span className={s.meta}>primeira página da sessão</span>
                  </div>
                  <RankedBars
                    items={tracking.entryPages.map((p) => ({ id: p.label, ...p }))}
                    empty="Ainda sem sessões registadas — aparecem no primeiro separador aberto com tracking ativo."
                    color={SERIES.games}
                  />
                </article>

                <article className={`${s.card} ${s.wide}`}>
                  <div className={s.cardHead}>
                    <h2 className={s.title}>Dispositivos</h2>
                    <span className={s.meta}>por largura de ecrã</span>
                  </div>
                  <CategoryDonut
                    data={tracking.devices}
                    empty="Ainda sem sessões registadas — o dispositivo é lido no arranque da sessão."
                  />
                </article>

                <article className={`${s.card} ${s.wide}`}>
                  <div className={s.cardHead}>
                    <h2 className={s.title}>Quando visitam</h2>
                    <span className={s.meta}>visitas por dia da semana e faixa horária</span>
                  </div>
                  <UsageHeatmap rows={tracking.heatmap} unit="visitas" />
                </article>
              </>
            )}

            <article className={`${s.card} ${s.wide}`}>
              <div className={s.cardHead}>
                <h2 className={s.title}>Quem usa a app, mês a mês</h2>
                <span className={s.meta}>utilizadores distintos vs. novos registos</span>
              </div>
              <TrendAreaChart
                data={data.monthlyUsers.map((m) => ({
                  label: m.label,
                  activeUsers: m.activeUsers,
                  newUsers: m.newUsers,
                }))}
                series={[
                  { key: 'activeUsers', name: 'Utilizadores ativos', color: SERIES.players },
                  { key: 'newUsers', name: 'Novos registos', color: SERIES.games },
                ]}
              />
            </article>

            <article className={`${s.card} ${s.wide}`}>
              <div className={s.cardHead}>
                <h2 className={s.title}>Onde passam o tempo</h2>
                <span className={s.meta}>ações por área da app, por mês</span>
              </div>
              <StackedBars data={data.monthlyActions} series={areaSeries} />
            </article>

            {/* Par: dois donuts, mesma altura por omissão — alinham sem sobrar
                espaço morto num dos dois. */}
            <article className={s.card}>
              <div className={s.cardHead}>
                <h2 className={s.title}>Peso de cada área</h2>
                <span className={s.meta}>repartição das ações</span>
              </div>
              <CategoryDonut data={data.areaActions} empty="Sem ações no período." />
            </article>

            <article className={s.card}>
              <div className={s.cardHead}>
                <h2 className={s.title}>Estado das contas</h2>
                <span className={s.meta}>{int(data.totalUsers)} contas</span>
              </div>
              <CategoryDonut data={data.accountMix} empty="Ainda sem contas." />
            </article>

            <article className={`${s.card} ${s.wide}`}>
              <div className={s.cardHead}>
                <h2 className={s.title}>Quando usam a app</h2>
                <span className={s.meta}>ações por dia da semana e faixa horária</span>
              </div>
              <UsageHeatmap rows={data.heatmap} unit="ações" />
            </article>

            {/* Par: os dois gráficos vêm com a mesma altura (200px) e sem
                legenda — encaixam sem esticar. */}
            <article className={s.card}>
              <div className={s.cardHead}>
                <h2 className={s.title}>Retenção mensal</h2>
                <span className={s.meta}>% da base que usou a app</span>
              </div>
              <TrendAreaChart
                data={data.monthlyUsers.map((m) => ({ label: m.label, activeRate: m.activeRate }))}
                series={[{ key: 'activeRate', name: '% ativos', color: SERIES.xp }]}
                height={200}
                legend={false}
              />
            </article>

            <article className={s.card}>
              <div className={s.cardHead}>
                <h2 className={s.title}>Reportes de bugs</h2>
                <span className={s.meta}>
                  {int(bugs?.total ?? 0)} no período · {int(bugs?.open ?? 0)} por resolver
                </span>
              </div>
              <CategoryBar data={bugs?.byMonth ?? []} color={SERIES.challenges} height={200} />
            </article>

            {/* Par: duas listas de magnitude semelhante (6 áreas vs. até 8
                utilizadores) — número de linhas comparável, sem gaveta vazia. */}
            <article className={s.card}>
              <div className={s.cardHead}>
                <h2 className={s.title}>Alcance das funcionalidades</h2>
                <span className={s.meta}>utilizadores distintos</span>
              </div>
              <RankedBars
                items={data.areaReach.map((r) => ({
                  id: r.label,
                  label: r.label,
                  count: r.count,
                  caption: `${dec(r.share)}% da base`,
                }))}
                empty="Sem uso no período."
                color={SERIES.players}
                showShare={false}
              />
            </article>

            <article className={s.card}>
              <div className={s.cardHead}>
                <h2 className={s.title}>Quem sustenta a app</h2>
                <span className={s.meta}>ações no período</span>
              </div>
              <RankedBars
                items={data.topUsers.map((u) => ({ id: u.id, label: u.name, count: u.count }))}
                empty="Sem atividade no período."
                color={SERIES.games}
              />
            </article>

            <article className={`${s.card} ${s.wide}`}>
              <div className={s.cardHead}>
                <h2 className={s.title}>Páginas que dão problemas</h2>
                <span className={s.meta}>{int(bugs?.reporters ?? 0)} pessoas reportaram</span>
              </div>
              <RankedBars
                items={(bugs?.byPage ?? []).map((p) => ({ id: p.label, ...p }))}
                empty="Sem reportes no período."
                color={SERIES.challenges}
              />
            </article>
          </section>
        </>
      )}
    </>
  );
}
