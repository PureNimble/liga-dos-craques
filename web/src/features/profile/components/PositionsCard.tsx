import { Card } from '@/shared/components/ui';
import { useT } from '@/shared/i18n/useT';
import { PositionPicker } from './PositionPicker';
import type { Position } from '../hooks/profileHooks';
import s from './PositionsCard.module.css';

interface PositionsCardProps {
  positions: Position[];
  mainPositionId: number | null;
  secondaryPositionIds: number[];
}

/** Read-only pitch view of a player's main and secondary positions. */
export function PositionsCard({ positions, mainPositionId, secondaryPositionIds }: PositionsCardProps) {
  const { t } = useT();
  const mainLabel = positions.find((p) => p.id === mainPositionId)?.label ?? null;
  const secondaryLabels = secondaryPositionIds
    .map((id) => positions.find((p) => p.id === id)?.label)
    .filter((label): label is string => Boolean(label));

  return (
    <Card>
      <h2 className={s.title}>{t('profile.positions.title')}</h2>
      <PositionPicker
        positions={positions}
        value={{ mainId: mainPositionId, secondaryIds: secondaryPositionIds }}
        onToggle={() => {}}
        readOnly
      />
      <dl className={s.list}>
        <div className={s.row}>
          <dt className={s.label}>{t('profile.positions.main')}</dt>
          <dd className={s.value}>{mainLabel ?? t('profile.positions.none')}</dd>
        </div>
        <div className={s.row}>
          <dt className={s.label}>{t('profile.positions.secondary')}</dt>
          <dd className={s.value}>
            {secondaryLabels.length > 0 ? secondaryLabels.join(', ') : t('profile.positions.none')}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
