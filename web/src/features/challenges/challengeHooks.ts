import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/useAuth';
import type { ChallengeResult, ChallengeSessionStatus, Database } from '@/types/database';

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
        .select('id, player_id, turn_order, current_spot, profile:player_id(name, photo_url)')
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

/** Sessões recentes de um desafio (em curso primeiro). */
export function useChallengeSessions(challengeId: number | undefined) {
  return useQuery({
    queryKey: ['challenge_sessions', challengeId],
    enabled: Boolean(challengeId),
    queryFn: async (): Promise<ChallengeSession[]> => {
      const { data, error } = await supabase
        .from('challenge_session')
        .select('*')
        .eq('challenge_id', challengeId as number)
        .order('created_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useCreateCrossbarSession() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { challenge_id: number; spot_count: number }): Promise<string> => {
      const { data, error } = await supabase
        .from('challenge_session')
        .insert({ ...input, created_by: user!.id })
        .select('id')
        .single();
      if (error) throw error;
      return data.id;
    },
    onSuccess: (_id, vars) => {
      queryClient.invalidateQueries({ queryKey: ['challenge_sessions', vars.challenge_id] });
    },
  });
}

export function useAddSessionPlayer(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (playerId: string) => {
      const { error } = await supabase
        .from('session_player')
        .insert({ session_id: sessionId, player_id: playerId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crossbar_session_players', sessionId] });
    },
  });
}

export function useRemoveSessionPlayer(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sessionPlayerId: string) => {
      const { error } = await supabase.from('session_player').delete().eq('id', sessionPlayerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crossbar_session_players', sessionId] });
    },
  });
}

export function useStartCrossbarSession(sessionId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { error } = await supabase.rpc('crossbar_start_session', { p_session_id: sessionId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crossbar_session', sessionId] });
      queryClient.invalidateQueries({ queryKey: ['crossbar_session_players', sessionId] });
    },
  });
}

export function useRecordTurn(session: ChallengeSession) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (hit: boolean): Promise<ChallengeSessionStatus> => {
      const { data, error } = await supabase.rpc('crossbar_record_turn', {
        p_session_id: session.id,
        p_hit: hit,
      });
      if (error) throw error;
      return data as ChallengeSessionStatus;
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
