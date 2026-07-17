import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { useProfileSuspense } from '@/features/profile/profileHooks';
import { Loading } from '@/shared/components/ui';
import s from './AppLayout.module.css';

function AppShell() {
  // Fetch único do perfil, partilhado por Navbar, BottomNav e páginas via outlet context.
  const { data: profile } = useProfileSuspense();

  return (
    <>
      <Navbar profile={profile} />

      <main className={s.main}>
        <Suspense fallback={<Loading />}>
          <Outlet context={{ profile }} />
        </Suspense>
      </main>

      <BottomNav profile={profile} />
    </>
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
