import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useActiveGroupId } from '@/features/groups/hooks/useActiveGroup';
import type { Database } from '@/types/database';

/** Row of the v_player_xp view: total XP, level and progress for a player. */
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

/** Total XP, level and progress for a player in the active group. */
export function usePlayerXp(playerId: string | undefined) {
  const groupId = useActiveGroupId();
  return useQuery({
    queryKey: ['player_xp', groupId, playerId],
    enabled: Boolean(playerId),
    queryFn: () => fetchPlayerXp(playerId as string, groupId),
  });
}

/** Suspense variant of usePlayerXp; use only once playerId is guaranteed available. */
export function usePlayerXpSuspense(playerId: string) {
  const groupId = useActiveGroupId();
  return useSuspenseQuery({
    queryKey: ['player_xp', groupId, playerId],
    queryFn: () => fetchPlayerXp(playerId, groupId),
  });
}
