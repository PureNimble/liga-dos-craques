import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loading } from '@/shared/components/ui';
import { useAuth } from './useAuth';

/**
 * Envolve rotas que exigem sessão. Enquanto carrega a sessão mostra um estado
 * neutro; sem sessão redireciona para /login guardando o destino.
 */
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
