import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Database, Team } from '@/types/database';

/** Row type for a configured event type (goal, save, substitution, etc). */
export type EventType = Database['public']['Tables']['event_type']['Row'];
/** Row type for a technique tag attachable to an event. */
export type Tag = Database['public']['Tables']['tag']['Row'];
/** Row type for a logged game event. */
export type GameEvent = Database['public']['Tables']['event']['Row'];

/** Event row with its type, player profile, and tags embedded. */
export interface EventWithDetails extends GameEvent {
  event_type: Pick<EventType, 'code' | 'label' | 'supports_tags' | 'affects_score'> | null;
  profile: { id: string; name: string } | null;
  event_tag: { tag: Pick<Tag, 'code' | 'label'> | null }[];
}

/** Fetches the active, orderable list of event types. */
export function useEventTypes() {
  return useQuery({
    queryKey: ['event_types'],
    queryFn: async (): Promise<EventType[]> => {
      const { data, error } = await supabase
        .from('event_type')
        .select('*')
        .eq('active', true)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: Infinity,
  });
}

/** Fetches the list of technique tags. */
export function useTags() {
  return useQuery({
    queryKey: ['tags'],
    queryFn: async (): Promise<Tag[]> => {
      const { data, error } = await supabase.from('tag').select('*').order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: Infinity,
  });
}

/** Fetches all events for a game, with type, profile, and tags embedded. */
export function useGameEvents(gameId: string | undefined) {
  return useQuery({
    queryKey: ['events', gameId],
    enabled: Boolean(gameId),
    queryFn: async (): Promise<EventWithDetails[]> => {
      const { data, error } = await supabase
        .from('event')
        .select(
          '*, event_type(code, label, supports_tags, affects_score), profile:player_id(id, name), event_tag(tag(code, label))',
        )
        .eq('game_id', gameId as string)
        .order('minute', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as EventWithDetails[];
    },
  });
}

async function recomputeGameScore(gameId: string) {
  const { data, error } = await supabase
    .from('event')
    .select('team, event_type!inner(affects_score)')
    .eq('game_id', gameId)
    .eq('event_type.affects_score', true);
  if (error) throw error;

  const rows = (data ?? []) as unknown as { team: Team | null }[];
  const team_a_score = rows.filter((r) => r.team === 'A').length;
  const team_b_score = rows.filter((r) => r.team === 'B').length;

  const { error: upErr } = await supabase
    .from('game')
    .update({ team_a_score, team_b_score })
    .eq('id', gameId);
  if (upErr) throw upErr;
}

/** Input for logging a simple event (save, missed penalty, etc). */
export interface AddEventInput {
  player_id: string;
  event_type_id: number;
  minute: number | null;
  team: Team | null;
  tagIds: number[];
}

/** Kind of goal being logged. */
export type GoalVariant = 'normal' | 'penalty' | 'freekick' | 'own_goal';

/** Input for logging a goal, with optional assist and technique tags. */
export interface LogGoalInput {
  scorerId: string;
  assistId: string | null;
  variant: GoalVariant;
  team: Team | null;
  minute: number | null;
  tagIds: number[];
}

/** Logs a simple event and its tags, then recomputes the game score. */
export function useAddEvent(gameId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: AddEventInput) => {
      const { data: event, error } = await supabase
        .from('event')
        .insert({
          game_id: gameId,
          player_id: input.player_id,
          event_type_id: input.event_type_id,
          minute: input.minute,
          team: input.team,
          created_by: user!.id,
        })
        .select()
        .single();
      if (error) throw error;

      if (input.tagIds.length > 0) {
        const rows = input.tagIds.map((tag_id) => ({ event_id: event.id, tag_id }));
        const { error: tagErr } = await supabase.from('event_tag').insert(rows);
        if (tagErr) throw tagErr;
      }

      await recomputeGameScore(gameId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', gameId] });
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
}

/** Logs a goal (with variant and optional assist/tags) and recomputes the game score. */
export function useLogGoal(gameId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: LogGoalInput) => {
      const { data: types, error: tErr } = await supabase.from('event_type').select('id, code');
      if (tErr) throw tErr;
      const idByCode = new Map((types ?? []).map((t) => [t.code, t.id]));

      const goalCode = input.variant === 'own_goal' ? 'own_goal' : 'goal';
      const goalTypeId = idByCode.get(goalCode);
      if (!goalTypeId) throw new Error(`Tipo de evento em falta: ${goalCode}`);

      const { data: goalEvent, error: goalErr } = await supabase
        .from('event')
        .insert({
          game_id: gameId,
          player_id: input.scorerId,
          event_type_id: goalTypeId,
          minute: input.minute,
          team: input.team,
          meta:
            input.variant === 'normal' && input.assistId
              ? { variant: input.variant, assist_by: input.assistId }
              : { variant: input.variant },
          created_by: user!.id,
        })
        .select()
        .single();
      if (goalErr) throw goalErr;

      if (input.tagIds.length > 0) {
        const tagRows = input.tagIds.map((tag_id) => ({ event_id: goalEvent.id, tag_id }));
        const { error: tagErr } = await supabase.from('event_tag').insert(tagRows);
        if (tagErr) throw tagErr;
      }

      const assistTypeId = idByCode.get('assist');
      if (input.assistId && input.variant === 'normal' && assistTypeId) {
        const { error: assistErr } = await supabase.from('event').insert({
          game_id: gameId,
          player_id: input.assistId,
          event_type_id: assistTypeId,
          minute: input.minute,
          team: input.team,
          meta: { assist_for: input.scorerId },
          created_by: user!.id,
        });
        if (assistErr) throw assistErr;
      }

      await recomputeGameScore(gameId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', gameId] });
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
}

/** Removes an event and recomputes the game score. */
export function useRemoveEvent(gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (eventId: string) => {
      const { error } = await supabase.from('event').delete().eq('id', eventId);
      if (error) throw error;
      await recomputeGameScore(gameId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', gameId] });
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
}
