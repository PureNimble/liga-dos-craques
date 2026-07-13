import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { Database } from '@/types/database';

export type GameRating = Database['public']['Views']['v_game_player_rating']['Row'];
export type GameAward = Database['public']['Views']['v_game_award']['Row'];

/** Avaliações (0–10) calculadas pela app para cada jogador do jogo. */
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

/** MVP/Flop apurado (melhor/pior rating; empate desfeito pela consistência). */
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

/**
 * Apura MVP/Flop (organizador) — apenas fecha o jogo; o apuramento é derivado
 * da vista v_game_award. Devolve o novo estado ('closed').
 */
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
