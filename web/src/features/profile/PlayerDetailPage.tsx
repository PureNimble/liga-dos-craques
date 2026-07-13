import { Link, useParams } from 'react-router-dom';
import { Alert } from '@/shared/components/ui';
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

export function PlayerDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: profile, isLoading, isError } = usePublicProfile(id);
  const { data: xp } = usePlayerXp(id);
  const { data: stats } = usePlayerStats(id);
  const { data: achievements } = useAchievements();

  if (isLoading)
    return (
      <div className="flex items-center justify-center p-16 text-slate-400">
        <span className="h-6 w-6 animate-spin rounded-full border-2 border-navy-700 border-t-pitch-500" />
      </div>
    );
  if (isError || !profile) {
    return (
      <div className="p-4 sm:p-6">
        <Alert kind="error">Jogador não encontrado.</Alert>
      </div>
    );
  }

  const category = profile.main_position?.category ?? null;
  const subtitle = [profile.main_position?.label, profile.locality].filter(Boolean).join(' · ');
  const featured = achievements?.find((a) => a.id === profile.featured_achievement_id) ?? null;

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-5 p-4 sm:p-6">
      <Link
        to="/rankings"
        className="inline-flex w-fit items-center gap-1 text-sm text-slate-400 transition hover:text-slate-200"
      >
        <ChevronLeftIcon width={16} height={16} /> Rankings
      </Link>

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

      <AchievementsGrid playerId={profile.id} featuredId={profile.featured_achievement_id} />
    </div>
  );
}
