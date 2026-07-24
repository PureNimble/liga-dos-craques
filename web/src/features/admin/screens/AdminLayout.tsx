import { Suspense } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loading } from '@/shared/components/ui';
import { useProfile } from '@/features/profile/hooks/profileHooks';
import { AdminSidebar } from '../components/AdminSidebar';
import s from './AdminLayout.module.css';

/** Admin dashboard shell: role gate + persistent sidebar + routed content. */
export function AdminLayout() {
  const { data: profile, isLoading } = useProfile();

  if (isLoading) return <Loading />;
  if (profile?.role !== 'admin') return <Navigate to="/" replace />;

  return (
    <div className={s.shell}>
      <AdminSidebar />
      <main className={s.content}>
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
