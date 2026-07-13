import type { GameStatus } from '@/types/database';

export const GAME_STATUS_LABELS: Record<GameStatus, string> = {
  draft: 'Rascunho',
  scheduled: 'Agendado',
  open: 'Inscrições abertas',
  teams_generated: 'Equipas geradas',
  in_progress: 'A decorrer',
  finished: 'Terminado',
  voting_open: 'Votação aberta',
  closed: 'Fechado',
  cancelled: 'Cancelado',
};

/** Texto de ação (verbo) para os botões de transição de estado. */
export const GAME_TRANSITION_LABELS: Partial<Record<GameStatus, string>> = {
  scheduled: 'Agendar',
  open: 'Abrir inscrições',
  teams_generated: 'Gerar equipas',
  in_progress: 'Iniciar jogo',
  finished: 'Terminar jogo',
  closed: 'Fechar (sem votação)',
  cancelled: 'Cancelar jogo',
};

export const GAME_STATUS_STYLES: Record<GameStatus, string> = {
  draft: 'bg-slate-500/15 text-slate-300',
  scheduled: 'bg-sky-500/15 text-sky-300',
  open: 'bg-pitch-500/15 text-pitch-400',
  teams_generated: 'bg-indigo-500/15 text-indigo-300',
  in_progress: 'bg-amber-500/15 text-amber-300',
  finished: 'bg-slate-500/20 text-slate-200',
  voting_open: 'bg-purple-500/15 text-purple-300',
  closed: 'bg-slate-500/15 text-slate-400',
  cancelled: 'bg-red-500/15 text-red-300',
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
