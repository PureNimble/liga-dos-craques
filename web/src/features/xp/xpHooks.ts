import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { Database } from '@/types/database';

export type PlayerXp = Database['public']['Views']['v_player_xp']['Row'];

async function fetchPlayerXp(playerId: string): Promise<PlayerXp> {
  const { data, error } = await supabase
    .from('v_player_xp')
    .select('*')
    .eq('player_id', playerId)
    .maybeSingle();
  if (error) throw error;
  return (
    data ?? {
      player_id: playerId,
      total_xp: 0,
      level: 1,
      level_min_xp: 0,
      next_level_xp: 50,
    }
  );
}

/** XP total, nível e progresso de um jogador (vista v_player_xp). */
export function usePlayerXp(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player_xp', playerId],
    enabled: Boolean(playerId),
    queryFn: () => fetchPlayerXp(playerId as string),
  });
}

/** Variante Suspense: usar apenas quando o playerId já está garantidamente disponível. */
export function usePlayerXpSuspense(playerId: string) {
  return useSuspenseQuery({
    queryKey: ['player_xp', playerId],
    queryFn: () => fetchPlayerXp(playerId),
  });
}
