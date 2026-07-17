import { Link } from 'react-router-dom';
import { Avatar, EmptyState } from '@/shared/components/ui';
import { TrophyIcon } from '@/shared/components/ui/icons';
import s from './RankingList.module.css';

export interface RankingRow {
  player_id: string;
  name: string;
  photo_url: string | null;
  value: string;
  sub: string;
}

// Emblema do pódio (1º ouro, 2º prata, 3º bronze) e realce subtil da linha.
const PODIUM_BADGE = [s.badge1, s.badge2, s.badge3];
const PODIUM_RING = [s.ring1, s.ring2, s.ring3];

export function RankingList({ rows }: { rows: RankingRow[] }) {
  if (rows.length === 0) {
    return (
      <EmptyState
        icon={<TrophyIcon width={26} height={26} />}
        title="Ainda não há dados"
        description="Este ranking preenche-se assim que houver jogos registados."
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
              <p className={s.sub}>{row.sub}</p>
            </div>
            <span className={s.value}>{row.value}</span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
