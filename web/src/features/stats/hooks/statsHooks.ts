import { useQuery, useSuspenseQuery } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useActiveGroupId } from '@/features/groups/hooks/useActiveGroup';
import type { Database } from '@/types/database';

export type PlayerStats = Database['public']['Views']['v_player_stats']['Row'];

/** Nº mínimo de jogos para desbloquear a nota média e os gráficos. */
export const MIN_GAMES_FOR_STATS = 5;

/** Mensagem do estado bloqueado — no próprio perfil convida a jogar; nos outros, informa. */
export function statsLockMessage(t: (key: string, vars?: Record<string, string | number>) => string, own: boolean): string {
  return t(own ? 'stats.lock.own' : 'stats.lock.other', { count: MIN_GAMES_FOR_STATS });
}

const EMPTY: Omit<PlayerStats, 'player_id' | 'group_id' | 'name'> = {
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
  strength_delta: null,
};

async function fetchPlayerStats(playerId: string, groupId: string): Promise<PlayerStats> {
  const { data, error } = await supabase
    .from('v_player_stats')
    .select('*')
    .eq('player_id', playerId)
    .eq('group_id', groupId)
    .maybeSingle();
  if (error) throw error;
  // Se ainda não houver linha (jogador sem jogos neste grupo), devolve zeros.
  return data ?? { player_id: playerId, group_id: groupId, name: '', ...EMPTY };
}

/** Estatísticas de um jogador no grupo ativo (derivadas da vista v_player_stats). */
export function usePlayerStats(playerId: string | undefined) {
  const groupId = useActiveGroupId();
  return useQuery({
    queryKey: ['player_stats', groupId, playerId],
    enabled: Boolean(playerId),
    queryFn: () => fetchPlayerStats(playerId as string, groupId),
  });
}

/** Variante Suspense: usar apenas quando o playerId já está garantidamente disponível. */
export function usePlayerStatsSuspense(playerId: string) {
  const groupId = useActiveGroupId();
  return useSuspenseQuery({
    queryKey: ['player_stats', groupId, playerId],
    queryFn: () => fetchPlayerStats(playerId, groupId),
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

/** Golos e assistências por jogo (últimos `limit` jogos concluídos) no grupo ativo. */
export function useContributions(playerId: string | undefined, limit = CHART_GAMES) {
  const groupId = useActiveGroupId();
  return useQuery({
    queryKey: ['contributions', groupId, playerId, limit],
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
        .select('id, scheduled_at, status, group_id')
        .eq('group_id', groupId)
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
        .map((x) => ({
          gameId: x.gameId,
          label: fmt.format(new Date(x.date)),
          goals: x.goals,
          assists: x.assists,
        }));
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
 * Avaliações dos últimos `limit` jogos do jogador no grupo ativo, por ordem
 * cronológica. Junta a data (tabela game) às avaliações (vista v_game_player_rating).
 */
export function useRatingTrend(playerId: string | undefined, limit = CHART_GAMES) {
  const groupId = useActiveGroupId();
  return useQuery({
    queryKey: ['rating_trend', groupId, playerId, limit],
    enabled: Boolean(playerId),
    queryFn: async (): Promise<RatingPoint[]> => {
      const { data: ratings, error } = await supabase
        .from('v_game_player_rating')
        .select('game_id, rating')
        .eq('player_id', playerId as string)
        .eq('group_id', groupId);
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
        .map((id) => ({
          gameId: id,
          date: dateById.get(id) ?? '',
          rating: ratingById.get(id) as number,
        }))
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
  group_id: string;
  game_format: { label: string } | null;
}

/** Últimos `limit` jogos do jogador no grupo ativo: data, formato, resultado e avaliação. */
export function useRecentGames(playerId: string | undefined, limit = 6) {
  const groupId = useActiveGroupId();
  return useQuery({
    queryKey: ['recent_games', groupId, playerId, limit],
    enabled: Boolean(playerId),
    queryFn: async (): Promise<RecentGame[]> => {
      const { data: gps, error } = await supabase
        .from('game_player')
        .select(
          'team, game:game_id(id, scheduled_at, team_a_score, team_b_score, status, group_id, game_format(label))',
        )
        .eq('player_id', playerId as string);
      if (error) throw error;

      const { data: ratings } = await supabase
        .from('v_game_player_rating')
        .select('game_id, rating')
        .eq('player_id', playerId as string)
        .eq('group_id', groupId);
      const ratingById = new Map((ratings ?? []).map((r) => [r.game_id, r.rating]));

      const fmt = new Intl.DateTimeFormat('pt-PT', { day: '2-digit', month: '2-digit' });
      const rows: RecentGame[] = [];
      for (const gp of gps ?? []) {
        const g = gp.game as unknown as EmbeddedGame | null;
        if (!g || !DONE.includes(g.status) || g.group_id !== groupId) continue;
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

/** Repartição do XP total do jogador no grupo ativo por fonte (participação, vitória, golo, …). */
export function useXpBreakdown(playerId: string | undefined) {
  const groupId = useActiveGroupId();
  return useQuery({
    queryKey: ['xp_breakdown', groupId, playerId],
    enabled: Boolean(playerId),
    queryFn: async (): Promise<XpSource[]> => {
      const { data, error } = await supabase
        .from('xp_ledger')
        .select('source_code, points')
        .eq('player_id', playerId as string)
        .eq('group_id', groupId);
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
