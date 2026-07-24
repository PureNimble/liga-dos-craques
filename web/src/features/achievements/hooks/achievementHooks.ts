import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useActiveGroupId } from '@/features/groups/hooks/useActiveGroup';
import type { Database } from '@/types/database';

export type Achievement = Database['public']['Tables']['achievement']['Row'];
export type AchievementInsert = Database['public']['Tables']['achievement']['Insert'];
export type AchievementUpdate = Database['public']['Tables']['achievement']['Update'];

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

/** Conquistas desbloqueadas por um jogador no grupo ativo → Map achievement_id → unlocked_at. */
export function usePlayerAchievements(playerId: string | undefined) {
  const groupId = useActiveGroupId();
  return useQuery({
    queryKey: ['player_achievements', groupId, playerId],
    enabled: Boolean(playerId),
    queryFn: async (): Promise<Map<number, string>> => {
      const { data, error } = await supabase
        .from('user_achievement')
        .select('achievement_id, unlocked_at')
        .eq('player_id', playerId as string)
        .eq('group_id', groupId);
      if (error) throw error;
      return new Map((data ?? []).map((r) => [r.achievement_id, r.unlocked_at]));
    },
  });
}

/** Admin: todas as conquistas (inclui inativas), ordenadas como na grelha. */
export function useAllAchievements() {
  return useQuery({
    queryKey: ['achievements_all'],
    queryFn: async (): Promise<Achievement[]> => {
      const { data, error } = await supabase
        .from('achievement')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
}

function invalidateAchievements(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['achievements'] });
  queryClient.invalidateQueries({ queryKey: ['achievements_all'] });
}

/** Admin: cria uma conquista (RLS exige is_admin()). */
export function useAddAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (achievement: AchievementInsert) => {
      const { error } = await supabase.from('achievement').insert(achievement);
      if (error) throw error;
    },
    onSuccess: () => invalidateAchievements(queryClient),
  });
}

/** Admin: edita uma conquista (RLS exige is_admin()). */
export function useUpdateAchievement() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: AchievementUpdate }) => {
      const { error } = await supabase.from('achievement').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateAchievements(queryClient),
  });
}
