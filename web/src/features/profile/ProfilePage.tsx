import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Loading } from '@/shared/components/ui';
import { useProfile, usePositions } from './profileHooks';
import { ProfileEditModal } from './ProfileEditModal';
import { PlayerCard } from './PlayerCard';
import { PlayerHeader } from './PlayerHeader';
import { cardAttributes, overallOf, positionShort } from './cardStats';
import { FOOT_LABELS } from './profile.schemas';
import { usePlayerStats } from '@/features/stats/statsHooks';
import { StatsGrid } from '@/features/stats/StatsGrid';
import { PlayerCharts } from '@/features/stats/PlayerCharts';
import { RecentMatches } from '@/features/stats/RecentMatches';
import { usePlayerXp } from '@/features/xp/xpHooks';
import { XpBar } from '@/features/xp/XpBar';
import { AchievementsGrid } from '@/features/achievements/AchievementsGrid';
import { useAchievements, useSetFeaturedAchievement } from '@/features/achievements/achievementHooks';
import s from './profileLayout.module.css';

export function ProfilePage() {
  const { data: profile, isLoading, isError } = useProfile();
  const { data: positions } = usePositions();
  const { data: stats } = usePlayerStats(profile?.id);
  const { data: xp } = usePlayerXp(profile?.id);
  const { data: achievements } = useAchievements();
  const setFeatured = useSetFeaturedAchievement();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return <Loading />;
  }
  if (isError || !profile) {
    return (
      <div className={s.errorPage}>
        <Alert kind="error">Não foi possível carregar o teu perfil.</Alert>
      </div>
    );
  }

  const category = positions?.find((p) => p.id === profile.main_position_id)?.category ?? null;
  const subtitle = [positions?.find((p) => p.id === profile.main_position_id)?.label, profile.locality]
    .filter(Boolean)
    .join(' · ');
  const featured = achievements?.find((a) => a.id === profile.featured_achievement_id) ?? null;

  return (
    <div className={s.page}>
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
          own
          featured={featured ? { icon: featured.icon, label: featured.label } : null}
        />
      </div>

      <div className={s.actions}>
        <Button block onClick={() => setEditOpen(true)}>
          Editar perfil
        </Button>
        <Link to="/update-password">
          <Button variant="secondary">Password</Button>
        </Link>
      </div>

      {xp && <XpBar xp={xp} />}

      {stats && (
        <section>
          <h2 className={s.sectionTitle}>Estatísticas</h2>
          <StatsGrid stats={stats} />
        </section>
      )}

      <div className={s.grid2}>
        <RecentMatches playerId={profile.id} games={stats?.games ?? 0} />
        <PlayerCharts playerId={profile.id} games={stats?.games ?? 0} own />
      </div>

      <AchievementsGrid
        playerId={profile.id}
        editable
        featuredId={profile.featured_achievement_id}
        onSelect={(id) => setFeatured.mutate(id)}
      />

      {editOpen && <ProfileEditModal profile={profile} onClose={() => setEditOpen(false)} />}
    </div>
  );
}
