import { Suspense } from 'react';
import { Outlet, useLocation } from 'react-router-dom';

import { Navbar } from './Navbar';
import { useProfileSuspense } from '@/features/profile/profileHooks';
import { OnlinePresenceProvider } from '@/features/health/onlinePresence';
import { ConsentBanner } from '@/features/tracking/ConsentBanner';
import { useAnalyticsConsent } from '@/features/tracking/trackingHooks';
import { usePageTracking } from '@/features/tracking/usePageTracking';
import { Loading } from '@/shared/components/ui';
import s from './AppLayout.module.css';

function AppShell() {
  // Fetch único do perfil, partilhado por Navbar e páginas via outlet context.
  const { data: profile } = useProfileSuspense();
  const { data: consent } = useAnalyticsConsent(profile.id);
  usePageTracking(profile.id, consent === 'granted');
  // O admin é uma vista de altura fixa (barra lateral imóvel + conteúdo com
  // scroll próprio): o container preenche o `main` em vez de crescer com o conteúdo.
  const isAdmin = useLocation().pathname.startsWith('/admin');

  return (
    <OnlinePresenceProvider userId={profile.id}>
      <Navbar profile={profile} />

      <main className={`${s.main}${isAdmin ? ` ${s.mainFill}` : ''}`}>
        <div className={`${s.container}${isAdmin ? ` ${s.containerFill}` : ''}`}>
          <Suspense fallback={<Loading />}>
            <Outlet context={{ profile }} />
          </Suspense>
        </div>
      </main>

      {consent === 'undecided' && <ConsentBanner />}
    </OnlinePresenceProvider>
  );
}

export function AppLayout() {
  return (
    <div className={s.app}>
      <Suspense fallback={<Loading full />}>
        <AppShell />
      </Suspense>
    </div>
  );
}
