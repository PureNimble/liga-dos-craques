import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type PlayerXp = Database['public']['Views']['v_player_xp']['Row'];

/** XP total, nível e progresso de um jogador (vista v_player_xp). */
export function usePlayerXp(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player_xp', playerId],
    enabled: Boolean(playerId),
    queryFn: async (): Promise<PlayerXp> => {
      const { data, error } = await supabase
        .from('v_player_xp')
        .select('*')
        .eq('player_id', playerId as string)
        .maybeSingle();
      if (error) throw error;
      return (
        data ?? {
          player_id: playerId as string,
          total_xp: 0,
          level: 1,
          level_min_xp: 0,
          next_level_xp: 50,
        }
      );
    },
  });
}
