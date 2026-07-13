import { QueryClient } from '@tanstack/react-query';

/**
 * Cliente TanStack Query partilhado. Defaults conservadores adequados a uma
 * app de leitura frequente com dados que mudam pouco (perfis, jogos, rankings).
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000, // 1 min — evita refetch agressivo
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
