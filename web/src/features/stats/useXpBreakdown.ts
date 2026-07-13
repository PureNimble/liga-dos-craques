import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';

export interface XpSource {
  code: string;
  label: string;
  points: number;
}

const LABELS: Record<string, string> = {
  participation: 'Participação',
  win: 'Vitória',
  goal: 'Golo',
  assist: 'Assistência',
  mvp: 'MVP',
};

/** Repartição do XP total do jogador por fonte (participação, vitória, golo, …). */
export function useXpBreakdown(playerId: string | undefined) {
  return useQuery({
    queryKey: ['xp_breakdown', playerId],
    enabled: Boolean(playerId),
    queryFn: async (): Promise<XpSource[]> => {
      const { data, error } = await supabase
        .from('xp_ledger')
        .select('source_code, points')
        .eq('player_id', playerId as string);
      if (error) throw error;

      const by = new Map<string, number>();
      for (const r of data ?? []) by.set(r.source_code, (by.get(r.source_code) ?? 0) + r.points);
      return [...by.entries()]
        .map(([code, points]) => ({ code, label: LABELS[code] ?? code, points }))
        .filter((x) => x.points > 0)
        .sort((a, b) => b.points - a.points);
    },
    staleTime: 60_000,
  });
}
