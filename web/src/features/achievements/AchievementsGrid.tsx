import { useAchievements, usePlayerAchievements } from './achievementHooks';

interface AchievementsGridProps {
  playerId: string;
  /** Perfil próprio: permite escolher a conquista destacada. */
  editable?: boolean;
  featuredId?: number | null;
  onSelect?: (id: number | null) => void;
}

export function AchievementsGrid({ playerId, editable, featuredId, onSelect }: AchievementsGridProps) {
  const { data: achievements } = useAchievements();
  const { data: unlocked } = usePlayerAchievements(playerId);

  if (!achievements) return null;

  const unlockedCount = achievements.filter((a) => unlocked?.has(a.id)).length;

  return (
    <section>
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-bold uppercase tracking-wide text-slate-400">Conquistas</h2>
        <span className="rounded-full bg-white/[0.06] px-2.5 py-0.5 text-xs font-semibold tabular-nums text-slate-400">
          {unlockedCount}/{achievements.length}
        </span>
      </div>
      {editable && (
        <p className="mb-2 text-xs text-slate-500">
          Toca numa conquista desbloqueada para a destacares no cartão.
        </p>
      )}

      <div className="flex flex-wrap gap-2">
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
              className={`flex h-14 w-14 items-center justify-center rounded-xl border text-2xl transition ${
                isFeatured
                  ? 'border-pitch-500 bg-pitch-500/15 shadow-glow'
                  : isUnlocked
                    ? 'border-white/[0.08] bg-white/[0.04]'
                    : 'border-white/[0.05] bg-white/[0.01] opacity-40 grayscale'
              } ${clickable ? 'cursor-pointer hover:border-pitch-500/50' : 'cursor-default'}`}
            >
              <span aria-hidden>{a.icon}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
