import { Link } from 'react-router-dom';
import { Avatar, EmptyState } from '@/shared/components/ui';
import { TrophyIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import s from './RankingList.module.css';

/** A single row in a ranking list. */
export interface RankingRow {
  player_id: string;
  name: string;
  photo_url: string | null;
  value: string;
  sub?: string;
}

const PODIUM_BADGE = [s.badge1, s.badge2, s.badge3];
const PODIUM_RING = [s.ring1, s.ring2, s.ring3];

/** Ordered list of ranking rows, with podium styling for the top 3. */
export function RankingList({ rows }: { rows: RankingRow[] }) {
  const { t } = useT();

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<TrophyIcon width={26} height={26} />}
        title={t('rankings.empty.title')}
        description={t('rankings.empty.description')}
      />
    );
  }

  return (
    <ol className={s.list}>
      {rows.map((row, i) => (
        <li key={row.player_id}>
          <Link to={`/players/${row.player_id}`} className={`${s.row} ${PODIUM_RING[i] ?? ''}`}>
            <span className={`${s.badge} ${PODIUM_BADGE[i] ?? ''}`}>{i + 1}</span>
            <Avatar name={row.name} src={row.photo_url} size="md" />
            <div className={s.info}>
              <p className={s.name}>{row.name}</p>
              {row.sub && <p className={s.sub}>{row.sub}</p>}
            </div>
            <span className={s.value}>{row.value}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
