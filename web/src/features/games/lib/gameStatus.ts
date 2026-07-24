import type { GameStatus } from '@/types/database';
import type { BadgeTone } from '@/shared/components/ui';

/** Chave i18n (`games.i18n.ts`) por estado — usar com `t(GAME_STATUS_KEY[status])`. */
export const GAME_STATUS_KEY: Record<GameStatus, string> = {
  draft: 'games.status.draft',
  scheduled: 'games.status.scheduled',
  open: 'games.status.open',
  teams_generated: 'games.status.teams_generated',
  in_progress: 'games.status.in_progress',
  finished: 'games.status.finished',
  voting_open: 'games.status.voting_open',
  closed: 'games.status.closed',
  cancelled: 'games.status.cancelled',
};

/** Chave i18n do texto de ação (verbo) para os botões de transição de estado. */
export const GAME_TRANSITION_KEY: Partial<Record<GameStatus, string>> = {
  scheduled: 'games.transition.scheduled',
  open: 'games.transition.open',
  teams_generated: 'games.transition.teams_generated',
  in_progress: 'games.transition.in_progress',
  finished: 'games.transition.finished',
  closed: 'games.transition.closed',
  cancelled: 'games.transition.cancelled',
};

export const GAME_STATUS_TONE: Record<GameStatus, BadgeTone> = {
  draft: 'gray',
  scheduled: 'sky',
  open: 'green',
  teams_generated: 'indigo',
  in_progress: 'amber',
  finished: 'gray',
  voting_open: 'purple',
  closed: 'gray',
  cancelled: 'red',
};

/**
 * Transições permitidas a partir de cada estado, considerando o que já está
 * implementado (F2). teams_generated (F6) e voting_open/closed (F5) serão
 * ligados nas respetivas fases; aqui expomos apenas o que o organizador pode
 * acionar manualmente agora.
 */
export const ALLOWED_TRANSITIONS: Record<GameStatus, GameStatus[]> = {
  draft: ['scheduled', 'cancelled'],
  scheduled: ['open', 'in_progress', 'cancelled'],
  open: ['in_progress', 'cancelled'],
  teams_generated: ['in_progress', 'cancelled'],
  in_progress: ['finished', 'cancelled'],
  // De 'finished' só se sai por "Apurar MVP/Flop" (fecha o jogo) — sem transição manual.
  finished: [],
  voting_open: [],
  closed: [],
  cancelled: [],
};

/** Estados considerados "por jogar" (aparecem no separador Próximos). */
export const UPCOMING_STATUSES: GameStatus[] = [
  'draft',
  'scheduled',
  'open',
  'teams_generated',
  'in_progress',
];
