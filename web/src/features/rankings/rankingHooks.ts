import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { Database } from '@/types/database';

export type RankingOverall = Database['public']['Views']['v_ranking_overall']['Row'];
export type RankingByFormat = Database['public']['Views']['v_ranking_by_format']['Row'];
export type RankingByPeriod = Database['public']['Views']['v_ranking_by_period']['Row'];
export type RankingAnnual = Database['public']['Views']['v_ranking_annual']['Row'];

/** Ranking geral (e base para "por posição", filtrado no cliente). */
export function useRankingOverall() {
  return useQuery({
    queryKey: ['ranking_overall'],
    queryFn: async (): Promise<RankingOverall[]> => {
      const { data, error } = await supabase
        .from('v_ranking_overall')
        .select('*')
        .gt('games', 0)
        .order('total_xp', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Ranking por formato (5v5, 7v7, …). */
export function useRankingByFormat(formatCode: string | undefined) {
  return useQuery({
    queryKey: ['ranking_format', formatCode],
    enabled: Boolean(formatCode),
    queryFn: async (): Promise<RankingByFormat[]> => {
      const { data, error } = await supabase
        .from('v_ranking_by_format')
        .select('*')
        .eq('format_code', formatCode as string)
        .order('points', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Ranking mensal (ano + mês). */
export function useRankingByPeriod(year: number, month: number | undefined) {
  return useQuery({
    queryKey: ['ranking_period', year, month],
    enabled: Boolean(month),
    queryFn: async (): Promise<RankingByPeriod[]> => {
      const { data, error } = await supabase
        .from('v_ranking_by_period')
        .select('*')
        .eq('year', year)
        .eq('month', month as number);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Ranking anual (agregado por ano). */
export function useRankingAnnual(year: number, enabled: boolean) {
  return useQuery({
    queryKey: ['ranking_annual', year],
    enabled,
    queryFn: async (): Promise<RankingAnnual[]> => {
      const { data, error } = await supabase.from('v_ranking_annual').select('*').eq('year', year);
      if (error) throw error;
      return data ?? [];
    },
  });
}
