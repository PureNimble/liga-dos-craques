import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type PlayerStats = Database['public']['Views']['v_player_stats']['Row'];

const EMPTY: Omit<PlayerStats, 'player_id' | 'name'> = {
  games: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goals: 0,
  assists: 0,
  saves: 0,
  mvps: 0,
  flops: 0,
  avg_rating: null,
};

/** Estatísticas de um jogador (derivadas da vista v_player_stats). */
export function usePlayerStats(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player_stats', playerId],
    enabled: Boolean(playerId),
    queryFn: async (): Promise<PlayerStats> => {
      const { data, error } = await supabase
        .from('v_player_stats')
        .select('*')
        .eq('player_id', playerId as string)
        .maybeSingle();
      if (error) throw error;
      // Se ainda não houver linha (jogador sem jogos), devolve zeros.
      return data ?? { player_id: playerId as string, name: '', ...EMPTY };
    },
  });
}
