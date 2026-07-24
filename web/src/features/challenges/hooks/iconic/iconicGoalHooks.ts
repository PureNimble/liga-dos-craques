import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Database } from '@/types/database';

export type IconicGoal = Database['public']['Tables']['iconic_goal']['Row'];
export type IconicGoalInsert = Database['public']['Tables']['iconic_goal']['Insert'];
export type IconicGoalUpdate = Database['public']['Tables']['iconic_goal']['Update'];
export type IconicLeaderboardRow = Database['public']['Views']['v_iconic_goal_leaderboard']['Row'];

/** Todos os golos icónicos ativos (definições). */
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

/** Golos icónicos já replicados pelo próprio jogador → Set de iconic_goal_id. */
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

/** Golo atualmente sorteado para o próprio jogador (ou null). */
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

/** Roda o spinner: sorteia um golo por replicar (ou devolve o ativo). */
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

/** Auto-declaração: desbloqueia a conquista do golo ativo. */
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

/** Liberta o golo ativo (pode voltar a rodar). */
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

/** Ranking: nº de golos icónicos replicados por jogador. */
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

/** Admin: todos os golos (inclui inativos), ordenados como na grelha. */
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

/** Admin: cria um golo icónico (RLS exige is_admin()). */
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

/** Admin: edita um golo icónico (RLS exige is_admin()). */
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
