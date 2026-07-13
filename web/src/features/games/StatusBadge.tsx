import type { GameStatus } from '@/types/database';
import { GAME_STATUS_LABELS, GAME_STATUS_STYLES } from './gameStatus';

export function StatusBadge({ status }: { status: GameStatus }) {
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold ${GAME_STATUS_STYLES[status]}`}
    >
      {GAME_STATUS_LABELS[status]}
    </span>
  );
}
