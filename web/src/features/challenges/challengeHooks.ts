import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/useAuth';
import type { ChallengeResult, Database } from '@/types/database';

export type Challenge = Database['public']['Tables']['challenge']['Row'];
export type ChallengeLeaderboardRow = Database['public']['Views']['v_challenge_leaderboard']['Row'];

export interface ChallengeAttemptWithNames {
  id: string;
  player_id: string;
  opponent_id: string | null;
  score: number | null;
  result: ChallengeResult;
  played_at: string;
  profile: { name: string } | null;
  opponent: { name: string } | null;
}

export function useChallenges() {
  return useQuery({
    queryKey: ['challenges'],
    queryFn: async (): Promise<Challenge[]> => {
      const { data, error } = await supabase
        .from('challenge')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: Infinity,
  });
}

export function useChallengeLeaderboard(challengeId: number | undefined) {
  return useQuery({
    queryKey: ['challenge_leaderboard', challengeId],
    enabled: Boolean(challengeId),
    queryFn: async (): Promise<ChallengeLeaderboardRow[]> => {
      const { data, error } = await supabase
        .from('v_challenge_leaderboard')
        .select('*')
        .eq('challenge_id', challengeId as number);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useChallengeAttempts(challengeId: number | undefined) {
  return useQuery({
    queryKey: ['challenge_attempts', challengeId],
    enabled: Boolean(challengeId),
    queryFn: async (): Promise<ChallengeAttemptWithNames[]> => {
      const { data, error } = await supabase
        .from('challenge_attempt')
        .select('id, player_id, opponent_id, score, result, played_at, profile:player_id(name), opponent:opponent_id(name)')
        .eq('challenge_id', challengeId as number)
        .order('played_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return (data ?? []) as unknown as ChallengeAttemptWithNames[];
    },
  });
}

export interface AddAttemptInput {
  challenge_id: number;
  player_id: string;
  opponent_id: string | null;
  score: number | null;
  result: ChallengeResult;
}

export function useAddChallengeAttempt() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddAttemptInput) => {
      const { error } = await supabase
        .from('challenge_attempt')
        .insert({ ...input, created_by: user!.id });
      if (error) throw error;
    },
    onSuccess: (_data, vars) => {
      queryClient.invalidateQueries({ queryKey: ['challenge_leaderboard', vars.challenge_id] });
      queryClient.invalidateQueries({ queryKey: ['challenge_attempts', vars.challenge_id] });
    },
  });
}
