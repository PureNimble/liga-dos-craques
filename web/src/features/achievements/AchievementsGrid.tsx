import { NamedIcon } from '@/shared/components/ui/icons';
import { useAchievements, usePlayerAchievements } from './achievementHooks';
import s from './AchievementsGrid.module.css';

interface AchievementsGridProps {
  playerId: string;
  /** Perfil próprio: permite escolher a conquista destacada. */
  editable?: boolean;
  featuredId?: number | null;
  onSelect?: (id: number | null) => void;
}

export function AchievementsGrid({
  playerId,
  editable,
  featuredId,
  onSelect,
}: AchievementsGridProps) {
  const { data: achievements } = useAchievements();
  const { data: unlocked } = usePlayerAchievements(playerId);

  if (!achievements) return null;

  const unlockedCount = achievements.filter((a) => unlocked?.has(a.id)).length;

  return (
    <section>
      <div className={s.head}>
        <h2 className={s.title}>Conquistas</h2>
        <span className={s.count}>
          {unlockedCount}/{achievements.length}
        </span>
      </div>
      {editable && (
        <p className={s.hint}>Toca numa conquista desbloqueada para a destacares no cartão.</p>
      )}

      <div className={s.grid}>
        {achievements.map((a) => {
          const isUnlocked = unlocked?.has(a.id) ?? false;
          const isFeatured = featuredId === a.id;
          const clickable = Boolean(editable && isUnlocked && onSelect);
          return (
            <button
              key={a.id}
              type="button"
              onClick={clickable ? () => onSelect?.(isFeatured ? null : a.id) : undefined}
              title={`${a.label} — ${a.description}`}
              className={`${s.item} ${isFeatured ? s.featured : ''} ${
                !isFeatured && !isUnlocked ? s.locked : ''
              } ${clickable ? s.clickable : ''}`}
            >
              {a.image_url ? (
                <img className={s.photo} src={a.image_url} alt="" aria-hidden />
              ) : (
                <NamedIcon name={a.icon} width={26} height={26} aria-hidden />
              )}
            </button>
          );
        })}
      </div>
    </section>
  );
}
