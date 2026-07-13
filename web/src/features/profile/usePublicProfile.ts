import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { PositionCategory, PreferredFoot } from '@/types/database';

export interface PublicProfile {
  id: string;
  name: string;
  photo_url: string | null;
  locality: string | null;
  preferred_foot: PreferredFoot | null;
  featured_achievement_id: number | null;
  main_position: { label: string; category: PositionCategory } | null;
}

/** Perfil público (campos não sensíveis) de um jogador qualquer. */
export function usePublicProfile(playerId: string | undefined) {
  return useQuery({
    queryKey: ['public_profile', playerId],
    enabled: Boolean(playerId),
    queryFn: async (): Promise<PublicProfile> => {
      const { data, error } = await supabase
        .from('profile')
        .select(
          'id, name, photo_url, locality, preferred_foot, featured_achievement_id, main_position:main_position_id(label, category)',
        )
        .eq('id', playerId as string)
        .single();
      if (error) throw error;
      return data as unknown as PublicProfile;
    },
  });
}
