import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/shared/lib/supabase';

/**
 * Subscreve alterações em tempo real de um jogo e invalida as queries relevantes,
 * para o placar/timeline/plantel atualizarem sem refresh. Liga só quando a página
 * de detalhe está aberta (montada).
 */
export function useGameRealtime(gameId: string | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!gameId) return;

    const channel = supabase
      .channel(`game:${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game', filter: `id=eq.${gameId}` },
        () => queryClient.invalidateQueries({ queryKey: ['game', gameId] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'event', filter: `game_id=eq.${gameId}` },
        () => queryClient.invalidateQueries({ queryKey: ['events', gameId] }),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'game_player', filter: `game_id=eq.${gameId}` },
        () => queryClient.invalidateQueries({ queryKey: ['game_players', gameId] }),
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [gameId, queryClient]);
}
