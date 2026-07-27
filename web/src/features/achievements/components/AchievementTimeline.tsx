import { Card } from '@/shared/components/ui';
import { NamedIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import { formatDate } from '@/shared/lib/datetime';
import { useAchievements, usePlayerAchievements } from '../hooks/achievementHooks';
import s from './AchievementTimeline.module.css';

/** Timeline of a player's unlocked achievements, most recent first. */
export function AchievementTimeline({ playerId }: { playerId: string }) {
  const { t, lang } = useT();
  const { data: achievements } = useAchievements();
  const { data: unlocked } = usePlayerAchievements(playerId);

  if (!achievements) return null;

  const rows = achievements
    .filter((a) => unlocked?.has(a.id))
    .map((a) => ({ achievement: a, unlockedAt: unlocked?.get(a.id) as string }))
    .sort((x, y) => y.unlockedAt.localeCompare(x.unlockedAt));

  return (
    <Card>
      <h2 className={s.title}>{t('profile.tabs.historico')}</h2>
      {rows.length === 0 ? (
        <p className={s.empty}>{t('achievements.locked')}</p>
      ) : (
        <ul className={s.list}>
          {rows.map(({ achievement: a, unlockedAt }) => (
            <li key={a.id} className={s.item}>
              <span className={s.icon} aria-hidden>
                <NamedIcon name={a.icon} width={18} height={18} />
              </span>
              <span className={s.body}>
                <span className={s.label}>{lang === 'en' ? (a.label_en ?? a.label) : a.label}</span>
                <span className={s.date}>{formatDate(unlockedAt)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
