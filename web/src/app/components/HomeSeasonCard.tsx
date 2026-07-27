import { usePlayerXpSuspense } from '@/features/xp/hooks/xpHooks';
import { useT } from '@/shared/i18n/useT';
import s from './HomeSeasonCard.module.css';

/** Season level/XP progress card. */
export function HomeSeasonCard({ playerId }: { playerId: string }) {
  const { t } = useT();
  const { data: xp } = usePlayerXpSuspense(playerId);

  const atMax = xp.next_level_xp === null;
  const span = atMax ? 1 : xp.next_level_xp! - xp.level_min_xp;
  const gained = xp.total_xp - xp.level_min_xp;
  const pct = atMax ? 100 : Math.max(0, Math.min(100, Math.round((gained / span) * 100)));
  const toNext = atMax ? 0 : xp.next_level_xp! - xp.total_xp;

  return (
    <div className={s.season}>
      <div className={s.seasonHead}>
        <span className={s.seasonLevelLabel}>
          {t('home.season.levelLabel')} {xp.level}
        </span>
        <span className={s.seasonLevelXp}>
          {atMax
            ? t('xp.total', { value: xp.total_xp })
            : t('xp.progress', { total: xp.total_xp, next: xp.next_level_xp! })}
        </span>
      </div>
      <div className={s.seasonTrack}>
        <div className={s.seasonFill} style={{ width: `${pct}%` }} />
      </div>
      <p className={s.seasonFoot}>
        {atMax ? t('xp.maxLevel') : t('xp.toNext', { amount: toNext, level: xp.level + 1 })}
      </p>
    </div>
  );
}
