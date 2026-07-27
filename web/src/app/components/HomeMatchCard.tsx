import { Link } from 'react-router-dom';
import {
  useNextGameSuspense,
  useGamePlayers,
  type GamePlayerWithProfile,
} from '@/features/games/hooks/gameHooks';
import { useGameTeams, type GameTeam } from '@/features/teams/hooks/teamHooks';
import { Avatar } from '@/shared/components/ui';
import { PinIcon, ChevronRightIcon, ShieldIcon, CalendarIcon } from '@/shared/components/ui/icons';
import { formatGameDayMonthByLang, formatGameTimeByLang } from '@/shared/lib/datetime';
import { useT } from '@/shared/i18n/useT';
import s from './HomeMatchCard.module.css';

/** A stack of avatar circles (capped, with a "+N" overflow chip). */
function AvatarStack({ players }: { players: GamePlayerWithProfile[] }) {
  const shown = players.slice(0, 5);
  const overflow = players.length - shown.length;
  return (
    <div className={s.avatarStack}>
      {shown.map((p) => (
        <Avatar
          key={p.id}
          name={p.profile?.name}
          src={p.profile?.photo_url}
          size="sm"
          className={s.stackedAvatar}
        />
      ))}
      {overflow > 0 && <span className={s.avatarOverflow}>+{overflow}</span>}
    </div>
  );
}

/** One side of the matchup header: big team logo/badge and name (no player circles). */
function TeamBadge({ team, info }: { team: 'A' | 'B'; info: GameTeam | undefined }) {
  const { t } = useT();
  const name = info?.name || t('teams.team', { team });
  return (
    <div className={s.teamColumn}>
      {info?.logo_url ? (
        <Avatar name={name} src={info.logo_url} size="lg" />
      ) : (
        <span className={team === 'A' ? s.teamBadgeA : s.teamBadgeB}>
          <ShieldIcon width={32} height={32} />
        </span>
      )}
      <p className={s.teamName}>{name}</p>
    </div>
  );
}

/** Next-match card: team matchup (once generated), date/time/location, confirmed players, and a CTA. */
export function HomeMatchCard() {
  const { t, lang } = useT();
  const { data: game } = useNextGameSuspense();
  const { data: players } = useGamePlayers(game?.id);
  const { data: gameTeams } = useGameTeams(game?.id);

  const confirmed = (players ?? []).filter((p) => p.status === 'confirmed');
  const hasTeams =
    confirmed.some((p) => p.team === 'A') && confirmed.some((p) => p.team === 'B');

  return (
    <div className={s.matchCard}>
      <div className={s.matchHeader}>
        <span className={s.matchBadge}>{t('home.hero.badge')}</span>
      </div>

      <div className={s.matchBody}>
        {game ? (
          <>
            {hasTeams && (
              <div className={s.matchTeams}>
                <TeamBadge team="A" info={gameTeams?.A} />
                <span className={s.matchVs}>{t('home.hero.vs')}</span>
                <TeamBadge team="B" info={gameTeams?.B} />
              </div>
            )}

            <div className={s.matchDivider} />

            <div className={s.matchMeta}>
              <span className={s.matchMetaItem}>
                <CalendarIcon width={16} height={16} />
                <span className={s.matchMetaPrimary}>
                  {formatGameDayMonthByLang(game.scheduled_at, lang)} ·{' '}
                  {formatGameTimeByLang(game.scheduled_at, lang)}
                </span>
              </span>
              {game.location && (
                <span className={s.matchMetaItem}>
                  <PinIcon width={16} height={16} />
                  <span className={s.matchMetaPrimary}>{game.location}</span>
                </span>
              )}
            </div>

            {confirmed.length > 0 && (
              <div className={s.matchPlayers}>
                <AvatarStack players={confirmed} />
                <span className={s.matchConfirmedText}>
                  {t('home.hero.confirmed', { count: confirmed.length, max: game.max_players })}
                </span>
              </div>
            )}
          </>
        ) : (
          <p className={s.matchDate}>{t('home.hero.noGame.cta')}</p>
        )}
      </div>

      <Link to={game ? `/games/${game.id}` : '/games/new'} className={s.matchCta}>
        {game ? t('home.hero.cta') : t('home.hero.noGame.action')}
        <ChevronRightIcon width={16} height={16} />
      </Link>
    </div>
  );
}
