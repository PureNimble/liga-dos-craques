import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';

export interface GameContribution {
  gameId: string;
  label: string;
  goals: number;
  assists: number;
}

const GOAL_CODES = new Set(['goal', 'penalty_scored', 'freekick_scored']);
const DONE = ['finished', 'voting_open', 'closed'];

/** Golos e assistências por jogo (últimos `limit` jogos concluídos). */
export function useContributions(playerId: string | undefined, limit = 8) {
  return useQuery({
    queryKey: ['contributions', playerId, limit],
    enabled: Boolean(playerId),
    queryFn: async (): Promise<GameContribution[]> => {
      const { data: evs, error } = await supabase
        .from('event')
        .select('game_id, event_type(code)')
        .eq('player_id', playerId as string);
      if (error) throw error;

      const byGame = new Map<string, { goals: number; assists: number }>();
      for (const e of evs ?? []) {
        const code = (e.event_type as { code?: string } | null)?.code;
        const g = byGame.get(e.game_id) ?? { goals: 0, assists: 0 };
        if (code && GOAL_CODES.has(code)) g.goals++;
        else if (code === 'assist') g.assists++;
        byGame.set(e.game_id, g);
      }
      const ids = [...byGame.keys()];
      if (ids.length === 0) return [];

      const { data: games, error: gErr } = await supabase
        .from('game')
        .select('id, scheduled_at, status')
        .in('id', ids);
      if (gErr) throw gErr;

      const dateById = new Map(
        (games ?? []).filter((g) => DONE.includes(g.status)).map((g) => [g.id, g.scheduled_at]),
      );
      const fmt = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit' });
      return ids
        .filter((id) => dateById.has(id))
        .map((id) => ({ gameId: id, date: dateById.get(id) as string, ...byGame.get(id)! }))
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-limit)
        .map((x) => ({ gameId: x.gameId, label: fmt.format(new Date(x.date)), goals: x.goals, assists: x.assists }));
    },
    staleTime: 60_000,
  });
}
