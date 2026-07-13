import { Card } from '@/shared/components/ui';
import { useRecentGames, type MatchResult } from './statsHooks';
import { ratingPill } from './ratingColor';

const RESULT_STYLE: Record<MatchResult, string> = {
  V: 'bg-pitch-500/15 text-pitch-300',
  E: 'bg-white/[0.06] text-slate-300',
  D: 'bg-red-500/15 text-red-300',
};

/** Lista dos últimos jogos com resultado e avaliação (estilo SofaScore). */
export function RecentMatches({ playerId }: { playerId: string }) {
  const { data } = useRecentGames(playerId, 5);
  if (!data || data.length === 0) return null;

  return (
    <Card>
      <h2 className="mb-1 text-sm font-bold uppercase tracking-wide text-slate-400">Últimos jogos</h2>
      <ul className="flex flex-col divide-y divide-white/[0.06]">
        {data.map((g) => (
          <li key={g.gameId} className="flex items-center gap-2.5 py-2.5">
            <span className="w-10 shrink-0 text-xs tabular-nums text-slate-500">{g.label}</span>
            {g.result ? (
              <span
                className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-xs font-bold ${RESULT_STYLE[g.result]}`}
              >
                {g.result}
              </span>
            ) : (
              <span className="w-6 shrink-0" />
            )}
            <span className="flex min-w-0 flex-1 items-baseline gap-2">
              <span className="text-base font-bold tabular-nums text-slate-100">
                {g.scoreFor != null ? `${g.scoreFor}–${g.scoreAgainst}` : '—'}
              </span>
              {g.formatLabel && <span className="truncate text-xs text-slate-500">{g.formatLabel}</span>}
            </span>
            <span
              className={`w-9 shrink-0 rounded-md py-0.5 text-center text-sm font-bold tabular-nums ${ratingPill(
                g.rating,
              )}`}
            >
              {g.rating != null ? g.rating.toFixed(1) : '—'}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
