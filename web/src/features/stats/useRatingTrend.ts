import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface RatingPoint {
  gameId: string;
  date: string;
  rating: number;
  label: string;
}

/**
 * Avaliações dos últimos `limit` jogos do jogador, por ordem cronológica.
 * Junta a data (tabela game) às avaliações (vista v_game_player_rating).
 */
export function useRatingTrend(playerId: string | undefined, limit = 8) {
  return useQuery({
    queryKey: ['rating_trend', playerId, limit],
    enabled: Boolean(playerId),
    queryFn: async (): Promise<RatingPoint[]> => {
      const { data: ratings, error } = await supabase
        .from('v_game_player_rating')
        .select('game_id, rating')
        .eq('player_id', playerId as string);
      if (error) throw error;
      const rows = (ratings ?? []).filter((r) => r.rating != null);
      if (rows.length === 0) return [];

      const ids = rows.map((r) => r.game_id);
      const { data: games, error: gErr } = await supabase
        .from('game')
        .select('id, scheduled_at')
        .in('id', ids);
      if (gErr) throw gErr;

      const dateById = new Map((games ?? []).map((g) => [g.id, g.scheduled_at]));
      const ratingById = new Map(rows.map((r) => [r.game_id, r.rating as number]));

      const fmt = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit' });
      return ids
        .map((id) => ({ gameId: id, date: dateById.get(id) ?? '', rating: ratingById.get(id) as number }))
        .filter((p) => p.date)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-limit)
        .map((p) => ({ ...p, label: fmt.format(new Date(p.date)) }));
    },
    staleTime: 60_000,
  });
}
