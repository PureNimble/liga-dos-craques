import { QueryClient } from '@tanstack/react-query';

/** Shared TanStack Query client with conservative defaults for slow-changing read-heavy data. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
