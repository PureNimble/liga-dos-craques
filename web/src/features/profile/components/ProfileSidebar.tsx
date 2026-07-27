import { Card } from '@/shared/components/ui';
import { UserIcon, ChartIcon, ClockIcon, TrophyIcon, BallIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import type { PlayerXp } from '@/features/xp/hooks/xpHooks';
import type { PlayerStats } from '@/features/stats/hooks/statsHooks';
import { StatsGrid } from '@/features/stats/components/StatsGrid';
import { ComparePlayerCard } from './ComparePlayerCard';
import s from './ProfileSidebar.module.css';

export type ProfileTab = 'perfil' | 'estatisticas' | 'historico' | 'conquistas' | 'jogos';

const TABS: { id: ProfileTab; labelKey: string; Icon: typeof UserIcon }[] = [
  { id: 'perfil', labelKey: 'profile.tabs.perfil', Icon: UserIcon },
  { id: 'estatisticas', labelKey: 'profile.tabs.estatisticas', Icon: ChartIcon },
  { id: 'historico', labelKey: 'profile.tabs.historico', Icon: ClockIcon },
  { id: 'conquistas', labelKey: 'profile.tabs.conquistas', Icon: TrophyIcon },
  { id: 'jogos', labelKey: 'profile.tabs.jogos', Icon: BallIcon },
];

interface ProfileSidebarProps {
  active: ProfileTab;
  onChange: (tab: ProfileTab) => void;
  xp?: PlayerXp | null;
  stats?: PlayerStats | null;
  excludeId?: string;
}

/** Left sidebar for the profile page: section nav, XP progress, season snapshot and player compare. */
export function ProfileSidebar({ active, onChange, xp, stats, excludeId }: ProfileSidebarProps) {
  const { t } = useT();
  const pct = xpProgress(xp);

  return (
    <div className={s.sidebar}>
      <Card padded={false} className={s.nav}>
        {TABS.map(({ id, labelKey, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            className={`${s.navItem} ${active === id ? s.navItemActive : ''}`}
          >
            <Icon width={16} height={16} />
            {t(labelKey)}
          </button>
        ))}
      </Card>

      {xp && (
        <Card>
          <div className={s.xpHead}>
            <span className={s.xpLevel}>{t('profile.hero.level', { level: xp.level })}</span>
            <span className={s.xpTotal}>{xp.total_xp} XP</span>
          </div>
          <div className={s.xpTrack}>
            <div className={s.xpFill} style={{ width: `${pct}%` }} />
          </div>
          <p className={s.xpRemaining}>
            {xp.next_level_xp != null
              ? t('profile.hero.xpToNext', { count: xp.next_level_xp - xp.total_xp })
              : t('profile.hero.maxLevel')}
          </p>
        </Card>
      )}

      {stats && (
        <Card>
          <h2 className={s.title}>{t('profile.season.title')}</h2>
          <StatsGrid stats={stats} compact />
        </Card>
      )}

      <ComparePlayerCard excludeId={excludeId} />
    </div>
  );
}

/** Progress (0-100) toward the next level; with no XP loaded, the bar stays empty. */
function xpProgress(xp: PlayerXp | null | undefined) {
  if (!xp) return 0;
  if (xp.next_level_xp === null) return 100;
  const span = xp.next_level_xp - xp.level_min_xp;
  const gained = xp.total_xp - xp.level_min_xp;
  return Math.max(0, Math.min(100, Math.round((gained / span) * 100)));
}
