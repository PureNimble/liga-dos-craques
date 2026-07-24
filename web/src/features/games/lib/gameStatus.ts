import type { GameStatus } from '@/types/database';
import type { BadgeTone } from '@/shared/components/ui';

/** i18n key per game status, for use with `t(GAME_STATUS_KEY[status])`. */
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

/** i18n key of the action verb for status-transition buttons. */
export const GAME_TRANSITION_KEY: Partial<Record<GameStatus, string>> = {
  scheduled: 'games.transition.scheduled',
  open: 'games.transition.open',
  teams_generated: 'games.transition.teams_generated',
  in_progress: 'games.transition.in_progress',
  finished: 'games.transition.finished',
  closed: 'games.transition.closed',
  cancelled: 'games.transition.cancelled',
};

/** Badge color per game status. */
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

/** Status transitions the organizer can trigger manually from each state. */
export const ALLOWED_TRANSITIONS: Record<GameStatus, GameStatus[]> = {
  draft: ['scheduled', 'cancelled'],
  scheduled: ['open', 'in_progress', 'cancelled'],
  open: ['in_progress', 'cancelled'],
  teams_generated: ['in_progress', 'cancelled'],
  in_progress: ['finished', 'cancelled'],
  finished: [],
  voting_open: [],
  closed: [],
  cancelled: [],
};

/** Statuses considered "upcoming" (shown in the Upcoming tab). */
export const UPCOMING_STATUSES: GameStatus[] = [
  'draft',
  'scheduled',
  'open',
  'teams_generated',
  'in_progress',
];
