import type { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { describe, it, expect, vi } from 'vitest';
import { HomePage } from './HomePage';

// Isola o teste da rede: mocka o cliente Supabase.
vi.mock('@/lib/supabase', () => ({
  supabase: {
    rpc: vi.fn().mockResolvedValue({ data: 'pong', error: null }),
  },
}));

function renderWithProviders(ui: ReactNode) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>);
}

describe('HomePage', () => {
  it('mostra o título da app', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByRole('heading', { name: /peladinhas/i })).toBeInTheDocument();
  });
});
