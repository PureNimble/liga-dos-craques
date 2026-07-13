import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button } from '@/components/ui';
import { useProfile } from './useProfile';
import { usePositions } from './usePositions';
import { ProfileEditModal } from './ProfileEditModal';
import { PlayerCard } from './PlayerCard';
import { PlayerHeader } from './PlayerHeader';
import { cardAttributes, overallOf, positionShort } from './cardStats';
import { FOOT_LABELS } from './profile.schemas';
import { usePlayerStats } from '@/features/stats/useStats';
import { StatsGrid } from '@/features/stats/StatsGrid';
import { PlayerCharts } from '@/features/stats/PlayerCharts';
import { RecentMatches } from '@/features/stats/RecentMatches';
import { usePlayerXp } from '@/features/xp/useXp';
import { XpBar } from '@/features/xp/XpBar';
import { AchievementsGrid } from '@/features/achievements/AchievementsGrid';
import { useAchievements, useSetFeaturedAchievement } from '@/features/achievements/achievementHooks';

export function ProfilePage() {
  const { data: profile, isLoading, isError } = useProfile();
  const { data: positions } = usePositions();
  const { data: stats } = usePlayerStats(profile?.id);
  const { data: xp } = usePlayerXp(profile?.id);
  const { data: achievements } = useAchievements();
  const setFeatured = useSetFeaturedAchievement();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-400">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-navy-700 border-t-pitch-500" />
      </div>
    );
  }
  if (isError || !profile) {
    return (
      <div className="p-4 sm:p-6">
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
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-4 sm:p-6">
      {/* Cartão do jogador + nota média, lado a lado (mesmo tamanho) */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch">
        {stats && (
          <div className="w-full sm:w-[300px] sm:shrink-0">
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

      <div className="flex gap-2">
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
          <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-400">
            Estatísticas
          </h2>
          <StatsGrid stats={stats} />
        </section>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <RecentMatches playerId={profile.id} />
        <PlayerCharts playerId={profile.id} />
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
