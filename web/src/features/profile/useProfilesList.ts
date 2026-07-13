import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';

export interface ProfileSummary {
  id: string;
  name: string;
  photo_url: string | null;
}

/** Lista resumida de todos os perfis — usada para escolher jogadores. */
export function useProfilesList() {
  return useQuery({
    queryKey: ['profiles_list'],
    queryFn: async (): Promise<ProfileSummary[]> => {
      const { data, error } = await supabase
        .from('profile')
        .select('id, name, photo_url')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 60_000,
  });
}
