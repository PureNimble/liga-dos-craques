import { useAchievements, usePlayerAchievements } from '@/features/achievements/hooks/achievementHooks';
import { useT } from '@/shared/i18n/useT';
import panel from './homePanel.module.css';
import s from './HomeAchievementsProgress.module.css';

/** Home dashboard card: how many achievements the player has unlocked (active group) out of the total available. */
export function HomeAchievementsProgress({ playerId }: { playerId: string }) {
  const { t } = useT();
  const { data: achievements } = useAchievements();
  const { data: unlocked } = usePlayerAchievements(playerId);

  const total = achievements?.length ?? 0;
  const count = unlocked?.size ?? 0;
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div className={s.card}>
      <div className={panel.panelHead}>
        <h2 className={panel.panelTitle}>{t('home.achievements.title')}</h2>
      </div>
      <div className={s.progressBody}>
        <p className={s.progressFoot}>
          <span className={s.progressCount}>{t('home.achievements.count', { count, max: total })}</span>{' '}
          <span className={s.progressLabel}>{t('home.achievements.label')}</span>
        </p>
        <div className={s.progressTrack}>
          <div className={s.progressFill} style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
