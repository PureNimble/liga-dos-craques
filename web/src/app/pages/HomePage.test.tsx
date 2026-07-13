import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi } from 'vitest';
import { HomePage } from './HomePage';

// Isola a Home das suas dependências de dados/rede.
vi.mock('@/features/auth/useAuth', () => ({
  useAuth: () => ({ user: { email: 'vasco@example.com' }, session: {}, loading: false }),
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
