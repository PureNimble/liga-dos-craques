import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Database } from '@/types/database';

/** An iconic goal definition row. */
export type IconicGoal = Database['public']['Tables']['iconic_goal']['Row'];
/** Insert payload for an iconic goal. */
export type IconicGoalInsert = Database['public']['Tables']['iconic_goal']['Insert'];
/** Update payload for an iconic goal. */
export type IconicGoalUpdate = Database['public']['Tables']['iconic_goal']['Update'];
/** A row of the iconic goals leaderboard view. */
export type IconicLeaderboardRow = Database['public']['Views']['v_iconic_goal_leaderboard']['Row'];

/** Lists all active iconic goal definitions. */
export function useIconicGoals() {
  return useQuery({
    queryKey: ['iconic_goals'],
    queryFn: async (): Promise<IconicGoal[]> => {
      const { data, error } = await supabase
        .from('iconic_goal')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: Infinity,
  });
}

/** Iconic goals already replicated by the current player, as a Set of iconic_goal_id. */
export function useMyReplicas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['iconic_replicas', user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<Set<number>> => {
      const { data, error } = await supabase
        .from('iconic_goal_replica')
        .select('iconic_goal_id')
        .eq('player_id', user!.id);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r.iconic_goal_id));
    },
  });
}

/** The iconic goal currently drawn for the player, or null. */
export function useMySpin() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['iconic_spin', user?.id],
    enabled: Boolean(user),
    queryFn: async (): Promise<number | null> => {
      const { data, error } = await supabase
        .from('iconic_goal_spin')
        .select('iconic_goal_id')
        .eq('player_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      return data?.iconic_goal_id ?? null;
    },
  });
}

/** Spins the reel: draws a not-yet-replicated goal (or returns the active one). */
export function useSpin() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<number | null> => {
      const { data, error } = await supabase.rpc('iconic_goal_roll', {});
      if (error) throw error;
      return (data as number | null) ?? null;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iconic_spin', user?.id] });
    },
  });
}

/** Self-declares the active goal as replicated, unlocking its achievement. */
export function useReplicate() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<number> => {
      const { data, error } = await supabase.rpc('iconic_goal_replicate', {});
      if (error) throw error;
      return data as number;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iconic_spin', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['iconic_leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['iconic_replicas', user?.id] });
    },
  });
}

/** Releases the active goal so the player can spin again. */
export function useForfeit() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('iconic_goal_forfeit', {});
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['iconic_spin', user?.id] });
    },
  });
}

/** Leaderboard: number of iconic goals replicated per player. */
export function useIconicLeaderboard() {
  return useQuery({
    queryKey: ['iconic_leaderboard'],
    queryFn: async (): Promise<IconicLeaderboardRow[]> => {
      const { data, error } = await supabase.from('v_iconic_goal_leaderboard').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Admin: all goals (including inactive), ordered as in the grid. */
export function useAllIconicGoals() {
  return useQuery({
    queryKey: ['iconic_goals_all'],
    queryFn: async (): Promise<IconicGoal[]> => {
      const { data, error } = await supabase
        .from('iconic_goal')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
  });
}

function invalidateIconicGoals(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['iconic_goals'] });
  queryClient.invalidateQueries({ queryKey: ['iconic_goals_all'] });
}

/** Admin: creates an iconic goal (RLS requires is_admin()). */
export function useAddIconicGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (goal: IconicGoalInsert) => {
      const { error } = await supabase.from('iconic_goal').insert(goal);
      if (error) throw error;
    },
    onSuccess: () => invalidateIconicGoals(queryClient),
  });
}

/** Admin: edits an iconic goal (RLS requires is_admin()). */
export function useUpdateIconicGoal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: IconicGoalUpdate }) => {
      const { error } = await supabase.from('iconic_goal').update(patch).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidateIconicGoals(queryClient),
  });
}
