import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/useAuth';
import type { ChallengeResult, CrossbarTurnStatus, Database } from '@/types/database';

export interface RecordTurnResult {
  status: CrossbarTurnStatus;
  winner_id: string | null;
}

export type Challenge = Database['public']['Tables']['challenge']['Row'];
export type ChallengeLeaderboardRow = Database['public']['Views']['v_challenge_leaderboard']['Row'];
export type ChallengeSession = Database['public']['Tables']['challenge_session']['Row'];

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

// -----------------------------------------------------------------------------
// Sessões ao vivo (Crossbar)
// -----------------------------------------------------------------------------

export interface SessionPlayerWithProfile {
  id: string;
  player_id: string;
  turn_order: number;
  current_spot: number;
  eliminated: boolean;
  sd_shot: boolean;
  sd_hit: boolean;
  profile: { name: string; photo_url: string | null } | null;
}

export interface SessionTurnRow {
  id: string;
  player_id: string;
  spot_index: number;
  hit: boolean;
  turn_no: number;
  profile: { name: string } | null;
}

/** Sessão + jogadores, com refetch frequente para acompanhar o jogo ao vivo. */
export function useCrossbarSession(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['crossbar_session', sessionId],
    enabled: Boolean(sessionId),
    queryFn: async (): Promise<ChallengeSession | null> => {
      const { data, error } = await supabase
        .from('challenge_session')
        .select('*')
        .eq('id', sessionId as string)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useSessionPlayers(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['crossbar_session_players', sessionId],
    enabled: Boolean(sessionId),
    queryFn: async (): Promise<SessionPlayerWithProfile[]> => {
      const { data, error } = await supabase
        .from('session_player')
        .select(
          'id, player_id, turn_order, current_spot, eliminated, sd_shot, sd_hit, profile:player_id(name, photo_url)',
        )
        .eq('session_id', sessionId as string)
        .order('turn_order');
      if (error) throw error;
      return (data ?? []) as unknown as SessionPlayerWithProfile[];
    },
  });
}

export function useSessionTurns(sessionId: string | undefined) {
  return useQuery({
    queryKey: ['crossbar_session_turns', sessionId],
    enabled: Boolean(sessionId),
    queryFn: async (): Promise<SessionTurnRow[]> => {
      const { data, error } = await supabase
        .from('session_turn')
        .select('id, player_id, spot_index, hit, turn_no, profile:player_id(name)')
        .eq('session_id', sessionId as string)
        .order('turn_no', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as SessionTurnRow[];
    },
  });
}

export interface ChallengeSessionWithCount extends ChallengeSession {
  player_count: number;
}

/** Sessões a decorrer de um desafio (mais recentes primeiro), com nº de jogadores. */
export function useChallengeSessions(challengeId: number | undefined) {
  return useQuery({
    queryKey: ['challenge_sessions', challengeId],
    enabled: Boolean(challengeId),
    queryFn: async (): Promise<ChallengeSessionWithCount[]> => {
      const { data, error } = await supabase
        .from('challenge_session')
        .select('*, session_player(count)')
        .eq('challenge_id', challengeId as number)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data ?? []).map((row) => {
        const { session_player, ...rest } = row as unknown as ChallengeSession & {
          session_player: { count: number }[];
        };
        return { ...rest, player_count: session_player?.[0]?.count ?? 0 };
      });
    },
  });
}

export function useDeleteSession(challengeId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from('challenge_session').delete().eq('id', sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenge_sessions', challengeId] });
    },
  });
}

/** Cria a sessão já a decorrer (setup é client-side) e devolve o id. */
export function useCreateAndStart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      challenge_id: number;
      spot_count: number;
      player_ids: string[];
      max_rounds: number | null;
    }): Promise<string> => {
      const { data, error } = await supabase.rpc('crossbar_create_and_start', {
        p_challenge_id: input.challenge_id,
        p_spot_count: input.spot_count,
        p_player_ids: input.player_ids,
        p_max_rounds: input.max_rounds,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: (_id, vars) => {
      queryClient.invalidateQueries({ queryKey: ['challenge_sessions', vars.challenge_id] });
    },
  });
}

export function useRecordTurn(session: ChallengeSession) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (hit: boolean): Promise<RecordTurnResult> => {
      const { data, error } = await supabase.rpc('crossbar_record_turn', {
        p_session_id: session.id,
        p_hit: hit,
      });
      if (error) throw error;
      return data as RecordTurnResult;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crossbar_session', session.id] });
      queryClient.invalidateQueries({ queryKey: ['crossbar_session_players', session.id] });
      queryClient.invalidateQueries({ queryKey: ['crossbar_session_turns', session.id] });
      queryClient.invalidateQueries({ queryKey: ['challenge_sessions', session.challenge_id] });
      queryClient.invalidateQueries({ queryKey: ['challenge_leaderboard', session.challenge_id] });
      queryClient.invalidateQueries({ queryKey: ['challenge_attempts', session.challenge_id] });
    },
  });
}
