import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useActiveGroupId } from '@/features/groups/useActiveGroup';
import type { Database } from '@/types/database';

export type RankingOverall = Database['public']['Views']['v_ranking_overall']['Row'];
export type RankingByFormat = Database['public']['Views']['v_ranking_by_format']['Row'];
export type RankingByPeriod = Database['public']['Views']['v_ranking_by_period']['Row'];
export type RankingAnnual = Database['public']['Views']['v_ranking_annual']['Row'];

/** Ranking geral (e base para "por posição", filtrado no cliente) do grupo ativo. */
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

/** Ranking por formato (5v5, 7v7, …) do grupo ativo. */
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

/** Ranking mensal (ano + mês) do grupo ativo. */
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

/** Ranking anual (agregado por ano) do grupo ativo. */
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
