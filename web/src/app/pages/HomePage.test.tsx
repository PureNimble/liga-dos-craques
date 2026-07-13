import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { HomePage } from './HomePage';

// Isola a Home das suas dependências de dados/rede.
vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ user: { email: 'vasco@example.com' }, session: {}, loading: false }),
}));
vi.mock('@/features/profile/profileHooks', () => ({
  useProfile: () => ({ data: { id: 'u1', name: 'Vasco' } }),
}));
vi.mock('@/features/stats/statsHooks', () => ({
  usePlayerStats: () => ({ data: undefined }),
}));
vi.mock('@/features/xp/xpHooks', () => ({
  usePlayerXp: () => ({ data: undefined }),
}));
vi.mock('@/features/health/ConnectionStatus', () => ({
  ConnectionStatus: () => <div>estado</div>,
}));

describe('HomePage', () => {
  it('saúda o utilizador pelo nome', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /vasco/i })).toBeInTheDocument();
  });
});
