import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { i18nRegistry } from '@/app/lib/i18nRegistry';
import { HomePage } from './HomePage';

vi.mock('@/features/auth/hooks/useAuth', () => ({
  useAuth: () => ({ user: { email: 'vasco@example.com' }, session: {}, loading: false }),
}));
vi.mock('@/features/games/hooks/gameHooks', () => ({
  useNextGameSuspense: () => ({ data: null }),
  useGamePlayers: () => ({ data: [] }),
  useGames: () => ({ data: [] }),
}));
vi.mock('@/features/teams/hooks/teamHooks', () => ({
  useGameTeams: () => ({ data: undefined }),
}));
vi.mock('@/features/rankings/hooks/rankingHooks', () => ({
  useRankingOverall: () => ({ data: [] }),
}));
vi.mock('@/features/stats/hooks/statsHooks', () => ({
  useRecentGames: () => ({ data: [] }),
  useWeeklySpotlight: () => ({ data: null }),
  useMonthlySpotlight: () => ({ data: null }),
}));
vi.mock('@/features/xp/hooks/xpHooks', () => ({
  usePlayerXpSuspense: () => ({
    data: { player_id: 'u1', total_xp: 0, level: 1, level_min_xp: 0, next_level_xp: 50 },
  }),
}));
vi.mock('@/features/groups/hooks/useActiveGroup', () => ({
  useActiveGroup: () => ({ activeGroup: { photo_url: null } }),
}));
vi.mock('@/features/achievements/hooks/achievementHooks', () => ({
  useAchievements: () => ({ data: [] }),
  usePlayerAchievements: () => ({ data: new Map() }),
}));

const profile = { id: 'u1', name: 'Vasco', photo_url: null };

describe('HomePage', () => {
  it('saúda o utilizador pelo nome', () => {
    const router = createMemoryRouter([
      {
        path: '/',
        element: <Outlet context={{ profile }} />,
        children: [{ index: true, element: <HomePage /> }],
      },
    ]);

    render(
      <I18nProvider dictionary={i18nRegistry}>
        <RouterProvider router={router} />
      </I18nProvider>,
    );
    expect(screen.getByRole('heading', { name: /vasco/i })).toBeInTheDocument();
  });
});
