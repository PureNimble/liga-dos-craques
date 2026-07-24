import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loading } from '@/shared/components/ui';
import { useAuth } from '../hooks/useAuth';

/** Wraps routes that require a session; redirects to /login (keeping the destination) when unauthenticated. */
export function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading full />;
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
