import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './useAuth';

/**
 * Envolve rotas que exigem sessão. Enquanto carrega a sessão mostra um estado
 * neutro; sem sessão redireciona para /login guardando o destino.
 */
export function ProtectedRoute() {
  const { session, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-400">A carregar…</div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
