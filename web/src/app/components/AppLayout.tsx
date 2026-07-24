import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { Navbar } from './Navbar';
import { GroupRail } from './GroupRail';
import { useProfileSuspense, type FullProfile } from '@/features/profile/hooks/profileHooks';
import { useMyGroupsSuspense } from '@/features/groups/hooks/groupHooks';
import { GroupProvider } from '@/features/groups/components/GroupProvider';
import { useActiveGroup } from '@/features/groups/hooks/useActiveGroup';
import { GroupOnboardingPage } from '@/features/groups/components/GroupOnboardingPage';
import { OnlinePresenceProvider } from '@/features/health/components/onlinePresence';
import { ConsentBanner } from '@/features/tracking/components/ConsentBanner';
import { useAnalyticsConsent } from '@/features/tracking/hooks/trackingHooks';
import { usePageTracking } from '@/features/tracking/hooks/usePageTracking';
import { Loading } from '@/shared/components/ui';
import s from './AppLayout.module.css';

function AppShell() {
  const { data: profile } = useProfileSuspense();
  const { data: myGroups } = useMyGroupsSuspense();

  if (myGroups.length === 0) {
    return <GroupOnboardingPage />;
  }

  return (
    <GroupProvider profile={profile} myGroups={myGroups}>
      <AppShellContent profile={profile} />
    </GroupProvider>
  );
}

function AppShellContent({ profile }: { profile: FullProfile }) {
  const { groupId } = useActiveGroup();
  const { data: consent } = useAnalyticsConsent(profile.id);
  usePageTracking(profile.id, consent === 'granted');
  const pathname = useLocation().pathname;
  const isFixedHeight = pathname.startsWith('/admin') || pathname.startsWith('/places');

  return (
    <OnlinePresenceProvider userId={profile.id}>
      <div className={s.shell}>
        <GroupRail />

        <div className={s.column}>
          <Navbar profile={profile} />

          <main className={`${s.main}${isFixedHeight ? ` ${s.mainFill}` : ''}`}>
            <div className={`${s.container}${isFixedHeight ? ` ${s.containerFill}` : ''}`}>
              <Suspense fallback={<Loading />}>
                <Outlet key={groupId} context={{ profile }} />
              </Suspense>
            </div>
          </main>

          {consent === 'undecided' && <ConsentBanner />}
        </div>
      </div>
    </OnlinePresenceProvider>
  );
}

/** Authenticated app shell: group rail, navbar, routed content and consent banner. */
export function AppLayout() {
  return (
    <div className={s.app}>
      <Suspense fallback={<Loading full />}>
        <AppShell />
      </Suspense>
    </div>
  );
}
