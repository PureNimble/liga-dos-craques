import { Link, useParams } from 'react-router-dom';
import { Alert, Loading } from '@/shared/components/ui';
import { ChevronLeftIcon } from '@/shared/components/ui/icons';
import { usePlayerStats } from '@/features/stats/statsHooks';
import { StatsGrid } from '@/features/stats/StatsGrid';
import { PlayerCharts } from '@/features/stats/PlayerCharts';
import { RecentMatches } from '@/features/stats/RecentMatches';
import { usePlayerXp } from '@/features/xp/xpHooks';
import { XpBar } from '@/features/xp/XpBar';
import { AchievementsGrid } from '@/features/achievements/AchievementsGrid';
import { useAchievements } from '@/features/achievements/achievementHooks';
import { usePublicProfile } from './profileHooks';
import { PlayerCard } from './PlayerCard';
import { PlayerHeader } from './PlayerHeader';
import { cardAttributes, overallOf, positionShort } from './cardStats';
import { FOOT_LABELS } from './profile.schemas';
import s from './profileLayout.module.css';

export function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: profile, isLoading, isError } = usePublicProfile(id);
  const { data: xp } = usePlayerXp(id);
  const { data: stats } = usePlayerStats(id);
  const { data: achievements } = useAchievements();

  if (isLoading) return <Loading />;
  if (isError || !profile) {
    return (
      <div className={s.errorPage}>
        <Alert kind="error">Jogador não encontrado.</Alert>
      </div>
    );
  }

  const category = profile.main_position?.category ?? null;
  const subtitle = [profile.main_position?.label, profile.locality].filter(Boolean).join(' · ');
  const featured = achievements?.find((a) => a.id === profile.featured_achievement_id) ?? null;

  return (
    <div className={s.page}>
      <Link to="/rankings" className={s.back}>
        <ChevronLeftIcon width={16} height={16} /> Rankings
      </Link>

      {/* Cartão do jogador + nota média, lado a lado (mesmo tamanho) */}
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
          footLabel={profile.preferred_foot ? FOOT_LABELS[profile.preferred_foot] : null}
          avgRating={stats?.avg_rating ?? null}
          games={stats?.games}
          featured={featured ? { icon: featured.icon, label: featured.label } : null}
        />
      </div>

      {xp && <XpBar xp={xp} />}
      {stats && (
        <section>
          <h2 className={s.sectionTitle}>Estatísticas</h2>
          <StatsGrid stats={stats} />
        </section>
      )}

      <div className={s.grid2}>
        <RecentMatches playerId={profile.id} />
        <PlayerCharts playerId={profile.id} />
      </div>

      <AchievementsGrid playerId={profile.id} featuredId={profile.featured_achievement_id} />
    </div>
  );
}
