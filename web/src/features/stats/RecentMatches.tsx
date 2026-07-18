import { Card } from '@/shared/components/ui';
import { useRecentGames, MIN_GAMES_FOR_STATS, type MatchResult, type RecentGame } from './statsHooks';
import { ratingPill } from './ratingColor';
import s from './RecentMatches.module.css';

const RESULT_CLASS: Record<MatchResult, string> = {
  V: s.resultWin,
  E: s.resultDraw,
  D: s.resultLoss,
};

/** Lista dos últimos jogos com resultado e avaliação (estilo SofaScore). */
export function RecentMatches({ playerId, games }: { playerId: string; games: number }) {
  const { data } = useRecentGames(playerId, 5);
  // Bloqueado (<5 jogos) → o estado bloqueado com mock vive em PlayerCharts.
  if (games < MIN_GAMES_FOR_STATS || !data || data.length === 0) return null;
  return <RecentMatchesCard data={data} />;
}

/** Cartão apresentacional — reutilizado pelo estado bloqueado (dados de mentira). */
export function RecentMatchesCard({ data }: { data: RecentGame[] }) {
  return (
    <Card>
      <h2 className={s.heading}>Últimos jogos</h2>
      <ul className={s.list}>
        {data.map((g) => (
          <li key={g.gameId} className={s.item}>
            <span className={s.label}>{g.label}</span>
            {g.result ? (
              <span className={`${s.result} ${RESULT_CLASS[g.result]}`}>{g.result}</span>
            ) : (
              <span className={s.resultEmpty} />
            )}
            <span className={s.score}>
              <span className={s.scoreValue}>
                {g.scoreFor != null ? `${g.scoreFor}–${g.scoreAgainst}` : '—'}
              </span>
              {g.formatLabel && <span className={s.format}>{g.formatLabel}</span>}
            </span>
            <span className={`${s.rating} ${ratingPill(g.rating)}`}>
              {g.rating != null ? g.rating.toFixed(1) : '—'}
            </span>
          </li>
        ))}
      </ul>
    </Card>
  );
}
