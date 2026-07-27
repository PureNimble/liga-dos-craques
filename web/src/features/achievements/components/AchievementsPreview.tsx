import { Card } from '@/shared/components/ui';
import { NamedIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import { useAchievements, usePlayerAchievements } from '../hooks/achievementHooks';
import s from './AchievementsPreview.module.css';

interface AchievementsPreviewProps {
  playerId: string;
  limit?: number;
  onViewAll: () => void;
}

/** Compact row of a player's unlocked achievement badges, with a link to the full grid. */
export function AchievementsPreview({ playerId, limit = 5, onViewAll }: AchievementsPreviewProps) {
  const { t, lang } = useT();
  const { data: achievements } = useAchievements();
  const { data: unlocked } = usePlayerAchievements(playerId);

  if (!achievements) return null;
  const unlockedList = achievements.filter((a) => unlocked?.has(a.id)).slice(0, limit);

  return (
    <Card>
      <div className={s.head}>
        <h2 className={s.title}>{t('achievements.title')}</h2>
        <button type="button" onClick={onViewAll} className={s.viewAll}>
          {t('profile.viewAll')}
        </button>
      </div>

      {unlockedList.length === 0 ? (
        <p className={s.empty}>{t('achievements.locked')}</p>
      ) : (
        <div className={s.row}>
          {unlockedList.map((a) => (
            <div key={a.id} className={s.badge}>
              <span className={s.icon} aria-hidden>
                {a.image_url ? (
                  <img className={s.photo} src={a.image_url} alt="" />
                ) : (
                  <NamedIcon name={a.icon} width={20} height={20} />
                )}
              </span>
              <span className={s.label}>{lang === 'en' ? (a.label_en ?? a.label) : a.label}</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
