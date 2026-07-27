import { Link } from 'react-router-dom';
import { Avatar, Card } from '@/shared/components/ui';
import { CalendarIcon, PinIcon, ChevronRightIcon, ShieldIcon } from '@/shared/components/ui/icons';
import { formatGameDateTime } from '@/shared/lib/datetime';
import { useT } from '@/shared/i18n/useT';
import { useGameTeams } from '@/features/teams/hooks/teamHooks';
import { type GameWithFormat } from '../hooks/gameHooks';
import { StatusBadge } from './StatusBadge';
import s from './GameCard.module.css';

function TeamCrest({ name, logoUrl, side }: { name: string; logoUrl: string | null; side: 'A' | 'B' }) {
  if (logoUrl) return <Avatar name={name} src={logoUrl} size="sm" />;
  return (
    <span className={side === 'A' ? s.crestA : s.crestB}>
      <ShieldIcon width={16} height={16} />
    </span>
  );
}

/** Single game row in the games list: team crests, date/format/location, score (if played), status. */
export function GameCard({ game }: { game: GameWithFormat }) {
  const { t } = useT();
  const { data: gameTeams } = useGameTeams(game.id);
  const hasScore = game.team_a_score !== null || game.team_b_score !== null;
  const nameA = gameTeams?.A?.name || t('teams.team', { team: 'A' });
  const nameB = gameTeams?.B?.name || t('teams.team', { team: 'B' });

  return (
    <li className={s.item}>
      <Link to={`/games/${game.id}`} className={s.cardLink}>
        <Card interactive className={s.card}>
          <div className={s.crests}>
            <TeamCrest name={nameA} logoUrl={gameTeams?.A?.logo_url ?? null} side="A" />
            <span className={s.crestVs}>{t('home.hero.vs')}</span>
            <TeamCrest name={nameB} logoUrl={gameTeams?.B?.logo_url ?? null} side="B" />
          </div>

          <div className={s.info}>
            <p className={s.date}>{formatGameDateTime(game.scheduled_at)}</p>
            <p className={s.meta}>
              <CalendarIcon width={13} height={13} />
              {game.game_format?.label ?? '-'}
              {game.location && (
                <>
                  <PinIcon width={13} height={13} className={s.metaLoc} />
                  <span className={s.locText}>{game.location}</span>
                </>
              )}
            </p>
            {hasScore && (
              <p className={s.score}>
                {game.team_a_score ?? 0} <span className={s.scoreDash}>–</span>{' '}
                {game.team_b_score ?? 0}
              </p>
            )}
          </div>

          <div className={s.side}>
            <StatusBadge status={game.status} />
            <ChevronRightIcon width={16} height={16} className={s.chevron} />
          </div>
        </Card>
      </Link>
    </li>
  );
}
