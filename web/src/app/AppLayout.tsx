import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { useProfileSuspense } from '@/features/profile/profileHooks';
import s from './AppLayout.module.css';

function AppShell() {
  // Fetch único do perfil, partilhado por Navbar, BottomNav e páginas via outlet context.
  const { data: profile } = useProfileSuspense();

  return (
    <>
      <Navbar profile={profile} />

      <main className={s.main}>
        <Suspense
          fallback={
            <div className={`${s.loading} ${s.loadingInline}`}>
              <span className={s.spinner} />
            </div>
          }
        >
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
      <Suspense
        fallback={
          <div className={`${s.loading} ${s.loadingFull}`}>
            <span className={s.spinner} />
          </div>
        }
      >
        <AppShell />
      </Suspense>
    </div>
  );
}
