import { Avatar, Button } from '@/shared/components/ui';
import { PinIcon, ShieldIcon, UsersIcon, WhistleIcon } from '@/shared/components/ui/icons';
import { formatGameDateTime } from '@/shared/lib/datetime';
import { useT } from '@/shared/i18n/useT';
import { useGameTeams } from '@/features/teams/hooks/teamHooks';
import { usePublicProfile } from '@/features/profile/hooks/profileHooks';
import { useGameWeather, weatherIcon } from '../hooks/useGameWeather';
import { StatusBadge } from './StatusBadge';
import type { MatchClock } from '../hooks/useMatchClock';
import type { GameWithFormat } from '../hooks/gameHooks';
import s from './MatchHeader.module.css';

interface MatchHeaderProps {
  game: GameWithFormat;
  clock: MatchClock;
  confirmedCount: number;
  maxPlayers: number;
  isOrganizer: boolean;
  onManage: () => void;
}

const TEAMS = [
  { key: 'A' as const, team: s.teamA, crest: s.crestA },
  { key: 'B' as const, team: s.teamB, crest: s.crestB },
];

/** Header for a game's detail screen: matchup, status/organizer/weather sidebar, and manage action. */
export function MatchHeader({
  game,
  clock,
  confirmedCount,
  maxPlayers,
  isOrganizer,
  onManage,
}: MatchHeaderProps) {
  const { t } = useT();
  const { data: gameTeams } = useGameTeams(game.id);
  const { data: organizer } = usePublicProfile(game.created_by);
  const { data: weather, isLoading: weatherLoading } = useGameWeather(
    game.place,
    game.scheduled_at,
  );
  const isLive = game.status === 'in_progress';
  const hasScore = game.team_a_score !== null || game.team_b_score !== null;
  const showScore = hasScore || isLive;
  const scoreA = game.team_a_score ?? 0;
  const scoreB = game.team_b_score ?? 0;
  const WeatherIcon = weather ? weatherIcon(weather.weatherType) : null;

  return (
    <div className={s.header}>
      <div className={s.body}>
        <div className={s.main}>
          <p className={s.dateline}>{formatGameDateTime(game.scheduled_at)}</p>

          <div className={s.scoreboard}>
            {TEAMS.map((team) => {
              const info = gameTeams?.[team.key];
              const name = info?.name || t('teams.team', { team: team.key });
              return (
                <div key={team.key} className={`${s.team} ${team.team}`}>
                  {info?.logo_url ? (
                    <span className={s.crestPhoto}>
                      <Avatar name={name} src={info.logo_url} size="xl" />
                    </span>
                  ) : (
                    <span className={`${s.crest} ${team.crest}`}>
                      <ShieldIcon fill="currentColor" stroke="none" />
                      <span className={s.crestLetter}>{team.key}</span>
                    </span>
                  )}
                  <span className={s.teamName}>{name}</span>
                </div>
              );
            })}
            <div className={s.score}>
              {showScore ? (
                <>
                  <span className={s.scoreValue}>{scoreA}</span>
                  <span className={s.scoreColon}>:</span>
                  <span className={s.scoreValue}>{scoreB}</span>
                </>
              ) : (
                <span className={s.vs}>{t('games.detail.vs')}</span>
              )}
            </div>
          </div>

          <div className={s.meta}>
            {game.location && (
              <span className={s.metaItem}>
                <PinIcon width={14} height={14} />
                {game.location}
              </span>
            )}
            <span className={s.metaItem}>
              <UsersIcon width={14} height={14} />
              {t('games.detail.confirmedCount', { count: confirmedCount, max: maxPlayers })}
            </span>
          </div>
        </div>

        <div className={s.sidebar}>
          <div className={s.sidebarTop}>
            {isLive ? (
              <span className={s.live}>
                <span className={s.liveDot} />
                {t('games.detail.live')}
              </span>
            ) : (
              <StatusBadge status={game.status} />
            )}
            {isLive && <span className={s.clock}>{clock.label}</span>}
          </div>

          {organizer && (
            <div className={s.sideItem}>
              <span className={s.sideLabel}>{t('games.detail.organizedByLabel')}</span>
              <span className={s.sideValue}>{organizer.name}</span>
            </div>
          )}

          <div className={s.sideItem}>
            <span className={s.sideLabel}>{t('games.detail.weatherLabel')}</span>
            {weather && WeatherIcon ? (
              <span className={s.sideValue}>
                <WeatherIcon width={16} height={16} />
                {Math.round(weather.tMax)}°
              </span>
            ) : (
              <span className={`${s.sideValue} ${s.sideMuted}`}>
                {weatherLoading ? '…' : t('games.detail.weatherUnavailable')}
              </span>
            )}
          </div>

          <div className={s.sideItem}>
            <span className={s.sideLabel}>{t('games.detail.formatLabel')}</span>
            <span className={s.sideValue}>{game.game_format?.label ?? '—'}</span>
          </div>

          {isOrganizer && (
            <Button variant="secondary" className={s.manageBtn} onClick={onManage}>
              <WhistleIcon width={16} height={16} /> {t('games.detail.manageGame')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
