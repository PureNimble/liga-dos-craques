import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Alert, Button, Loading } from '@/shared/components/ui';
import { useProfile, usePositions } from '../hooks/profileHooks';
import { ProfileEditModal } from '../components/ProfileEditModal';
import { PlayerCard } from '../components/PlayerCard';
import { PlayerHeader } from '../components/PlayerHeader';
import { cardAttributes, overallOf, positionShort } from '../lib/cardStats';
import { FOOT_LABEL_KEY } from '../schemas/profile.schemas';
import { usePlayerStats } from '@/features/stats/hooks/statsHooks';
import { StatsGrid } from '@/features/stats/components/StatsGrid';
import { PlayerCharts } from '@/features/stats/components/PlayerCharts';
import { RecentMatches } from '@/features/stats/components/RecentMatches';
import { usePlayerXp } from '@/features/xp/hooks/xpHooks';
import { XpBar } from '@/features/xp/components/XpBar';
import { AchievementsGrid } from '@/features/achievements/components/AchievementsGrid';
import {
  useAchievements,
  useSetFeaturedAchievement,
} from '@/features/achievements/hooks/achievementHooks';
import { useT } from '@/shared/i18n/useT';
import s from './profileLayout.module.css';

export function ProfilePage() {
  const { t } = useT();
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
        <Alert kind="error">{t('profile.loadError')}</Alert>
      </div>
    );
  }

  const category = positions?.find((p) => p.id === profile.main_position_id)?.category ?? null;
  const subtitle = [
    positions?.find((p) => p.id === profile.main_position_id)?.label,
    profile.locality,
  ]
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
          footLabel={
            profile.preferred_foot ? t(FOOT_LABEL_KEY[profile.preferred_foot]) : null
          }
          avgRating={stats?.avg_rating ?? null}
          games={stats?.games}
          own
          featured={featured ? { icon: featured.icon, label: featured.label } : null}
        />
      </div>

      <div className={s.actions}>
        <Button block onClick={() => setEditOpen(true)}>
          {t('profile.editProfile')}
        </Button>
        <Link to="/update-password">
          <Button variant="secondary">{t('profile.password')}</Button>
        </Link>
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
