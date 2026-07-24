import { NamedIcon, LockIcon, StarIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import { formatDateShort } from '@/shared/lib/datetime';
import { useAchievements, usePlayerAchievements } from '../hooks/achievementHooks';
import s from './AchievementsGrid.module.css';

interface AchievementsGridProps {
  playerId: string;
  editable?: boolean;
  featuredId?: number | null;
  onSelect?: (id: number | null) => void;
}

/** Grid of achievements: unlocked ones are highlighted, and editable mode lets the owner pick a featured one. */
export function AchievementsGrid({
  playerId,
  editable,
  featuredId,
  onSelect,
}: AchievementsGridProps) {
  const { t, lang } = useT();
  const { data: achievements } = useAchievements();
  const { data: unlocked } = usePlayerAchievements(playerId);

  if (!achievements) return null;

  const unlockedCount = achievements.filter((a) => unlocked?.has(a.id)).length;

  return (
    <section>
      <div className={s.head}>
        <h2 className={s.title}>{t('achievements.title')}</h2>
        <span className={s.count}>
          {unlockedCount}/{achievements.length}
        </span>
      </div>
      {editable && <p className={s.hint}>{t('achievements.hint')}</p>}

      <div className={s.grid}>
        {achievements.map((a) => {
          const isUnlocked = unlocked?.has(a.id) ?? false;
          const unlockedAt = unlocked?.get(a.id);
          const isFeatured = featuredId === a.id;
          const clickable = Boolean(editable && isUnlocked && onSelect);
          const label = lang === 'en' ? (a.label_en ?? a.label) : a.label;
          const description = lang === 'en' ? (a.description_en ?? a.description) : a.description;
          return (
            <button
              key={a.id}
              type="button"
              disabled={!clickable}
              onClick={clickable ? () => onSelect?.(isFeatured ? null : a.id) : undefined}
              className={`${s.card} ${isFeatured ? s.featured : ''} ${
                !isUnlocked ? s.locked : ''
              } ${clickable ? s.clickable : ''}`}
            >
              <span className={s.icon} aria-hidden>
                {a.image_url ? (
                  <img className={s.photo} src={a.image_url} alt="" />
                ) : (
                  <NamedIcon name={a.icon} width={22} height={22} />
                )}
              </span>

              <span className={s.body}>
                <span className={s.labelRow}>
                  <span className={s.label}>{label}</span>
                  {isFeatured && <StarIcon width={13} height={13} className={s.featuredIcon} />}
                </span>
                <span className={s.description}>{description}</span>
                {isUnlocked ? (
                  <span className={s.unlockedAt}>
                    {unlockedAt
                      ? t('achievements.unlockedAt', { date: formatDateShort(unlockedAt) })
                      : t('achievements.unlocked')}
                  </span>
                ) : (
                  <span className={s.lockedTag}>
                    <LockIcon width={11} height={11} /> {t('achievements.locked')}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
