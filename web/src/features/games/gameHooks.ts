import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth/useAuth';
import type { Database, GameStatus, GamePlayerStatus } from '@/types/database';

export type GameFormat = Database['public']['Tables']['game_format']['Row'];
export type Game = Database['public']['Tables']['game']['Row'];
export type GamePlayer = Database['public']['Tables']['game_player']['Row'];

/** Jogo com o formato embebido (join) para listagem/detalhe. */
export interface GameWithFormat extends Game {
  game_format: Pick<GameFormat, 'code' | 'label' | 'players_per_side'> | null;
}

/** Jogador do jogo com dados do perfil embebidos. */
export interface GamePlayerWithProfile extends GamePlayer {
  profile: { id: string; name: string; photo_url: string | null } | null;
}

/**
 * Escolhe o formato que melhor serve o nº de inscritos: o mais próximo de
 * count/2 jogadores por lado; em empate, arredonda para cima (formato maior).
 * Ex.: 5 inscritos → 3v3; 10 → 5v5.
 */
export function pickFormatForCount(count: number, formats: GameFormat[]): GameFormat | null {
  if (formats.length === 0) return null;
  const target = count / 2;
  const sorted = [...formats].sort((a, b) => a.players_per_side - b.players_per_side);
  let best = sorted[0];
  let bestDiff = Infinity;
  for (const f of sorted) {
    const diff = Math.abs(f.players_per_side - target);
    if (diff < bestDiff - 1e-9 || (Math.abs(diff - bestDiff) < 1e-9 && f.players_per_side > best.players_per_side)) {
      bestDiff = diff;
      best = f;
    }
  }
  return best;
}

/* -------------------------------------------------------------------------- */
/*  Formatos                                                                    */
/* -------------------------------------------------------------------------- */
export function useGameFormats() {
  return useQuery({
    queryKey: ['game_formats'],
    queryFn: async (): Promise<GameFormat[]> => {
      // Formatos de jogo começam no 2v2 — o 1v1 vive na aba dos desafios.
      const { data, error } = await supabase
        .from('game_format')
        .select('*')
        .gte('players_per_side', 2)
        .order('sort_order');
      if (error) throw error;
      return data ?? [];
    },
    staleTime: Infinity,
  });
}

/* -------------------------------------------------------------------------- */
/*  Lista de jogos                                                              */
/* -------------------------------------------------------------------------- */
export function useGames() {
  return useQuery({
    queryKey: ['games'],
    queryFn: async (): Promise<GameWithFormat[]> => {
      const { data, error } = await supabase
        .from('game')
        .select('*, game_format(code, label, players_per_side)')
        .order('scheduled_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as GameWithFormat[];
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Detalhe de um jogo                                                          */
/* -------------------------------------------------------------------------- */
export function useGame(gameId: string | undefined) {
  return useQuery({
    queryKey: ['game', gameId],
    enabled: Boolean(gameId),
    queryFn: async (): Promise<GameWithFormat> => {
      const { data, error } = await supabase
        .from('game')
        .select('*, game_format(code, label, players_per_side)')
        .eq('id', gameId as string)
        .single();
      if (error) throw error;
      return data as unknown as GameWithFormat;
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Jogadores de um jogo                                                        */
/* -------------------------------------------------------------------------- */
export function useGamePlayers(gameId: string | undefined) {
  return useQuery({
    queryKey: ['game_players', gameId],
    enabled: Boolean(gameId),
    queryFn: async (): Promise<GamePlayerWithProfile[]> => {
      const { data, error } = await supabase
        .from('game_player')
        // Embed explícito por coluna (à prova de futuras FKs para profile).
        .select('*, profile:player_id(id, name, photo_url)')
        .eq('game_id', gameId as string)
        .order('added_at');
      if (error) throw error;
      return (data ?? []) as unknown as GamePlayerWithProfile[];
    },
  });
}

/* -------------------------------------------------------------------------- */
/*  Mutations                                                                   */
/* -------------------------------------------------------------------------- */
export interface CreateGameInput {
  scheduled_at: string;
  location: string | null;
  format_id: number;
  max_players: number;
  notes: string | null;
}

export function useCreateGame() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGameInput): Promise<Game> => {
      // Ao criar, as inscrições ficam logo abertas.
      const { data, error } = await supabase
        .from('game')
        .insert({ ...input, created_by: user!.id, status: 'open' })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['games'] }),
  });
}

export function useUpdateGame(gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CreateGameInput) => {
      const { error } = await supabase.from('game').update(input).eq('id', gameId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
}

export function useUpdateGameStatus(gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      status: GameStatus;
      team_a_score?: number | null;
      team_b_score?: number | null;
      started_at?: string | null;
    }) => {
      const { error } = await supabase.from('game').update(input).eq('id', gameId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['game', gameId] });
      queryClient.invalidateQueries({ queryKey: ['games'] });
    },
  });
}

export function useAddGamePlayer(gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { playerId: string; status?: GamePlayerStatus }) => {
      const { error } = await supabase.from('game_player').insert({
        game_id: gameId,
        player_id: input.playerId,
        status: input.status ?? 'confirmed',
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['game_players', gameId] }),
  });
}

export function useRemoveGamePlayer(gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (gamePlayerId: string) => {
      const { error } = await supabase.from('game_player').delete().eq('id', gamePlayerId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['game_players', gameId] }),
  });
}

export function useSetGamePlayerStatus(gameId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: { gamePlayerId: string; status: GamePlayerStatus }) => {
      const { error } = await supabase
        .from('game_player')
        .update({ status: input.status })
        .eq('id', input.gamePlayerId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['game_players', gameId] }),
  });
}
