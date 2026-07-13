import { Badge } from '@/shared/components/ui';
import type { GameStatus } from '@/types/database';
import { GAME_STATUS_LABELS, GAME_STATUS_TONE } from './gameStatus';

export function StatusBadge({ status }: { status: GameStatus }) {
  return <Badge tone={GAME_STATUS_TONE[status]}>{GAME_STATUS_LABELS[status]}</Badge>;
}
