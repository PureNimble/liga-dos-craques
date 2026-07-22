import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useActiveGroupId } from '@/features/groups/useActiveGroup';
import type { Database } from '@/types/database';

export type PlayerXp = Database['public']['Views']['v_player_xp']['Row'];

async function fetchPlayerXp(playerId: string, groupId: string): Promise<PlayerXp> {
  const { data, error } = await supabase
    .from('v_player_xp')
    .select('*')
    .eq('player_id', playerId)
    .eq('group_id', groupId)
    .maybeSingle();
  if (error) throw error;
  return (
    data ?? {
      player_id: playerId,
      group_id: groupId,
      total_xp: 0,
      level: 1,
      level_min_xp: 0,
      next_level_xp: 50,
    }
  );
}

/** XP total, nível e progresso de um jogador no grupo ativo (vista v_player_xp). */
export function usePlayerXp(playerId: string | undefined) {
  const groupId = useActiveGroupId();
  return useQuery({
    queryKey: ['player_xp', groupId, playerId],
    enabled: Boolean(playerId),
    queryFn: () => fetchPlayerXp(playerId as string, groupId),
  });
}

/** Variante Suspense: usar apenas quando o playerId já está garantidamente disponível. */
export function usePlayerXpSuspense(playerId: string) {
  const groupId = useActiveGroupId();
  return useSuspenseQuery({
    queryKey: ['player_xp', groupId, playerId],
    queryFn: () => fetchPlayerXp(playerId, groupId),
  });
}
