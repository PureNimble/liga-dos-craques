import { createBrowserRouter, Navigate } from 'react-router-dom';
import { lazyWithReload } from '@/shared/lib/lazyWithReload';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { LoginPage } from '@/features/auth/LoginPage';
import { SignupPage } from '@/features/auth/SignupPage';
import { RecoverPasswordPage } from '@/features/auth/RecoverPasswordPage';
import { UpdatePasswordPage } from '@/features/auth/UpdatePasswordPage';
import { AppLayout } from './AppLayout';

// Páginas autenticadas carregadas sob procura (code-splitting) → arranque leve.
const HomePage = lazyWithReload(() =>
  import('./pages/HomePage').then((m) => ({ default: m.HomePage })),
);
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
const AdminLayout = lazyWithReload(() =>
  import('@/features/admin/AdminLayout').then((m) => ({ default: m.AdminLayout })),
);
const AdminDashboard = lazyWithReload(() =>
  import('@/features/admin/AdminDashboard').then((m) => ({ default: m.AdminDashboard })),
);
const AdminPlayersPage = lazyWithReload(() =>
  import('@/features/admin/AdminPlayersPage').then((m) => ({ default: m.AdminPlayersPage })),
);
const AdminGoalsPage = lazyWithReload(() =>
  import('@/features/admin/AdminGoalsPage').then((m) => ({ default: m.AdminGoalsPage })),
);
const AdminReportsPage = lazyWithReload(() =>
  import('@/features/admin/AdminReportsPage').then((m) => ({ default: m.AdminReportsPage })),
);
const AdminGamesPage = lazyWithReload(() =>
  import('@/features/admin/AdminGamesPage').then((m) => ({ default: m.AdminGamesPage })),
);
const AdminAchievementsPage = lazyWithReload(() =>
  import('@/features/admin/AdminAchievementsPage').then((m) => ({
    default: m.AdminAchievementsPage,
  })),
);
const AdminReferencePage = lazyWithReload(() =>
  import('@/features/admin/AdminReferencePage').then((m) => ({ default: m.AdminReferencePage })),
);
const AdminAnalyticsPage = lazyWithReload(() =>
  import('@/features/admin/AdminAnalyticsPage').then((m) => ({ default: m.AdminAnalyticsPage })),
);
const AdminSystemPage = lazyWithReload(() =>
  import('@/features/admin/AdminSystemPage').then((m) => ({ default: m.AdminSystemPage })),
);
const PlacesMapPage = lazyWithReload(() =>
  import('@/features/places/PlacesMapPage').then((m) => ({ default: m.PlacesMapPage })),
);
const SettingsPage = lazyWithReload(() =>
  import('@/features/settings/SettingsPage').then((m) => ({ default: m.SettingsPage })),
);
const NotificationsPage = lazyWithReload(() =>
  import('@/features/notifications/NotificationsPage').then((m) => ({
    default: m.NotificationsPage,
  })),
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
          { path: '/settings', element: <SettingsPage /> },
          { path: '/notifications', element: <NotificationsPage /> },
          {
            path: '/admin',
            element: <AdminLayout />,
            children: [
              { index: true, element: <AdminDashboard /> },
              { path: 'players', element: <AdminPlayersPage /> },
              { path: 'games', element: <AdminGamesPage /> },
              { path: 'goals', element: <AdminGoalsPage /> },
              { path: 'achievements', element: <AdminAchievementsPage /> },
              { path: 'reference', element: <AdminReferencePage /> },
              { path: 'analytics', element: <AdminAnalyticsPage /> },
              { path: 'reports', element: <AdminReportsPage /> },
              { path: 'system', element: <AdminSystemPage /> },
            ],
          },
        ],
      },
    ],
  },

  // Qualquer outra rota → início
  { path: '*', element: <Navigate to="/" replace /> },
]);
