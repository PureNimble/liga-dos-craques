import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/useAuth';
import type { Database } from '@/types/database';

export type Achievement = Database['public']['Tables']['achievement']['Row'];

/** Define (ou limpa) a conquista destacada no cartão do próprio jogador. */
export function useSetFeaturedAchievement() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (achievementId: number | null) => {
      const { error } = await supabase
        .from('profile')
        .update({ featured_achievement_id: achievementId })
        .eq('id', user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      if (user) queryClient.invalidateQueries({ queryKey: ['public_profile', user.id] });
    },
  });
}

/** Todas as conquistas ativas (definições). */
export function useAchievements() {
  return useQuery({
    queryKey: ['achievements'],
    queryFn: async (): Promise<Achievement[]> => {
      const { data, error } = await supabase
        .from('achievement')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: Infinity,
  });
}

/** Conquistas desbloqueadas por um jogador → Map achievement_id → unlocked_at. */
export function usePlayerAchievements(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player_achievements', playerId],
    enabled: Boolean(playerId),
    queryFn: async (): Promise<Map<number, string>> => {
      const { data, error } = await supabase
        .from('user_achievement')
        .select('achievement_id, unlocked_at')
        .eq('player_id', playerId as string);
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.achievement_id, r.unlocked_at]));
    },
  });
}
