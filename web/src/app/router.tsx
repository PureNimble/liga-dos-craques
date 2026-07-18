import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazyWithReload } from '@/shared/lib/lazyWithReload';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignupPage } from '@/features/auth/SignupPage';
import { RecoverPasswordPage } from '@/features/auth/RecoverPasswordPage';
import { UpdatePasswordPage } from '@/features/auth/UpdatePasswordPage';
import { AppLayout } from './AppLayout';

// Páginas autenticadas carregadas sob procura (code-splitting) → arranque leve.
const HomePage = lazyWithReload(() => import('./pages/HomePage').then((m) => ({ default: m.HomePage })));
const ProfilePage = lazyWithReload(() =>
  import('@/features/profile/ProfilePage').then((m) => ({ default: m.ProfilePage })),
);
const PlayerDetailPage = lazyWithReload(() =>
  import('@/features/profile/PlayerDetailPage').then((m) => ({ default: m.PlayerDetailPage })),
);
const GamesListPage = lazyWithReload(() =>
  import('@/features/games/GamesListPage').then((m) => ({ default: m.GamesListPage })),
);
const CreateGamePage = lazyWithReload(() =>
  import('@/features/games/CreateGamePage').then((m) => ({ default: m.CreateGamePage })),
);
const GameDetailPage = lazyWithReload(() =>
  import('@/features/games/GameDetailPage').then((m) => ({ default: m.GameDetailPage })),
);
const RankingsPage = lazyWithReload(() =>
  import('@/features/rankings/RankingsPage').then((m) => ({ default: m.RankingsPage })),
);
const ChallengesPage = lazyWithReload(() =>
  import('@/features/challenges/ChallengesPage').then((m) => ({ default: m.ChallengesPage })),
);
const CrossbarSetupPage = lazyWithReload(() =>
  import('@/features/challenges/crossbar/CrossbarSetupPage').then((m) => ({
    default: m.CrossbarSetupPage,
  })),
);
const CrossbarSessionPage = lazyWithReload(() =>
  import('@/features/challenges/crossbar/CrossbarSessionPage').then((m) => ({
    default: m.CrossbarSessionPage,
  })),
);
const PenaltySetupPage = lazyWithReload(() =>
  import('@/features/challenges/penalty/PenaltySetupPage').then((m) => ({
    default: m.PenaltySetupPage,
  })),
);
const PenaltySessionPage = lazyWithReload(() =>
  import('@/features/challenges/penalty/PenaltySessionPage').then((m) => ({
    default: m.PenaltySessionPage,
  })),
);
const AdminPage = lazyWithReload(() =>
  import('@/features/admin/AdminPage').then((m) => ({ default: m.AdminPage })),
);
const PlacesMapPage = lazyWithReload(() =>
  import('@/features/places/PlacesMapPage').then((m) => ({ default: m.PlacesMapPage })),
);

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
        children: [
          { path: '/', element: <HomePage /> },
          { path: '/profile', element: <ProfilePage /> },
          { path: '/players/:id', element: <PlayerDetailPage /> },
          { path: '/games', element: <GamesListPage /> },
          { path: '/games/new', element: <CreateGamePage /> },
          { path: '/games/:id', element: <GameDetailPage /> },
          { path: '/rankings', element: <RankingsPage /> },
          { path: '/challenges', element: <ChallengesPage /> },
          { path: '/challenges/crossbar/new', element: <CrossbarSetupPage /> },
          { path: '/challenges/crossbar/:sessionId', element: <CrossbarSessionPage /> },
          { path: '/challenges/penalty/new', element: <PenaltySetupPage /> },
          { path: '/challenges/penalty/:sessionId', element: <PenaltySessionPage /> },
          { path: '/places', element: <PlacesMapPage /> },
          { path: '/admin', element: <AdminPage /> },
        ],
      },
    ],
  },

  // Qualquer outra rota → início
  { path: '*', element: <Navigate to="/" replace /> },
]);
