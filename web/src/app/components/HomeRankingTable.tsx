import { Link } from 'react-router-dom';
import { useRankingOverall } from '@/features/rankings/hooks/rankingHooks';
import { Avatar } from '@/shared/components/ui';
import { ChevronRightIcon, TrophyIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import { HomePanelEmpty } from './HomePanelEmpty';
import panel from './homePanel.module.css';
import s from './HomeRankingTable.module.css';

/** Top-5 group ranking, highlighting the current player's row. */
export function HomeRankingTable({ playerId }: { playerId: string }) {
  const { t } = useT();
  const { data: ranking } = useRankingOverall();
  const top = (ranking ?? []).slice(0, 5);

  return (
    <div className={panel.panel}>
      <div className={panel.panelHead}>
        <h2 className={panel.panelTitle}>{t('home.ranking.title')}</h2>
        <Link to="/rankings" className={panel.panelLink}>
          {t('home.ranking.seeAll')} <ChevronRightIcon width={14} height={14} />
        </Link>
      </div>
      {top.length === 0 ? (
        <HomePanelEmpty
          icon={<TrophyIcon width={22} height={22} />}
          title={t('home.ranking.empty')}
        />
      ) : (
        <div className={s.rankingList}>
          {top.map((r, i) => (
            <div
              key={r.player_id}
              className={`${s.rankingRow} ${r.player_id === playerId ? s.rankingRowSelf : ''}`}
            >
              <span className={s.rankingPos}>{i + 1}</span>
              <Avatar name={r.name} src={r.photo_url} size="sm" />
              <span className={s.rankingName}>{r.name}</span>
              <span className={s.rankingXp}>{t('xp.total', { value: r.total_xp })}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
