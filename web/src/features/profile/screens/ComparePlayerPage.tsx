import { useNavigate, useParams } from 'react-router-dom';
import { Alert, Avatar, Loading } from '@/shared/components/ui';
import { ChevronLeftIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import { useProfile, usePublicProfile } from '../hooks/profileHooks';
import { usePlayerStats, type PlayerStats } from '@/features/stats/hooks/statsHooks';
import s from './ComparePlayerPage.module.css';

interface Metric {
  label: string;
  value: (stats: PlayerStats) => number;
  format?: (n: number) => string;
}

/** Head-to-head comparison between the current user and another player. */
export function ComparePlayerPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: me, isLoading: meLoading } = useProfile();
  const { data: meStats, isLoading: meStatsLoading } = usePlayerStats(me?.id);
  const { data: other, isLoading: otherLoading } = usePublicProfile(id);
  const { data: otherStats, isLoading: otherStatsLoading } = usePlayerStats(id);

  if (meLoading || meStatsLoading || otherLoading || otherStatsLoading) return <Loading />;
  if (!me || !meStats || !other || !otherStats) {
    return (
      <div className={s.errorPage}>
        <Alert kind="error">{t('profile.detail.notFound')}</Alert>
      </div>
    );
  }

  const metrics: Metric[] = [
    {
      label: t('profile.header.avgRating'),
      value: (st) => st.avg_rating ?? 0,
      format: (n) => n.toFixed(1),
    },
    { label: t('stats.games'), value: (st) => st.games },
    { label: t('stats.goals'), value: (st) => st.goals },
    { label: t('stats.assists'), value: (st) => st.assists },
    { label: t('stats.mvps'), value: (st) => st.mvps },
    { label: t('stats.saves'), value: (st) => st.saves },
    {
      label: t('stats.winRate'),
      value: (st) => (st.games > 0 ? Math.round((st.wins / st.games) * 100) : 0),
      format: (n) => `${n}%`,
    },
  ];

  return (
    <div className={s.page}>
      <button type="button" onClick={() => navigate(-1)} className={s.back}>
        <ChevronLeftIcon width={16} height={16} /> {t('profile.detail.back')}
      </button>

      <div className={s.header}>
        <div className={s.player}>
          <Avatar name={me.name} src={me.photo_url} size="lg" />
          <span className={s.name}>{me.name}</span>
        </div>
        <span className={s.vs}>{t('profile.compare.vs')}</span>
        <div className={s.player}>
          <Avatar name={other.name} src={other.photo_url} size="lg" />
          <span className={s.name}>{other.name}</span>
        </div>
      </div>

      <div className={s.rows}>
        {metrics.map((m) => {
          const meVal = m.value(meStats);
          const otherVal = m.value(otherStats);
          const total = meVal + otherVal;
          const mePct = total > 0 ? (meVal / total) * 100 : 50;
          return (
            <div key={m.label} className={s.row}>
              <span className={`${s.value} ${meVal >= otherVal ? s.valueLead : ''}`}>
                {m.format ? m.format(meVal) : meVal}
              </span>
              <div className={s.barTrack}>
                <div className={s.barMe} style={{ width: `${mePct}%` }} />
                <div className={s.barOther} style={{ width: `${100 - mePct}%` }} />
              </div>
              <span className={`${s.value} ${otherVal >= meVal ? s.valueLead : ''}`}>
                {m.format ? m.format(otherVal) : otherVal}
              </span>
              <span className={s.label}>{m.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
