import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { Database } from '@/types/database';

export type XpRule = Database['public']['Tables']['xp_rule']['Row'];

/** Regras de XP atualmente ativas. */
export function useActiveXpRules() {
  return useQuery({
    queryKey: ['xp_rules_active'],
    queryFn: async (): Promise<XpRule[]> => {
      const { data, error } = await supabase
        .from('xp_rule')
        .select('*')
        .eq('active', true)
        .order('code');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useSetXpRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { code: string; points: number }) => {
      const { error } = await supabase.rpc('set_xp_rule', {
        p_code: input.code,
        p_points: input.points,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['xp_rules_active'] }),
  });
}

export function useRunBackfill() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('backfill_progression');
      if (error) throw error;
      return data?.[0] ?? { games_awarded: 0, players_evaluated: 0 };
    },
  });
}

export interface AdminMetrics {
  players: number;
  games: number;
}

/** Contagens para os cartões do dashboard (queries head+count, baratas). */
export function useAdminMetrics() {
  return useQuery({
    queryKey: ['admin_metrics'],
    queryFn: async (): Promise<AdminMetrics> => {
      const count = async (table: 'profile' | 'game') => {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        if (error) throw error;
        return count ?? 0;
      };
      const [players, games] = await Promise.all([count('profile'), count('game')]);
      return { players, games };
    },
    staleTime: 60_000,
  });
}

function invalidateGameStats(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: ['games'] });
  queryClient.invalidateQueries({ queryKey: ['admin_metrics'] });
  queryClient.invalidateQueries({ queryKey: ['admin_trends'] });
}

/** Admin: cancela um jogo (status → cancelled; reversível). */
export function useAdminCancelGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gameId: string) => {
      const { error } = await supabase
        .from('game')
        .update({ status: 'cancelled' })
        .eq('id', gameId);
      if (error) throw error;
    },
    onSuccess: () => invalidateGameStats(queryClient),
  });
}

/** Admin: devolve um jogo fechado à revisão (estorna a XP; reatribui ao fechar). */
export function useAdminReopenGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gameId: string) => {
      const { error } = await supabase.rpc('admin_reopen_game', { p_game_id: gameId });
      if (error) throw error;
    },
    onSuccess: (_data, gameId) => {
      invalidateGameStats(queryClient);
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
      queryClient.invalidateQueries({ queryKey: ['xp'] });
    },
  });
}

/** Admin: apaga um jogo (cascata em eventos/plantel). Bloqueado para 'closed'. */
export function useAdminDeleteGame() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gameId: string) => {
      const { error } = await supabase.from('game').delete().eq('id', gameId);
      if (error) throw error;
    },
    onSuccess: () => invalidateGameStats(queryClient),
  });
}

export interface MonthBucket {
  key: string;
  label: string;
  count: number;
}

/** Últimos `n` meses (mais antigo → atual) como baldes vazios. */
function emptyMonths(n: number): MonthBucket[] {
  const out: MonthBucket[] = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({
      key: `${d.getFullYear()}-${d.getMonth()}`,
      label: d.toLocaleDateString('pt-PT', { month: 'short' }),
      count: 0,
    });
  }
  return out;
}

/** Distribui timestamps ISO pelos baldes mensais (ignora o que cai fora da janela). */
function bucketByMonth(dates: string[], months: number): MonthBucket[] {
  const buckets = emptyMonths(months);
  const index = new Map(buckets.map((b, i) => [b.key, i]));
  for (const iso of dates) {
    const d = new Date(iso);
    const i = index.get(`${d.getFullYear()}-${d.getMonth()}`);
    if (i !== undefined) buckets[i].count += 1;
  }
  return buckets;
}

export interface AdminTrends {
  players: MonthBucket[];
  games: MonthBucket[];
}

/** Séries mensais (últimos 6 meses) para os gráficos do dashboard. */
export function useAdminTrends(months = 6) {
  return useQuery({
    queryKey: ['admin_trends', months],
    queryFn: async (): Promise<AdminTrends> => {
      const [players, games] = await Promise.all([
        supabase.from('profile').select('created_at'),
        supabase.from('game').select('scheduled_at'),
      ]);
      if (players.error) throw players.error;
      if (games.error) throw games.error;
      return {
        players: bucketByMonth(
          (players.data ?? []).map((r) => r.created_at),
          months,
        ),
        games: bucketByMonth(
          (games.data ?? []).map((r) => r.scheduled_at),
          months,
        ),
      };
    },
    staleTime: 60_000,
  });
}

