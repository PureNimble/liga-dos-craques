import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/types/database';

export type RankingOverall = Database['public']['Views']['v_ranking_overall']['Row'];
export type RankingByFormat = Database['public']['Views']['v_ranking_by_format']['Row'];
export type RankingByPeriod = Database['public']['Views']['v_ranking_by_period']['Row'];

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

/** Ranking por período. Passa year (obrigatório) e month (mensal) ou omite (anual). */
export function useRankingByPeriod(year: number, month?: number) {
  return useQuery({
    queryKey: ['ranking_period', year, month ?? 'all'],
    queryFn: async (): Promise<RankingByPeriod[]> => {
      let query = supabase.from('v_ranking_by_period').select('*').eq('year', year);
      if (month) query = query.eq('month', month);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
  });
}
