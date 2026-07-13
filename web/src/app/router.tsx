import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazyWithReload } from '@/lib/lazyWithReload';
import { AppLayout } from './AppLayout';

// Páginas autenticadas carregadas sob procura (code-splitting) → arranque leve.
const HomePage = lazyWithReload(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [{ path: '/', element: <HomePage /> }],
  },

  // Qualquer outra rota → início
  { path: '*', element: <Navigate to="/" replace /> },
]);
