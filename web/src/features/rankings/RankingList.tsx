import { Link } from 'react-router-dom';
import { Avatar, EmptyState } from '@/shared/components/ui';
import { TrophyIcon } from '@/shared/components/ui/icons';

export interface RankingRow {
  player_id: string;
  name: string;
  photo_url: string | null;
  value: string;
  sub: string;
}

// Badge do pódio (1º ouro, 2º prata, 3º bronze) e realce subtil da linha.
const PODIUM_BADGE = [
  'bg-gradient-to-b from-amber-300 to-amber-500 text-navy-975 shadow-glow',
  'bg-gradient-to-b from-slate-200 to-slate-400 text-navy-975',
  'bg-gradient-to-b from-orange-400 to-orange-600 text-white',
];
const PODIUM_RING = [
  'ring-1 ring-amber-400/30',
  'ring-1 ring-slate-300/20',
  'ring-1 ring-orange-500/20',
];

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
    <ol className="grid gap-2 lg:grid-cols-2">
      {rows.map((row, i) => (
        <li key={row.player_id}>
          <Link
            to={`/players/${row.player_id}`}
            className={`flex items-center gap-3 rounded-2xl border border-white/[0.07] bg-gradient-to-b from-navy-850/70 to-navy-900 p-3 shadow-card transition hover:border-white/[0.12] hover:from-navy-800/70 active:scale-[0.995] ${
              PODIUM_RING[i] ?? ''
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm font-bold tabular-nums ${
                PODIUM_BADGE[i] ?? 'bg-white/[0.06] text-slate-300'
              }`}
            >
              {i + 1}
            </span>
            <Avatar name={row.name} src={row.photo_url} size="md" />
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-slate-100">{row.name}</p>
              <p className="truncate text-xs text-slate-400">{row.sub}</p>
            </div>
            <span className="shrink-0 font-display text-lg font-bold tabular-nums text-pitch-300">
              {row.value}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
