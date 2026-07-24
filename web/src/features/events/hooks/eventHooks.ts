import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';
import { useAuth } from '@/features/auth/hooks/useAuth';
import type { Database, Team } from '@/types/database';

export type EventType = Database['public']['Tables']['event_type']['Row'];
export type Tag = Database['public']['Tables']['tag']['Row'];
export type GameEvent = Database['public']['Tables']['event']['Row'];

/** Evento com tipo, perfil do jogador e tags embebidos. */
export interface EventWithDetails extends GameEvent {
  event_type: Pick<EventType, 'code' | 'label' | 'supports_tags' | 'affects_score'> | null;
  profile: { id: string; name: string } | null;
  event_tag: { tag: Pick<Tag, 'code' | 'label'> | null }[];
}

/* -------------------------------------------------------------------------- */
/*  Lookups                                                                     */
/* -------------------------------------------------------------------------- */
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

/* -------------------------------------------------------------------------- */
/*  Eventos de um jogo                                                          */
/* -------------------------------------------------------------------------- */
export function useGameEvents(gameId: string | undefined) {
  return useQuery({
    queryKey: ['events', gameId],
    enabled: Boolean(gameId),
    queryFn: async (): Promise<EventWithDetails[]> => {
      const { data, error } = await supabase
        .from('event')
        .select(
          // `profile:player_id` desambigua: event tem 2 FKs para profile
          // (player_id e created_by), senão o embed é ambíguo e a query falha.
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

/* -------------------------------------------------------------------------- */
/*  Placar derivado dos eventos                                                 */
/* -------------------------------------------------------------------------- */
/**
 * Recalcula o placar a partir dos eventos que contam para o resultado
 * (event_type.affects_score = golo, autogolo, penálti convertido) e grava-o
 * no jogo. O `team` do evento já aponta a equipa que beneficia (o autogolo é
 * registado para a equipa adversária), por isso basta contar por equipa.
 */
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

/* -------------------------------------------------------------------------- */
/*  Registar / remover                                                          */
/* -------------------------------------------------------------------------- */
export interface AddEventInput {
  player_id: string;
  event_type_id: number;
  minute: number | null;
  team: Team | null;
  tagIds: number[];
}

export type GoalVariant = 'normal' | 'penalty' | 'freekick' | 'own_goal';

export interface LogGoalInput {
  scorerId: string;
  /** Assistência opcional (jogador diferente do marcador; nunca no autogolo). */
  assistId: string | null;
  variant: GoalVariant;
  /** Equipa creditada: a do marcador (no autogolo, a adversária). */
  team: Team | null;
  minute: number | null;
  /** Tags de técnica do golo (bicicleta, cabeceamento, …). */
  tagIds: number[];
}

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

      // O placar segue os eventos.
      await recomputeGameScore(gameId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events', gameId] });
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
}

/**
 * Regista um golo (normal / penálti / livre / autogolo) e, opcionalmente, a
 * assistência associada — porque uma assistência só existe a partir de um golo.
 * Penálti e livre são golos (contam como golo); o autogolo usa o tipo próprio
 * (não conta como golo do jogador e credita a equipa adversária).
 */
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

      // Insere a linha do golo primeiro (com id) para lhe poder ligar as tags.
      const { data: goalEvent, error: goalErr } = await supabase
        .from('event')
        .insert({
          game_id: gameId,
          player_id: input.scorerId,
          event_type_id: goalTypeId,
          minute: input.minute,
          team: input.team,
          // A assistência fica associada à linha do golo (assist_by).
          meta:
            input.variant === 'normal' && input.assistId
              ? { variant: input.variant, assist_by: input.assistId }
              : { variant: input.variant },
          created_by: user!.id,
        })
        .select()
        .single();
      if (goalErr) throw goalErr;

      // Tags de técnica (só nas variantes que as suportam — normal e livre).
      if (input.tagIds.length > 0) {
        const tagRows = input.tagIds.map((tag_id) => ({ event_id: goalEvent.id, tag_id }));
        const { error: tagErr } = await supabase.from('event_tag').insert(tagRows);
        if (tagErr) throw tagErr;
      }

      // Assistência: só em golo normal, e no evento próprio (conta nas stats do
      // assistente). A mesma-equipa é garantida na UI.
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
