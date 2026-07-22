import { Link } from 'react-router-dom';
import { AlertIcon, BallIcon, ShieldIcon, UserIcon, UsersIcon } from '@/shared/components/ui/icons';
import { useHealthCheck } from '@/features/health/healthHooks';
import { useOnlineCount } from '@/features/health/useOnlineCount';
import { useOpenBugReportCount } from '@/features/feedback/feedbackHooks';
import {
  useAdminMetrics,
  useAdminTrends,
  useGamesByFormat,
  useGamesByWeekday,
  useGoalsByMonth,
} from './adminHooks';
import { TrendAreaChart } from './charts/TrendAreaChart';
import { CategoryDonut } from './charts/CategoryDonut';
import { CategoryBar } from './charts/CategoryBar';
import { SERIES } from './charts/chartTheme';
import s from './AdminDashboard.module.css';

export function AdminDashboard() {
  const { data: metrics, isLoading } = useAdminMetrics();
  const { data: openReports } = useOpenBugReportCount();
  const { data: trends } = useAdminTrends(12);
  const { data: goalsMonthly } = useGoalsByMonth(12);
  const { data: byFormat } = useGamesByFormat();
  const { data: byWeekday } = useGamesByWeekday();
  const online = useOnlineCount();
  const health = useHealthCheck();

  const val = (n: number | undefined) => (isLoading ? '—' : (n ?? 0).toLocaleString('pt-PT'));

  const serverOk = !health.isError && health.data?.status === 'ok';
  const serverState = health.isLoading ? 'loading' : serverOk ? 'ok' : 'error';
  const serverLabel = { loading: 'A ligar…', ok: 'Online', error: 'Offline' }[serverState];
  const serverClass = serverState === 'error' ? s.down : s.teal;

  const trendData = (trends?.players ?? []).map((p, i) => ({
    label: p.label,
    players: p.count,
    games: trends?.games[i]?.count ?? 0,
    goals: goalsMonthly?.[i]?.count ?? 0,
  }));

  return (
    <>
      <section className={s.hero}>
        <div className={`${s.heroTile} ${s.emerald}`} role="status">
          <UsersIcon width={22} height={22} className={s.heroIcon} />
          <span className={s.heroValue}>{online}</span>
          <span className={s.heroLabel}>
            <span className={s.liveDot} />
            Utilizadores online
          </span>
        </div>
        <div className={`${s.heroTile} ${serverClass}`} role="status">
          <ShieldIcon width={22} height={22} className={s.heroIcon} />
          <span className={`${s.heroValue} ${s.heroText}`}>{serverLabel}</span>
          <span className={s.heroLabel}>Servidor</span>
        </div>
        <div className={s.metric}>
          <span className={s.metricIcon}>
            <UserIcon width={18} height={18} />
          </span>
          <span className={s.metricValue}>{val(metrics?.players)}</span>
          <span className={s.metricLabel}>Jogadores</span>
        </div>
        <div className={s.metric}>
          <span className={s.metricIcon}>
            <BallIcon width={18} height={18} />
          </span>
          <span className={s.metricValue}>{val(metrics?.games)}</span>
          <span className={s.metricLabel}>Jogos</span>
        </div>
        <Link to="reports" className={`${s.metric} ${openReports ? s.metricAlert : ''}`}>
          <span className={s.metricIcon}>
            <AlertIcon width={18} height={18} />
          </span>
          <span className={s.metricValue}>{openReports ?? '—'}</span>
          <span className={s.metricLabel}>Reportes por resolver</span>
        </Link>
      </section>

      <section className={s.card}>
        <div className={s.cardHead}>
          <h2 className={s.cardTitle}>Atividade</h2>
          <span className={s.cardMeta}>últimos 12 meses</span>
        </div>
        <TrendAreaChart
          data={trendData}
          series={[
            { key: 'players', name: 'Novos jogadores', color: SERIES.players },
            { key: 'games', name: 'Jogos', color: SERIES.games },
            { key: 'goals', name: 'Golos', color: SERIES.goals },
          ]}
        />
      </section>

      <section className={s.chartsRow}>
        <div className={s.card}>
          <div className={s.cardHead}>
            <h2 className={s.cardTitle}>Jogos por formato</h2>
          </div>
          <CategoryDonut data={byFormat ?? []} empty="Sem jogos." />
        </div>
        <div className={s.card}>
          <div className={s.cardHead}>
            <h2 className={s.cardTitle}>Jogos por dia da semana</h2>
          </div>
          <CategoryBar data={byWeekday ?? []} color={SERIES.games} />
        </div>
      </section>
    </>
  );
}
