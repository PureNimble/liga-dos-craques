import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useActiveGroupId } from '@/features/groups/hooks/useActiveGroup';
import type { Database } from '@/types/database';

/** Row type for the overall ranking view. */
export type RankingOverall = Database['public']['Views']['v_ranking_overall']['Row'];
/** Row type for the by-format ranking view. */
export type RankingByFormat = Database['public']['Views']['v_ranking_by_format']['Row'];
/** Row type for the by-period (monthly) ranking view. */
export type RankingByPeriod = Database['public']['Views']['v_ranking_by_period']['Row'];
/** Row type for the annual ranking view. */
export type RankingAnnual = Database['public']['Views']['v_ranking_annual']['Row'];

/** Fetches the overall ranking (also the base for the by-position view) for the active group. */
export function useRankingOverall() {
  const groupId = useActiveGroupId();
  return useQuery({
    queryKey: ['ranking_overall', groupId],
    queryFn: async (): Promise<RankingOverall[]> => {
      const { data, error } = await supabase
        .from('v_ranking_overall')
        .select('*')
        .eq('group_id', groupId)
        .gt('games', 0)
        .order('total_xp', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Fetches the ranking by game format (5v5, 7v7, ...) for the active group. */
export function useRankingByFormat(formatCode: string | undefined) {
  const groupId = useActiveGroupId();
  return useQuery({
    queryKey: ['ranking_format', groupId, formatCode],
    enabled: Boolean(formatCode),
    queryFn: async (): Promise<RankingByFormat[]> => {
      const { data, error } = await supabase
        .from('v_ranking_by_format')
        .select('*')
        .eq('group_id', groupId)
        .eq('format_code', formatCode as string)
        .order('points', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Fetches the monthly ranking (year + month) for the active group. */
export function useRankingByPeriod(year: number, month: number | undefined) {
  const groupId = useActiveGroupId();
  return useQuery({
    queryKey: ['ranking_period', groupId, year, month],
    enabled: Boolean(month),
    queryFn: async (): Promise<RankingByPeriod[]> => {
      const { data, error } = await supabase
        .from('v_ranking_by_period')
        .select('*')
        .eq('group_id', groupId)
        .eq('year', year)
        .eq('month', month as number);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Fetches the annual ranking (aggregated by year) for the active group. */
export function useRankingAnnual(year: number, enabled: boolean) {
  const groupId = useActiveGroupId();
  return useQuery({
    queryKey: ['ranking_annual', groupId, year],
    enabled,
    queryFn: async (): Promise<RankingAnnual[]> => {
      const { data, error } = await supabase
        .from('v_ranking_annual')
        .select('*')
        .eq('group_id', groupId)
        .eq('year', year);
      if (error) throw error;
      return data ?? [];
    },
  });
}
