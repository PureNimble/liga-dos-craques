import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Loading } from '@/shared/components/ui';
import { ChevronLeftIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import { usePlayerStats } from '@/features/stats/hooks/statsHooks';
import { StatsGrid } from '@/features/stats/components/StatsGrid';
import { PlayerCharts } from '@/features/stats/components/PlayerCharts';
import { RecentMatches } from '@/features/stats/components/RecentMatches';
import { usePlayerXp } from '@/features/xp/hooks/xpHooks';
import { XpBar } from '@/features/xp/components/XpBar';
import { AchievementsGrid } from '@/features/achievements/components/AchievementsGrid';
import { useAchievements } from '@/features/achievements/hooks/achievementHooks';
import { usePublicProfile } from '../hooks/profileHooks';
import { PlayerCard } from '../components/PlayerCard';
import { PlayerHeader } from '../components/PlayerHeader';
import { cardAttributes, overallOf, positionShort } from '../lib/cardStats';
import { FOOT_LABEL_KEY } from '../schemas/profile.schemas';
import s from './profileLayout.module.css';

/** Public profile page for any player: card, stats, XP, achievements and recent matches. */
export function PlayerDetailPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: profile, isLoading, isError } = usePublicProfile(id);

  const goBack = () => (location.key === 'default' ? navigate('/rankings') : navigate(-1));
  const { data: xp } = usePlayerXp(id);
  const { data: stats } = usePlayerStats(id);
  const { data: achievements } = useAchievements();

  if (isLoading) return <Loading />;
  if (isError || !profile) {
    return (
      <div className={s.errorPage}>
        <Alert kind="error">{t('profile.detail.notFound')}</Alert>
      </div>
    );
  }

  const category = profile.main_position?.category ?? null;
  const subtitle = [profile.main_position?.label, profile.locality].filter(Boolean).join(' · ');
  const featured = achievements?.find((a) => a.id === profile.featured_achievement_id) ?? null;

  return (
    <div className={s.page}>
      <button type="button" onClick={goBack} className={s.back}>
        <ChevronLeftIcon width={16} height={16} /> {t('profile.detail.back')}
      </button>

      <div className={s.hero}>
        {stats && (
          <div className={s.cardCol}>
            <PlayerCard
              name={profile.name}
              photoUrl={profile.photo_url}
              overall={overallOf(stats, category)}
              position={positionShort(category)}
              attributes={cardAttributes(stats)}
              subtitle={subtitle || null}
            />
          </div>
        )}
        <PlayerHeader
          footLabel={
            profile.preferred_foot ? t(FOOT_LABEL_KEY[profile.preferred_foot]) : null
          }
          avgRating={stats?.avg_rating ?? null}
          games={stats?.games}
          featured={featured ? { icon: featured.icon, label: featured.label } : null}
        />
      </div>

      {xp && <XpBar xp={xp} />}
      {stats && (
        <section>
          <h2 className={s.sectionTitle}>{t('profile.statsTitle')}</h2>
          <StatsGrid stats={stats} />
        </section>
      )}

      <div className={s.grid2}>
        <RecentMatches playerId={profile.id} games={stats?.games ?? 0} />
        <PlayerCharts playerId={profile.id} games={stats?.games ?? 0} />
      </div>

      <AchievementsGrid playerId={profile.id} featuredId={profile.featured_achievement_id} />
    </div>
  );
}