export interface AdminPlayer {
  id: string;
  name: string;
  photo_url: string | null;
  role: string;
  main_position_id: number | null;
}

/** Lista completa de jogadores para gestão (inclui função e posição). */
export function useAdminPlayers() {
  return useQuery({
    queryKey: ['admin_players'],
    queryFn: async (): Promise<AdminPlayer[]> => {
      const { data, error } = await supabase
        .from('profile')
        .select('id, name, photo_url, role, main_position_id')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Admin promove/despromove um jogador (RPC security definer). */
export function useAdminSetRole() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { userId: string; role: 'player' | 'admin' }) => {
      const { error } = await supabase.rpc('admin_set_role', {
        p_user_id: input.userId,
        p_role: input.role,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin_players'] }),
  });
}

/** Golos por mês (soma dos resultados dos jogos com placar). */
export function useGoalsByMonth(months = 12) {
  return useQuery({
    queryKey: ['admin_goals_by_month', months],
    queryFn: async (): Promise<MonthBucket[]> => {
      const { data, error } = await supabase
        .from('game')
        .select('scheduled_at, team_a_score, team_b_score')
        .not('team_a_score', 'is', null)
        .not('team_b_score', 'is', null);
      if (error) throw error;
      const buckets = emptyMonths(months);
      const index = new Map(buckets.map((b, i) => [b.key, i]));
      for (const g of data ?? []) {
        const d = new Date(g.scheduled_at);
        const i = index.get(`${d.getFullYear()}-${d.getMonth()}`);
        if (i !== undefined) buckets[i].count += (g.team_a_score ?? 0) + (g.team_b_score ?? 0);
      }
      return buckets;
    },
    staleTime: 60_000,
  });
}

export interface CategoryCount {
  label: string;
  count: number;
}

/** Jogos por formato (para donut). */
export function useGamesByFormat() {
  return useQuery({
    queryKey: ['admin_games_by_format'],
    queryFn: async (): Promise<CategoryCount[]> => {
      const { data, error } = await supabase
        .from('game')
        .select('game_format(label, sort_order)')
        .neq('status', 'cancelled');
      if (error) throw error;
      const counts = new Map<string, { count: number; sort: number }>();
      for (const g of (data ?? []) as unknown as {
        game_format: { label: string; sort_order: number } | null;
      }[]) {
        const label = g.game_format?.label ?? 'Sem formato';
        const sort = g.game_format?.sort_order ?? 999;
        const cur = counts.get(label) ?? { count: 0, sort };
        cur.count += 1;
        counts.set(label, cur);
      }
      return [...counts.entries()]
        .sort((a, b) => a[1].sort - b[1].sort)
        .map(([label, v]) => ({ label, count: v.count }));
    },
    staleTime: 60_000,
  });
}

/** Jogos por dia da semana (2ª→dom). */
export function useGamesByWeekday() {
  return useQuery({
    queryKey: ['admin_games_by_weekday'],
    queryFn: async (): Promise<CategoryCount[]> => {
      const { data, error } = await supabase
        .from('game')
        .select('scheduled_at')
        .neq('status', 'cancelled');
      if (error) throw error;
      const labels = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
      const counts = new Array(7).fill(0);
      for (const g of data ?? []) {
        // getDay(): 0=domingo → mapear para índice 2ª=0 … dom=6
        const day = (new Date(g.scheduled_at).getDay() + 6) % 7;
        counts[day] += 1;
      }
      return labels.map((label, i) => ({ label, count: counts[i] }));
    },
    staleTime: 60_000,
  });
}

export function useAdminSetPassword() {
  return useMutation({
    mutationFn: async (input: { userId: string; password: string }) => {
      const { error } = await supabase.rpc('admin_set_password', {
        p_user_id: input.userId,
        p_password: input.password,
      });
      if (error) throw error;
    },
  });
}
