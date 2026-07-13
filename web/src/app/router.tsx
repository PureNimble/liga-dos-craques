import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazyWithReload } from '@/lib/lazyWithReload';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignupPage } from '@/features/auth/SignupPage';
import { RecoverPasswordPage } from '@/features/auth/RecoverPasswordPage';
import { UpdatePasswordPage } from '@/features/auth/UpdatePasswordPage';
import { AppLayout } from './AppLayout';

// Páginas autenticadas carregadas sob procura (code-splitting) → arranque leve.
const HomePage = lazyWithReload(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));

export const router = createBrowserRouter([
  // Rotas públicas
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },
  { path: '/recover', element: <RecoverPasswordPage /> },
  { path: '/update-password', element: <UpdatePasswordPage /> },

  // Rotas protegidas (exigem sessão) dentro do layout com navegação
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [{ path: '/', element: <HomePage /> }],
      },
    ],
  },

  // Qualquer outra rota → início
  { path: '*', element: <Navigate to="/" replace /> },
]);
