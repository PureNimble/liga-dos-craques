import { useOutletContext } from 'react-router-dom';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useActiveGroup } from '@/features/groups/hooks/useActiveGroup';
import type { FullProfile } from '@/features/profile/hooks/profileHooks';
import { useWeeklySpotlight, useMonthlySpotlight } from '@/features/stats/hooks/statsHooks';
import { useT } from '@/shared/i18n/useT';
import { HomeIntro } from '@/app/components/HomeIntro';
import { HomeSeasonCard } from '@/app/components/HomeSeasonCard';
import { HomeMatchCard } from '@/app/components/HomeMatchCard';
import { HomeQuickActions } from '@/app/components/HomeQuickActions';
import { HomeRankingTable } from '@/app/components/HomeRankingTable';
import { HomeRecentResults } from '@/app/components/HomeRecentResults';
import { HomePeriodSpotlight } from '@/app/components/HomePeriodSpotlight';
import { HomeUpcomingFixtures } from '@/app/components/HomeUpcomingFixtures';
import { HomeNewsMock } from '@/app/components/HomeNewsMock';
import { HomeAchievementsProgress } from '@/app/components/HomeAchievementsProgress';
import s from './HomePage.module.css';

/** Home screen: greeting/season, next match, quick actions, group ranking, recent results. */
export function HomePage() {
  const { user } = useAuth();
  const { t } = useT();
  const { profile } = useOutletContext<{ profile: FullProfile }>();
  const { activeGroup } = useActiveGroup();

  const displayName = profile.name || user?.email?.split('@')[0] || t('home.fallbackName');
  const { data: weekly } = useWeeklySpotlight();
  const { data: monthly } = useMonthlySpotlight();

  return (
    <div className={s.page}>
      <div className={s.topRow}>
        <div className={s.topRowLeft}>
          <div className={s.heroTop}>
            <div className={s.heroTopLeft}>
              <HomeIntro welcomeName={displayName} playerId={profile.id} />
              <HomeSeasonCard playerId={profile.id} />
            </div>
            <div className={s.heroDecoBox} aria-hidden="true">
              <img src={activeGroup.photo_url ?? '/images/badge.svg'} alt="" className={s.heroDeco} />
            </div>
          </div>
          <HomeQuickActions />
        </div>
        <div className={s.matchColumn}>
          <HomeMatchCard />
        </div>
      </div>

      <div className={s.statsRow}>
        <HomeRankingTable playerId={profile.id} />
        <HomeRecentResults playerId={profile.id} />
        <HomePeriodSpotlight titleKey="home.spotlight.week.title" data={weekly} featured />
        <HomeUpcomingFixtures />
      </div>

      <div className={s.newsRow}>
        <HomeNewsMock />
        <HomePeriodSpotlight titleKey="home.spotlight.month.title" data={monthly} />
        <HomeAchievementsProgress playerId={profile.id} />
      </div>
    </div>
  );
}
