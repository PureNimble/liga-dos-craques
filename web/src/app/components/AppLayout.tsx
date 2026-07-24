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
  // Fetch único do perfil, partilhado por Navbar e páginas via outlet context.
  const { data: profile } = useProfileSuspense();
  const { data: myGroups } = useMyGroupsSuspense();

  // Sem grupo → nada no resto da app faz sentido; toma conta do ecrã inteiro.
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
  // Vistas de altura fixa (admin, mapa de campos): barra lateral/painel imóvel
  // + conteúdo com scroll próprio — o container preenche o `main` em vez de
  // crescer com o conteúdo.
  const pathname = useLocation().pathname;
  const isFixedHeight = pathname.startsWith('/admin') || pathname.startsWith('/places');

  return (
    <OnlinePresenceProvider userId={profile.id}>
      <div className={s.shell}>
        {/* Coluna de grupos (tablet/desktop) — no telemóvel fica escondida, ver GroupRail.module.css. */}
        <GroupRail />

        <div className={s.column}>
          <Navbar profile={profile} />

          <main className={`${s.main}${isFixedHeight ? ` ${s.mainFill}` : ''}`}>
            <div className={`${s.container}${isFixedHeight ? ` ${s.containerFill}` : ''}`}>
              <Suspense fallback={<Loading />}>
                {/* key={groupId}: ao trocar de grupo, remonta a página a partir do zero
                    (evita estado local "à mistura" de dados do grupo anterior). */}
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

export function AppLayout() {
  return (
    <div className={s.app}>
      <Suspense fallback={<Loading full />}>
        <AppShell />
      </Suspense>
    </div>
  );
}
