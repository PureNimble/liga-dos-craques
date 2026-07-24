import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider, Outlet } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { I18nProvider } from '@/shared/i18n/I18nProvider';
import { i18nRegistry } from '@/app/i18nRegistry';
import { HomePage } from './HomePage';

// Isola a Home das suas dependências de dados/rede.
vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ user: { email: 'vasco@example.com' }, session: {}, loading: false }),
}));
vi.mock('@/features/stats/statsHooks', () => ({
  usePlayerStatsSuspense: () => ({
    data: {
      player_id: 'u1',
      name: 'Vasco',
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goals: 0,
      assists: 0,
      saves: 0,
      mvps: 0,
      flops: 0,
      avg_rating: null,
    },
  }),
}));
vi.mock('@/features/xp/xpHooks', () => ({
  usePlayerXpSuspense: () => ({
    data: { player_id: 'u1', total_xp: 0, level: 1, level_min_xp: 0, next_level_xp: 50 },
  }),
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
