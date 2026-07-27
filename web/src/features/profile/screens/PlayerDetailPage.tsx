import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Alert, Loading } from '@/shared/components/ui';
import { ChevronLeftIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import { usePlayerStats } from '@/features/stats/hooks/statsHooks';
import { StatsGrid } from '@/features/stats/components/StatsGrid';
import {
  FormTrendCard,
  ContributionsCard,
  XpSourceCard,
} from '@/features/stats/components/PlayerCharts';
import { RecentMatches } from '@/features/stats/components/RecentMatches';
import { AchievementsGrid } from '@/features/achievements/components/AchievementsGrid';
import { usePublicProfile } from '../hooks/profileHooks';
import { ProfileHero } from '../components/ProfileHero';
import { PlayerHeader } from '../components/PlayerHeader';
import { POSITION_LABEL_KEY } from '../schemas/profile.schemas';
import s from './profileLayout.module.css';

/** Public profile page for any player: hero, stats, XP, achievements and recent matches. */
export function PlayerDetailPage() {
  const { t } = useT();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { data: profile, isLoading, isError } = usePublicProfile(id);

  const goBack = () => (location.key === 'default' ? navigate('/rankings') : navigate(-1));
  const { data: stats } = usePlayerStats(id);

  if (isLoading) return <Loading />;
  if (isError || !profile) {
    return (
      <div className={s.errorPage}>
        <Alert kind="error">{t('profile.detail.notFound')}</Alert>
      </div>
    );
  }

  return (
    <div className={s.page}>
      <button type="button" onClick={goBack} className={s.back}>
        <ChevronLeftIcon width={16} height={16} /> {t('profile.detail.back')}
      </button>

      <div className={s.topGrid}>
        <ProfileHero
          name={profile.name}
          photoUrl={profile.posing_photo_url}
          positionLabel={
            profile.main_position ? t(POSITION_LABEL_KEY[profile.main_position.code]) : null
          }
          locality={profile.locality}
        />
        <PlayerHeader stats={stats} />
      </div>

      {stats && (
        <section>
          <h2 className={s.sectionTitle}>{t('profile.statsTitle')}</h2>
          <StatsGrid stats={stats} />
        </section>
      )}

      <div className={s.grid2}>
        <RecentMatches playerId={profile.id} games={stats?.games ?? 0} />
        <FormTrendCard playerId={profile.id} games={stats?.games ?? 0} />
        <ContributionsCard playerId={profile.id} games={stats?.games ?? 0} />
        <XpSourceCard playerId={profile.id} games={stats?.games ?? 0} />
      </div>

      <AchievementsGrid playerId={profile.id} featuredId={profile.featured_achievement_id} />
    </div>
  );
}
