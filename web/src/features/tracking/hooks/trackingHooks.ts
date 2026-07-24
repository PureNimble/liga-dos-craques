import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';

/** Current user's analytics consent state. */
export type ConsentState = 'undecided' | 'granted' | 'denied';

/** Fetches the current user's tracking consent decision (no row = not yet decided). */
export function useAnalyticsConsent(userId: string | undefined) {
  return useQuery({
    queryKey: ['analytics_consent', userId],
    enabled: Boolean(userId),
    staleTime: 5 * 60_000,
    queryFn: async (): Promise<ConsentState> => {
      const { data, error } = await supabase
        .from('analytics_consent')
        .select('granted')
        .eq('user_id', userId as string)
        .maybeSingle();
      if (error) throw error;
      if (!data) return 'undecided';
      return data.granted ? 'granted' : 'denied';
    },
  });
}

/** Grants or revokes tracking consent (revoking deletes already collected events). */
export function useSetAnalyticsConsent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (granted: boolean) => {
      const { error } = await supabase.rpc('analytics_set_consent', { p_granted: granted });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['analytics_consent'] });
      queryClient.invalidateQueries({ queryKey: ['admin_tracking_analytics'] });
    },
  });
}
