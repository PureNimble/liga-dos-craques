import { Card, Avatar } from '@/shared/components/ui';
import { useT } from '@/shared/i18n/useT';
import type { Team } from '@/types/database';
import { useGameTeams } from '../hooks/teamHooks';
import s from './EquipmentCard.module.css';

interface EquipmentCardProps {
  gameId: string;
}

const SIDES: { key: Team; shirtClass: keyof typeof s }[] = [
  { key: 'A', shirtClass: 'shirtA' },
  { key: 'B', shirtClass: 'shirtB' },
];

const SHIRT_PATH =
  'M30,10 L10,25 L20,40 L28,32 L28,90 L72,90 L72,32 L80,40 L90,25 L70,10 L60,18 C55,22 45,22 40,18 Z';

/** Generated jersey per side (tinted with the team color, badged with its logo if set) — a lightweight stand-in for kit photos. */
export function EquipmentCard({ gameId }: EquipmentCardProps) {
  const { t } = useT();
  const { data: gameTeams } = useGameTeams(gameId);

  return (
    <Card>
      <h2 className={s.title}>{t('teams.equipment.title')}</h2>
      <div className={s.grid}>
        {SIDES.map(({ key, shirtClass }) => {
          const info = gameTeams?.[key];
          const name = info?.name || t('teams.team', { team: key });
          return (
            <div key={key} className={s.kit}>
              <svg viewBox="0 0 100 100" className={`${s.shirt} ${s[shirtClass]}`} aria-hidden focusable="false">
                <path d={SHIRT_PATH} />
              </svg>
              {info?.logo_url && (
                <Avatar name={name} src={info.logo_url} size="sm" className={s.badge} />
              )}
              <span className={s.name}>{name}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
