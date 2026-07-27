import { Link } from 'react-router-dom';
import { useRecentGames, type RecentGameTeam } from '@/features/stats/hooks/statsHooks';
import { BallIcon, ShieldIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import { HomePanelEmpty } from './HomePanelEmpty';
import panel from './homePanel.module.css';
import s from './HomeRecentResults.module.css';

/** One team's crest (logo or shield fallback) and name in a recent-results row. */
function ResultTeam({
  team,
  fallback,
  mine,
}: {
  team: RecentGameTeam | null;
  fallback: string;
  mine?: boolean;
}) {
  return (
    <>
      <span className={s.resultCrest}>
        {team?.logoUrl ? (
          <img src={team.logoUrl} alt="" className={s.resultCrestImg} />
        ) : (
          <ShieldIcon width={14} height={14} />
        )}
      </span>
      <span className={`${s.resultTeamName}${mine ? ` ${s.resultTeamNameMine}` : ''}`}>
        {team?.name || fallback}
      </span>
    </>
  );
}

/** Last few finished games: both teams' crest/name (fixed A/B order, matching the game itself,
 *  whichever side is mine highlighted), score, and date. */
export function HomeRecentResults({ playerId }: { playerId: string }) {
  const { t } = useT();
  const { data: recent } = useRecentGames(playerId, 5);
  const rows = (recent ?? []).filter((r) => r.result && r.scoreFor != null && r.scoreAgainst != null);

  return (
    <div className={panel.panel}>
      <div className={panel.panelHead}>
        <h2 className={panel.panelTitle}>{t('home.results.title')}</h2>
      </div>
      {rows.length === 0 ? (
        <HomePanelEmpty icon={<BallIcon width={22} height={22} />} title={t('home.results.empty')} />
      ) : (
        <div className={panel.resultsList}>
          {rows.map((r) => (
            <Link key={r.gameId} to={`/games/${r.gameId}`} className={panel.resultRow}>
              <ResultTeam
                team={r.teamA}
                fallback={t('teams.team', { team: 'A' })}
                mine={r.mySide === 'A'}
              />
              <span className={s.resultScore}>
                {r.teamAScore}–{r.teamBScore}
              </span>
              <ResultTeam
                team={r.teamB}
                fallback={t('teams.team', { team: 'B' })}
                mine={r.mySide === 'B'}
              />
              <span className={s.resultDate}>{r.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
