import { Link } from 'react-router-dom';
import { useGames } from '@/features/games/hooks/gameHooks';
import { UPCOMING_STATUSES } from '@/features/games/lib/gameStatus';
import { CalendarIcon, ChevronRightIcon, ShieldIcon } from '@/shared/components/ui/icons';
import { formatGameDayMonthByLang, formatGameTimeByLang } from '@/shared/lib/datetime';
import { useT } from '@/shared/i18n/useT';
import { HomePanelEmpty } from './HomePanelEmpty';
import panel from './homePanel.module.css';
import s from './HomeUpcomingFixtures.module.css';

/** Next few upcoming games in the group, chronologically: date, opponent, home/away, time. */
export function HomeUpcomingFixtures() {
  const { t, lang } = useT();
  const { data: games } = useGames();
  const upcoming = (games ?? [])
    .filter((g) => UPCOMING_STATUSES.includes(g.status))
    .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
    .slice(0, 5);

  return (
    <div className={panel.panel}>
      <div className={panel.panelHead}>
        <h2 className={panel.panelTitle}>{t('home.fixtures.title')}</h2>
        <Link to="/calendar" className={panel.panelLink}>
          {t('home.fixtures.seeAll')} <ChevronRightIcon width={14} height={14} />
        </Link>
      </div>
      {upcoming.length === 0 ? (
        <HomePanelEmpty
          icon={<CalendarIcon width={22} height={22} />}
          title={t('home.fixtures.empty')}
        />
      ) : (
        <div className={panel.resultsList}>
          {upcoming.map((g, i) => (
            <Link
              key={g.id}
              to={`/games/${g.id}`}
              className={`${s.fixtureRow} ${i === 0 ? s.fixtureRowNext : ''}`}
            >
              <span className={s.fixtureDate}>{formatGameDayMonthByLang(g.scheduled_at, lang)}</span>
              <span className={s.fixtureCrest}>
                <ShieldIcon width={14} height={14} />
              </span>
              <span className={s.fixtureName}>{g.opponent_name || g.location}</span>
              {g.is_home !== null && (
                <span className={s.fixtureBadge}>
                  {g.is_home ? t('home.fixtures.home') : t('home.fixtures.away')}
                </span>
              )}
              <span className={s.fixtureTime}>{formatGameTimeByLang(g.scheduled_at, lang)}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
