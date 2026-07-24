import { useT } from '@/shared/i18n/useT';
import type { PlayerXp } from '../hooks/xpHooks';
import s from './XpBar.module.css';

/** Level/XP bar showing progress towards the next level. */
export function XpBar({ xp }: { xp: PlayerXp }) {
  const { t } = useT();
  const atMax = xp.next_level_xp === null;
  const span = atMax ? 1 : xp.next_level_xp! - xp.level_min_xp;
  const gained = xp.total_xp - xp.level_min_xp;
  const pct = atMax ? 100 : Math.max(0, Math.min(100, Math.round((gained / span) * 100)));
  const toNext = atMax ? 0 : xp.next_level_xp! - xp.total_xp;

  return (
    <div className={s.card}>
      <div className={s.head}>
        <span className={s.level}>
          <span className={s.levelBadge}>{xp.level}</span>
          {t('xp.level', { level: xp.level })}
        </span>
        <span className={s.total}>{t('xp.total', { value: xp.total_xp })}</span>
      </div>

      <div className={s.track}>
        <div className={s.fill} style={{ width: `${pct}%` }} />
      </div>

      <p className={s.foot}>
        {atMax ? t('xp.maxLevel') : t('xp.toNext', { amount: toNext, level: xp.level + 1 })}
      </p>
    </div>
  );
}
