import { Card } from '@/shared/components/ui';
import { CalendarIcon, PinIcon } from '@/shared/components/ui/icons';
import { useT } from '@/shared/i18n/useT';
import { formatGameDateTime } from '@/shared/lib/datetime';
import { useGameWeather, weatherIcon } from '../hooks/useGameWeather';
import type { GameWithFormat } from '../hooks/gameHooks';
import s from './GameDetailsCard.module.css';

interface GameDetailsCardProps {
  game: GameWithFormat;
}

/** Match details card (date, location, format, notes, forecast) — shared by the Geral tab and the Plantéis sidebar. */
export function GameDetailsCard({ game }: GameDetailsCardProps) {
  const { t } = useT();
  const { data: weather, isLoading: weatherLoading } = useGameWeather(
    game.place,
    game.scheduled_at,
  );
  const WeatherIcon = weather ? weatherIcon(weather.weatherType) : null;

  return (
    <Card>
      <h2 className={s.title}>{t('games.detail.details.title')}</h2>
      <dl className={s.list}>
        <div className={s.row}>
          <dt className={s.label}>
            <CalendarIcon width={14} height={14} /> {t('games.detail.details.when')}
          </dt>
          <dd className={s.value}>{formatGameDateTime(game.scheduled_at)}</dd>
        </div>
        {game.location && (
          <div className={s.row}>
            <dt className={s.label}>
              <PinIcon width={14} height={14} /> {t('games.detail.details.where')}
            </dt>
            <dd className={s.value}>{game.location}</dd>
          </div>
        )}
        <div className={s.row}>
          <dt className={s.label}>{t('games.detail.details.format')}</dt>
          <dd className={s.value}>{game.game_format?.label ?? '—'}</dd>
        </div>
        <div className={s.row}>
          <dt className={s.label}>{t('games.detail.weatherLabel')}</dt>
          <dd className={s.value}>
            {weather && WeatherIcon ? (
              <>
                <WeatherIcon width={16} height={16} /> {Math.round(weather.tMax)}°
              </>
            ) : (
              <span className={s.valueMuted}>
                {weatherLoading ? '…' : t('games.detail.weatherUnavailable')}
              </span>
            )}
          </dd>
        </div>
        <div className={s.row}>
          <dt className={s.label}>{t('games.detail.details.notes')}</dt>
          <dd className={s.value}>{game.notes || t('games.detail.noNotes')}</dd>
        </div>
      </dl>
    </Card>
  );
}
