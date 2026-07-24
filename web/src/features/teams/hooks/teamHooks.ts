import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import { useActiveGroupId } from '@/features/groups/hooks/useActiveGroup';
import type { PositionCategory, Team } from '@/types/database';
import { computeRating } from '../lib/playerRating';

/** A player's computed rating and position category. */
export interface PlayerRating {
  rating: number;
  category: PositionCategory | null;
}

/** Ratings for the given players, derived from their stats and position, as a Map of id to `{ rating, category }`. */
export function usePlayerRatings(playerIds: string[]) {
  const groupId = useActiveGroupId();
  const key = [...playerIds].sort().join(',');
  return useQuery({
    queryKey: ['player_ratings', groupId, key],
    enabled: playerIds.length > 0,
    queryFn: async (): Promise<Map<string, PlayerRating>> => {
      const [profilesRes, statsRes, positionsRes] = await Promise.all([
        supabase.from('profile').select('id, main_position_id').in('id', playerIds),
        supabase
          .from('v_player_stats')
          .select('*')
          .eq('group_id', groupId)
          .in('player_id', playerIds),
        supabase.from('position').select('id, category'),
      ]);
      if (profilesRes.error) throw profilesRes.error;
      if (statsRes.error) throw statsRes.error;
      if (positionsRes.error) throw positionsRes.error;

      const categoryById = new Map<number, PositionCategory>(
        (positionsRes.data ?? []).map((p) => [p.id, p.category]),
      );
      const statsById = new Map((statsRes.data ?? []).map((s) => [s.player_id, s]));

      const result = new Map<string, PlayerRating>();
      for (const profile of profilesRes.data ?? []) {
        const s = statsById.get(profile.id);
        const category = profile.main_position_id
          ? (categoryById.get(profile.main_position_id) ?? null)
          : null;
        const rating = computeRating({
          games: s?.games ?? 0,
          wins: s?.wins ?? 0,
          goals: s?.goals ?? 0,
          assists: s?.assists ?? 0,
          saves: s?.saves ?? 0,
          mvps: s?.mvps ?? 0,
          category,
          strengthDelta: s?.strength_delta ?? 0,
        });
        result.set(profile.id, { rating, category });
      }
      return result;
    },
    staleTime: 60_000,
  });
}

/** Persists the A/B team assignment and moves the game to "teams_generated". */
export function useAssignTeams(gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (assignment: { a: string[]; b: string[] }) => {
      if (assignment.a.length > 0) {
        const { error } = await supabase
          .from('game_player')
          .update({ team: 'A' })
          .eq('game_id', gameId)
          .in('player_id', assignment.a);
        if (error) throw error;
      }
      if (assignment.b.length > 0) {
        const { error } = await supabase
          .from('game_player')
          .update({ team: 'B' })
          .eq('game_id', gameId)
          .in('player_id', assignment.b);
        if (error) throw error;
      }
      const { error: gErr } = await supabase
        .from('game')
        .update({ status: 'teams_generated' })
        .eq('id', gameId)
        .in('status', ['scheduled', 'open', 'teams_generated']);
      if (gErr) throw gErr;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game_players', gameId] });
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
    },
  });
}

/** Persists a player's pitch position (`pos_x`/`pos_y` as percentages). */
export function useSetPlayerPosition(gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { playerId: string; x: number; y: number }) => {
      const { error } = await supabase
        .from('game_player')
        .update({ pos_x: Math.round(input.x), pos_y: Math.round(input.y) })
        .eq('game_id', gameId)
        .eq('player_id', input.playerId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['game_players', gameId] }),
  });
}

/** Auto-fills pitch positions (one write per player). */
export function useAutoFillPositions(gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (positions: { playerId: string; x: number; y: number }[]) => {
      await Promise.all(
        positions.map(({ playerId, x, y }) =>
          supabase
            .from('game_player')
            .update({ pos_x: Math.round(x), pos_y: Math.round(y) })
            .eq('game_id', gameId)
            .eq('player_id', playerId)
            .then(({ error }) => {
              if (error) throw error;
            }),
        ),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['game_players', gameId] }),
  });
}

/** Sets the starting lineup: starters (`on_field=true`, with position) and bench (`on_field=false`), one write per player. */
export function useAssignLineup(gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (rows: { playerId: string; on_field: boolean; x?: number; y?: number }[]) => {
      await Promise.all(
        rows.map((r) => {
          const patch: { on_field: boolean; pos_x?: number; pos_y?: number } = {
            on_field: r.on_field,
          };
          if (r.x != null && r.y != null) {
            patch.pos_x = Math.round(r.x);
            patch.pos_y = Math.round(r.y);
          }
          return supabase
            .from('game_player')
            .update(patch)
            .eq('game_id', gameId)
            .eq('player_id', r.playerId)
            .then(({ error }) => {
              if (error) throw error;
            });
        }),
      );
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['game_players', gameId] }),
  });
}

/** Substitution: the bench player (in) takes the starter's (out) position and pitch spot, and logs the substitution event. */
export function useSubstitute(gameId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      inId: string;
      outId: string;
      outName?: string;
      team: Team | null;
      minute: number | null;
    }) => {
      const { data: outRow, error: outErr } = await supabase
        .from('game_player')
        .select('pos_x, pos_y')
        .eq('game_id', gameId)
        .eq('player_id', input.outId)
        .single();
      if (outErr) throw outErr;

      const { error: inErr } = await supabase
        .from('game_player')
        .update({ on_field: true, pos_x: outRow?.pos_x ?? null, pos_y: outRow?.pos_y ?? null })
        .eq('game_id', gameId)
        .eq('player_id', input.inId);
      if (inErr) throw inErr;

      const { error: benchErr } = await supabase
        .from('game_player')
        .update({ on_field: false })
        .eq('game_id', gameId)
        .eq('player_id', input.outId);
      if (benchErr) throw benchErr;

      const { data: type } = await supabase
        .from('event_type')
        .select('id')
        .eq('code', 'substitution')
        .single();
      if (type) {
        const { error: evErr } = await supabase.from('event').insert({
          game_id: gameId,
          player_id: input.inId,
          event_type_id: type.id,
          minute: input.minute,
          team: input.team,
          meta: { out: input.outId, outName: input.outName ?? null },
          created_by: user!.id,
        });
        if (evErr) throw evErr;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game_players', gameId] });
      queryClient.invalidateQueries({ queryKey: ['events', gameId] });
    },
  });
}

/** Manually moves a player to a team (or unassigns with null). */
export function useSetPlayerTeam(gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { playerId: string; team: Team | null }) => {
      const { error } = await supabase
        .from('game_player')
        .update({ team: input.team })
        .eq('game_id', gameId)
        .eq('player_id', input.playerId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['game_players', gameId] }),
  });
}
