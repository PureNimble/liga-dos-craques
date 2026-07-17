import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { Database } from '@/types/database';

export type PlayerStats = Database['public']['Views']['v_player_stats']['Row'];

const EMPTY: Omit<PlayerStats, 'player_id' | 'name'> = {
  games: 0,
  wins: 0,
  draws: 0,
  losses: 0,
  goals: 0,
  assists: 0,
  saves: 0,
  mvps: 0,
  flops: 0,
  avg_rating: null,
};

async function fetchPlayerStats(playerId: string): Promise<PlayerStats> {
  const { data, error } = await supabase
    .from('v_player_stats')
    .select('*')
    .eq('player_id', playerId)
    .maybeSingle();
  if (error) throw error;
  // Se ainda não houver linha (jogador sem jogos), devolve zeros.
  return data ?? { player_id: playerId, name: '', ...EMPTY };
}

/** Estatísticas de um jogador (derivadas da vista v_player_stats). */
export function usePlayerStats(playerId: string | undefined) {
  return useQuery({
    queryKey: ['player_stats', playerId],
    enabled: Boolean(playerId),
    queryFn: () => fetchPlayerStats(playerId as string),
  });
}

/** Variante Suspense: usar apenas quando o playerId já está garantidamente disponível. */
export function usePlayerStatsSuspense(playerId: string) {
  return useSuspenseQuery({
    queryKey: ['player_stats', playerId],
    queryFn: () => fetchPlayerStats(playerId),
  });
}

export interface GameContribution {
  gameId: string;
  label: string;
  goals: number;
  assists: number;
}

const GOAL_CODES = new Set(['goal', 'penalty_scored', 'freekick_scored']);
const DONE = ['finished', 'voting_open', 'closed'];

/**
 * Quantos jogos entram nos gráficos. Único para TODOS os gráficos — com mais do
 * que isto os eixos amontoam-se em cartões estreitos (o perfil põe-nos a par).
 */
export const CHART_GAMES = 5;

/** Golos e assistências por jogo (últimos `limit` jogos concluídos). */
export function useContributions(playerId: string | undefined, limit = CHART_GAMES) {
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
export function useRatingTrend(playerId: string | undefined, limit = CHART_GAMES) {
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

export interface XpSource {
  code: string;
  label: string;
  points: number;
}

const XP_LABELS: Record<string, string> = {
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
        .map(([code, points]) => ({ code, label: XP_LABELS[code] ?? code, points }))
        .filter((x) => x.points > 0)
        .sort((a, b) => b.points - a.points);
    },
    staleTime: 60_000,
  });
}
