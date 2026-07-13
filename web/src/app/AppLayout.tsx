import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';

import { Navbar } from './Navbar';
import { BottomNav } from './BottomNav';
import { useProfileSuspense } from '@/features/profile/profileHooks';

function AppShell() {
  // Fetch único do perfil, partilhado por Navbar, BottomNav e páginas via outlet context.
  const { data: profile } = useProfileSuspense();

  return (
    <>
      <Navbar profile={profile} />

      <main className="mx-auto max-w-5xl pb-24 sm:pb-8">
        <Suspense
          fallback={
            <div className="flex items-center justify-center p-16 text-slate-400">
              <span className="h-6 w-6 animate-spin rounded-full border-2 border-navy-700 border-t-pitch-500" />
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
    <div className="min-h-screen bg-navy-975">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center text-slate-400">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-navy-700 border-t-pitch-500" />
          </div>
        }
      >
        <AppShell />
      </Suspense>
    </div>
  );
}
