import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { Database } from '@/types/database';

export type XpRule = Database['public']['Tables']['xp_rule']['Row'];

/** Regras de XP atualmente ativas. */
export function useActiveXpRules() {
  return useQuery({
    queryKey: ['xp_rules_active'],
    queryFn: async (): Promise<XpRule[]> => {
      const { data, error } = await supabase
        .from('xp_rule')
        .select('*')
        .eq('active', true)
        .order('code');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSetXpRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { code: string; points: number }) => {
      const { error } = await supabase.rpc('set_xp_rule', {
        p_code: input.code,
        p_points: input.points,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['xp_rules_active'] }),
  });
}

export function useRunBackfill() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('backfill_progression');
      if (error) throw error;
      return data?.[0] ?? { games_awarded: 0, players_evaluated: 0 };
    },
  });
}

export function useAdminSetPassword() {
  return useMutation({
    mutationFn: async (input: { userId: string; password: string }) => {
      const { error } = await supabase.rpc('admin_set_password', {
        p_user_id: input.userId,
        p_password: input.password,
      });
      if (error) throw error;
    },
  });
}
