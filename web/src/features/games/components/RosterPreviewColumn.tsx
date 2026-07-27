import { Avatar } from '@/shared/components/ui';
import { useT } from '@/shared/i18n/useT';
import type { GamePlayerWithProfile } from '../hooks/gameHooks';
import s from './RosterPreviewColumn.module.css';

/** Read-only preview of one team's confirmed roster (Geral tab) — the full editor lives in Plantéis. */
export function RosterPreviewColumn({
  name,
  players,
}: {
  name: string;
  players: GamePlayerWithProfile[];
}) {
  const { t } = useT();
  return (
    <div className={s.rosterPreviewCol}>
      <p className={s.rosterPreviewHead}>
        {name} · {players.length}
      </p>
      <ul className={s.rosterPreviewList}>
        {players.map((p) => (
          <li key={p.id} className={s.rosterPreviewRow}>
            <Avatar name={p.profile?.name} src={p.profile?.photo_url} size="sm" />
            <span className={s.rosterPreviewName}>
              {p.profile?.name ?? t('games.roster.fallbackName')}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
