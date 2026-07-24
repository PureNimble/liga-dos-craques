import { Link } from 'react-router-dom';
import { AlertIcon, BallIcon, ShieldIcon, UserIcon, UsersIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import { useHealthCheck } from '@/features/health/hooks/healthHooks';
import { useOnlineCount } from '@/features/health/hooks/useOnlineCount';
import { useOpenBugReportCount } from '@/features/feedback/hooks/feedbackHooks';
import {
  useAdminMetrics,
  useAdminTrends,
  useGamesByFormat,
  useGamesByWeekday,
  useGoalsByMonth,
} from '../hooks/adminHooks';
import { TrendAreaChart } from '../components/charts/TrendAreaChart';
import { CategoryDonut } from '../components/charts/CategoryDonut';
import { CategoryBar } from '../components/charts/CategoryBar';
import { SERIES } from '../lib/chartTheme';
import s from './AdminDashboard.module.css';

/** Admin dashboard index: hero metrics, activity trend, and games breakdown. */
export function AdminDashboard() {
  const { t } = useT();
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
  const serverLabel = {
    loading: t('admin.dashboard.server.connecting'),
    ok: t('admin.dashboard.server.online'),
    error: t('admin.dashboard.server.offline'),
  }[serverState];
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
            {t('admin.dashboard.onlineUsers')}
          </span>
        </div>
        <div className={`${s.heroTile} ${serverClass}`} role="status">
          <ShieldIcon width={22} height={22} className={s.heroIcon} />
          <span className={`${s.heroValue} ${s.heroText}`}>{serverLabel}</span>
          <span className={s.heroLabel}>{t('admin.dashboard.server')}</span>
        </div>
        <div className={s.metric}>
          <span className={s.metricIcon}>
            <UserIcon width={18} height={18} />
          </span>
          <span className={s.metricValue}>{val(metrics?.players)}</span>
          <span className={s.metricLabel}>{t('admin.dashboard.metric.players')}</span>
        </div>
        <div className={s.metric}>
          <span className={s.metricIcon}>
            <BallIcon width={18} height={18} />
          </span>
          <span className={s.metricValue}>{val(metrics?.games)}</span>
          <span className={s.metricLabel}>{t('admin.dashboard.metric.games')}</span>
        </div>
        <Link to="reports" className={`${s.metric} ${openReports ? s.metricAlert : ''}`}>
          <span className={s.metricIcon}>
            <AlertIcon width={18} height={18} />
          </span>
          <span className={s.metricValue}>{openReports ?? '—'}</span>
          <span className={s.metricLabel}>{t('admin.dashboard.metric.openReports')}</span>
        </Link>
      </section>

      <section className={s.card}>
        <div className={s.cardHead}>
          <h2 className={s.cardTitle}>{t('admin.dashboard.activity')}</h2>
          <span className={s.cardMeta}>{t('admin.dashboard.last12Months')}</span>
        </div>
        <TrendAreaChart
          data={trendData}
          series={[
            { key: 'players', name: t('admin.dashboard.series.newPlayers'), color: SERIES.players },
            { key: 'games', name: t('admin.dashboard.series.games'), color: SERIES.games },
            { key: 'goals', name: t('admin.dashboard.series.goals'), color: SERIES.goals },
          ]}
          empty={t('admin.dashboard.noData')}
        />
      </section>

      <section className={s.chartsRow}>
        <div className={s.card}>
          <div className={s.cardHead}>
            <h2 className={s.cardTitle}>{t('admin.dashboard.gamesByFormat')}</h2>
          </div>
          <CategoryDonut data={byFormat ?? []} empty={t('admin.dashboard.noGames')} />
        </div>
        <div className={s.card}>
          <div className={s.cardHead}>
            <h2 className={s.cardTitle}>{t('admin.dashboard.gamesByWeekday')}</h2>
          </div>
          <CategoryBar
            data={byWeekday ?? []}
            color={SERIES.games}
            empty={t('admin.dashboard.noData')}
          />
        </div>
      </section>
    </>
  );
}
