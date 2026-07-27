import { useState } from 'react';
import { Alert, Card, Loading } from '@/shared/components/ui';
import { useProfile, usePositions } from '../hooks/profileHooks';
import { ProfileEditModal } from '../components/ProfileEditModal';
import { ProfileHero } from '../components/ProfileHero';
import { PlayerHeader } from '../components/PlayerHeader';
import { PositionsCard } from '../components/PositionsCard';
import { AboutCard } from '../components/AboutCard';
import { ProfileSidebar, type ProfileTab } from '../components/ProfileSidebar';
import { FOOT_LABEL_KEY, POSITION_LABEL_KEY } from '../schemas/profile.schemas';
import { usePlayerStats } from '@/features/stats/hooks/statsHooks';
import { StatsGrid } from '@/features/stats/components/StatsGrid';
import {
  FormTrendCard,
  ContributionsCard,
  XpSourceCard,
} from '@/features/stats/components/PlayerCharts';
import { RecentMatches } from '@/features/stats/components/RecentMatches';
import { usePlayerXp } from '@/features/xp/hooks/xpHooks';
import { AchievementsGrid } from '@/features/achievements/components/AchievementsGrid';
import { AchievementsPreview } from '@/features/achievements/components/AchievementsPreview';
import { AchievementTimeline } from '@/features/achievements/components/AchievementTimeline';
import { useSetFeaturedAchievement } from '@/features/achievements/hooks/achievementHooks';
import { useT } from '@/shared/i18n/useT';
import s from './profileLayout.module.css';

/** The current user's own profile page: sidebar nav, hero, stats, XP, achievements and edit action. */
export function ProfilePage() {
  const { t } = useT();
  const [tab, setTab] = useState<ProfileTab>('perfil');
  const { data: profile, isLoading, isError } = useProfile();
  const { data: positions } = usePositions();
  const { data: stats } = usePlayerStats(profile?.id);
  const { data: xp } = usePlayerXp(profile?.id);
  const setFeatured = useSetFeaturedAchievement();
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading) {
    return <Loading />;
  }
  if (isError || !profile) {
    return (
      <div className={s.errorPage}>
        <Alert kind="error">{t('profile.loadError')}</Alert>
      </div>
    );
  }

  const mainPosition = positions?.find((p) => p.id === profile.main_position_id) ?? null;
  const footLabel = profile.preferred_foot ? t(FOOT_LABEL_KEY[profile.preferred_foot]) : null;
  const heightLabel =
    profile.height_cm != null ? `${(profile.height_cm / 100).toFixed(2)} m` : null;

  return (
    <div className={s.page}>
      <div className={s.shell}>
        <ProfileSidebar
          active={tab}
          onChange={setTab}
          xp={xp}
          stats={stats}
          excludeId={profile.id}
        />

        <div className={s.content}>
          {tab === 'perfil' && (
            <>
              <div className={s.topGrid}>
                <ProfileHero
                  name={profile.name}
                  photoUrl={profile.posing_photo_url}
                  positionLabel={mainPosition ? t(POSITION_LABEL_KEY[mainPosition.code]) : null}
                  locality={profile.locality}
                  onEdit={() => setEditOpen(true)}
                />
                <PlayerHeader stats={stats} own />
              </div>

              <div className={s.chartsRow}>
                <FormTrendCard playerId={profile.id} games={stats?.games ?? 0} own />
                <AchievementsPreview playerId={profile.id} onViewAll={() => setTab('conquistas')} />
              </div>

              <div className={s.quadGrid}>
                <RecentMatches playerId={profile.id} games={stats?.games ?? 0} />
                <PositionsCard
                  positions={positions ?? []}
                  mainPositionId={profile.main_position_id}
                  secondaryPositionIds={profile.secondaryPositionIds}
                />
                {stats && (
                  <Card>
                    <h2 className={s.sectionTitle}>{t('profile.statsTitle')}</h2>
                    <StatsGrid stats={stats} />
                  </Card>
                )}
                <AboutCard
                  name={profile.name}
                  birthDate={profile.birth_date}
                  footLabel={footLabel}
                  heightLabel={heightLabel}
                  locality={profile.locality}
                  memberSince={profile.created_at}
                />
              </div>
            </>
          )}

          {tab === 'estatisticas' && (
            <>
              {stats && (
                <Card>
                  <h2 className={s.sectionTitle}>{t('profile.statsTitle')}</h2>
                  <StatsGrid stats={stats} />
                </Card>
              )}
              <div className={s.grid2}>
                <FormTrendCard playerId={profile.id} games={stats?.games ?? 0} own />
                <ContributionsCard playerId={profile.id} games={stats?.games ?? 0} own />
                <XpSourceCard playerId={profile.id} games={stats?.games ?? 0} own />
              </div>
            </>
          )}

          {tab === 'historico' && <AchievementTimeline playerId={profile.id} />}

          {tab === 'conquistas' && (
            <AchievementsGrid
              playerId={profile.id}
              editable
              featuredId={profile.featured_achievement_id}
              onSelect={(id) => setFeatured.mutate(id)}
            />
          )}

          {tab === 'jogos' && (
            <RecentMatches playerId={profile.id} games={stats?.games ?? 0} limit={20} />
          )}
        </div>
      </div>

      {editOpen && <ProfileEditModal profile={profile} onClose={() => setEditOpen(false)} />}
    </div>
  );
}
