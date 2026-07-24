import { Badge } from '@/shared/components/ui';
import type { GameStatus } from '@/types/database';
import { useT } from '@/shared/i18n/useT';
import { GAME_STATUS_KEY, GAME_STATUS_TONE } from '../lib/gameStatus';

/** Badge showing a game's current status. */
export function StatusBadge({ status }: { status: GameStatus }) {
  const { t } = useT();
  return <Badge tone={GAME_STATUS_TONE[status]}>{t(GAME_STATUS_KEY[status])}</Badge>;
}
