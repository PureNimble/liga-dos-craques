import { LockOverlay } from '@/shared/components/ui';
import { useT } from '@/shared/i18n/useT';
import { ratingText } from '@/features/stats/lib/ratingColor';
import {
  MIN_GAMES_FOR_STATS,
  statsLockMessage,
  type PlayerStats,
} from '@/features/stats/hooks/statsHooks';
import s from './PlayerHeader.module.css';

const MOCK_STATS: PlayerStats = {
  player_id: '',
  group_id: '',
  name: '',
  games: 14,
  wins: 10,
  draws: 2,
  losses: 2,
  goals: 21,
  assists: 11,
  saves: 0,
  mvps: 7,
  flops: 0,
  avg_rating: 8.2,
  strength_delta: null,
};

interface PlayerHeaderProps {
  stats?: PlayerStats | null;
  own?: boolean;
}

/** Season-average panel: big rating plus a season stat grid (SofaScore-style). */
export function PlayerHeader({ stats, own = false }: PlayerHeaderProps) {
  const { t } = useT();
  const locked = stats == null || stats.avg_rating == null || stats.games < MIN_GAMES_FOR_STATS;
  const shown = locked ? MOCK_STATS : stats;
  const perGame = shown.games > 0 ? (shown.goals / shown.games).toFixed(2) : '0';
  const winRate = shown.games > 0 ? Math.round((shown.wins / shown.games) * 100) : 0;

  const card = (
    <div className={s.card}>
      <div className={s.row}>
        <div className={s.rating}>
          <span className={`${s.ratingValue} ${ratingText(shown.avg_rating)}`}>
            {(shown.avg_rating ?? 0).toFixed(1)}
          </span>
          <span className={s.ratingLabel}>{t('profile.header.avgRating')}</span>
        </div>

        <div className={s.divider} />

        <div className={s.grid}>
          <Stat label={t('stats.games')} value={shown.games} />
          <Stat label={t('stats.goals')} value={shown.goals} accent />
          <Stat label={t('stats.assists')} value={shown.assists} />
          <Stat label={t('stats.mvps')} value={shown.mvps} accent />
          <Stat label={t('profile.header.goalsPerGame')} value={perGame} />
          <Stat label={t('stats.winRate')} value={`${winRate}%`} accent />
        </div>
      </div>
    </div>
  );

  if (locked) {
    return (
      <LockOverlay locked className={s.lockWrap} message={statsLockMessage(t, own)}>
        {card}
      </LockOverlay>
    );
  }
  return card;
}

function Stat({ label, value, accent }: { label: string; value: number | string; accent?: boolean }) {
  return (
    <div className={s.stat}>
      <span className={`${s.statValue} ${accent ? s.statValueAccent : ''}`}>{value}</span>
      <span className={s.statLabel}>{label}</span>
    </div>
  );
}
