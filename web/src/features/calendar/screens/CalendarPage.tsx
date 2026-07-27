import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Page, PageTitle, IconButton } from '@/shared/components/ui';
import { ChevronLeftIcon, ChevronRightIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import { useGames, type GameWithFormat } from '@/features/games/hooks/gameHooks';
import { buildMonthGrid, dayKey } from '../lib/calendarGrid';
import s from './CalendarPage.module.css';

const WEEKDAY_REFERENCE = Array.from(
  { length: 7 },
  (_, i) => new Date(Date.UTC(2024, 0, 1 + i)), // 2024-01-01 is a Monday
);

/** Month-grid calendar of the group's games, past and upcoming. */
export function CalendarPage() {
  const { t, lang } = useT();
  const { data: games } = useGames();
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const locale = lang === 'pt' ? 'pt-PT' : 'en-US';
  const grid = useMemo(() => buildMonthGrid(cursor.year, cursor.month), [cursor]);
  const gamesByDay = useMemo(() => {
    const map = new Map<string, GameWithFormat[]>();
    for (const g of games ?? []) {
      const key = dayKey(g.scheduled_at);
      const list = map.get(key) ?? [];
      list.push(g);
      map.set(key, list);
    }
    return map;
  }, [games]);

  const monthLabel = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(cursor.year, cursor.month - 1, 1)),
  );
  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short', timeZone: 'UTC' });

  function shiftMonth(delta: number) {
    setCursor((c) => {
      const d = new Date(Date.UTC(c.year, c.month - 1 + delta, 1));
      return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1 };
    });
  }

  return (
    <Page>
      <PageTitle>{t('calendar.title')}</PageTitle>

      <div className={s.header}>
        <IconButton label={t('calendar.prevMonth')} onClick={() => shiftMonth(-1)}>
          <ChevronLeftIcon aria-hidden="true" />
        </IconButton>
        <p className={s.monthLabel}>{monthLabel}</p>
        <IconButton label={t('calendar.nextMonth')} onClick={() => shiftMonth(1)}>
          <ChevronRightIcon aria-hidden="true" />
        </IconButton>
      </div>

      <div className={s.weekdays}>
        {WEEKDAY_REFERENCE.map((d) => (
          <span key={d.toISOString()} className={s.weekday}>
            {weekdayFmt.format(d)}
          </span>
        ))}
      </div>

      <div className={s.grid}>
        {grid.map((day) => {
          const dayGames = gamesByDay.get(day.key) ?? [];
          return (
            <div
              key={day.key}
              className={[s.cell, !day.inMonth && s.outMonth, day.isToday && s.today]
                .filter(Boolean)
                .join(' ')}
            >
              <span className={s.dayNumber}>{day.date.getUTCDate()}</span>
              {dayGames.length > 0 && (
                <div className={s.dots}>
                  {dayGames.map((g) => (
                    <Link
                      key={g.id}
                      to={`/games/${g.id}`}
                      className={s.dot}
                      aria-label={g.game_format?.label ?? t('calendar.game')}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Page>
  );
}
