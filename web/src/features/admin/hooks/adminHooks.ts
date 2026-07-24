import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import type { Database } from '@/types/database';

/** Row shape of the `xp_rule` table. */
export type XpRule = Database['public']['Tables']['xp_rule']['Row'];

/** Fetches the currently active XP rules. */
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

/** Updates the point value of an XP rule. */
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

/** Runs the progression backfill RPC (XP + achievements) for closed games. */
export function useRunBackfill() {
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc('backfill_progression');
      if (error) throw error;
      return data?.[0] ?? { games_awarded: 0, players_evaluated: 0 };
    },
  });
}

/** Player and game counts shown on the dashboard tiles. */
export interface AdminMetrics {
  players: number;
  games: number;
}

/** Fetches cheap head+count totals for the dashboard tiles. */
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

/** Admin: cancels a game (status -> cancelled; reversible). */
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

/** Admin: sends a closed game back to review (reverts XP; reassigned on closing again). */
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

/** Admin: deletes a game (cascades to events/squad). Blocked for 'closed' games. */
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

/** A single month's bucket: internal key, display label, and a count. */
export interface MonthBucket {
  key: string;
  label: string;
  count: number;
}

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

/** Monthly player and game series for the dashboard charts. */
export interface AdminTrends {
  players: MonthBucket[];
  games: MonthBucket[];
}

/** Fetches monthly series (default: last 6 months) for the dashboard charts. */
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

/** Player row for admin management, including role and position. */
export interface AdminPlayer {
  id: string;
  name: string;
  photo_url: string | null;
  role: string;
  main_position_id: number | null;
}

/** Fetches the full player list for admin management. */
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

/** Admin promotes/demotes a player's role (security-definer RPC). */
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

/** Goals per month, summed from games with a final score. */
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

/** A label with its count, for category charts. */
export interface CategoryCount {
  label: string;
  count: number;
}

/** Fetches game counts grouped by format, for the donut chart. */
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

/** Fetches game counts grouped by weekday (Mon-Sun). */
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
        const day = (new Date(g.scheduled_at).getDay() + 6) % 7;
        counts[day] += 1;
      }
      return labels.map((label, i) => ({ label, count: counts[i] }));
    },
    staleTime: 60_000,
  });
}

/** Admin sets a player's password directly (no email flow required). */
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
