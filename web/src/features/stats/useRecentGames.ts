import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type MatchResult = 'V' | 'E' | 'D';

export interface RecentGame {
  gameId: string;
  date: string;
  label: string;
  rating: number | null;
  result: MatchResult | null;
  scoreFor: number | null;
  scoreAgainst: number | null;
  formatLabel: string;
}

interface EmbeddedGame {
  id: string;
  scheduled_at: string;
  team_a_score: number | null;
  team_b_score: number | null;
  status: string;
  game_format: { label: string } | null;
}

const DONE = ['finished', 'voting_open', 'closed'];

/** Últimos `limit` jogos do jogador: data, formato, resultado e avaliação. */
export function useRecentGames(playerId: string | undefined, limit = 6) {
  return useQuery({
    queryKey: ['recent_games', playerId, limit],
    enabled: Boolean(playerId),
    queryFn: async (): Promise<RecentGame[]> => {
      const { data: gps, error } = await supabase
        .from('game_player')
        .select('team, game:game_id(id, scheduled_at, team_a_score, team_b_score, status, game_format(label))')
        .eq('player_id', playerId as string);
      if (error) throw error;

      const { data: ratings } = await supabase
        .from('v_game_player_rating')
        .select('game_id, rating')
        .eq('player_id', playerId as string);
      const ratingById = new Map((ratings ?? []).map((r) => [r.game_id, r.rating]));

      const fmt = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit' });
      const rows: RecentGame[] = [];
      for (const gp of gps ?? []) {
        const g = gp.game as unknown as EmbeddedGame | null;
        if (!g || !DONE.includes(g.status)) continue;
        const a = g.team_a_score;
        const b = g.team_b_score;
        let result: MatchResult | null = null;
        let scoreFor: number | null = null;
        let scoreAgainst: number | null = null;
        if (a != null && b != null && gp.team) {
          scoreFor = gp.team === 'A' ? a : b;
          scoreAgainst = gp.team === 'A' ? b : a;
          result = scoreFor > scoreAgainst ? 'V' : scoreFor < scoreAgainst ? 'D' : 'E';
        }
        rows.push({
          gameId: g.id,
          date: g.scheduled_at,
          label: fmt.format(new Date(g.scheduled_at)),
          rating: ratingById.get(g.id) ?? null,
          result,
          scoreFor,
          scoreAgainst,
          formatLabel: g.game_format?.label ?? '',
        });
      }
      return rows.sort((x, y) => y.date.localeCompare(x.date)).slice(0, limit);
    },
    staleTime: 60_000,
  });
}
