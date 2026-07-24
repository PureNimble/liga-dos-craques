import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { Database } from '@/types/database';

/** Row of the v_game_player_rating view: a player's rating for a given game. */
export type GameRating = Database['public']['Views']['v_game_player_rating']['Row'];
/** Row of the v_game_award view: a resolved MVP/Flop award for a given game. */
export type GameAward = Database['public']['Views']['v_game_award']['Row'];

/** Ratings (0-10) computed by the app for each player in the game. */
export function useGameRatings(gameId: string | undefined) {
  return useQuery({
    queryKey: ['game_ratings', gameId],
    enabled: Boolean(gameId),
    queryFn: async (): Promise<GameRating[]> => {
      const { data, error } = await supabase
        .from('v_game_player_rating')
        .select('*')
        .eq('game_id', gameId as string);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Resolved MVP/Flop for the game (best/worst rating, ties broken by consistency). */
export function useGameAwards(gameId: string | undefined) {
  return useQuery({
    queryKey: ['game_awards', gameId],
    enabled: Boolean(gameId),
    queryFn: async (): Promise<GameAward[]> => {
      const { data, error } = await supabase
        .from('v_game_award')
        .select('*')
        .eq('game_id', gameId as string);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Closes the game (organizer only); MVP/Flop is derived from the v_game_award view. */
export function useResolveAwards(gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<string> => {
      const { data, error } = await supabase.rpc('resolve_awards', { p_game_id: gameId });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
      queryClient.invalidateQueries({ queryKey: ['game_awards', gameId] });
    },
  });
}
