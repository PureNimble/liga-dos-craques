import { CalendarIcon, PinIcon } from '@/shared/components/ui/icons';
import { formatGameDateTime } from '@/shared/lib/datetime';
import { StatusBadge } from './StatusBadge';
import type { MatchClock } from './useMatchClock';
import type { GameWithFormat } from './gameHooks';
import s from './MatchHeader.module.css';

interface MatchHeaderProps {
  game: GameWithFormat;
  clock: MatchClock;
}

/** Nome curto e "crest" de cada equipa (A verde, B azul). */
const TEAMS = [
  { key: 'A' as const, name: 'Equipa A', team: s.teamA, crest: s.crestA },
  { key: 'B' as const, name: 'Equipa B', team: s.teamB, crest: s.crestB },
];

export function MatchHeader({ game, clock }: MatchHeaderProps) {
  const isLive = game.status === 'in_progress';
  const hasScore = game.team_a_score !== null || game.team_b_score !== null;
  const showScore = hasScore || isLive;
  const scoreA = game.team_a_score ?? 0;
  const scoreB = game.team_b_score ?? 0;

  return (
    <div className={s.header}>
      {/* brilho de relvado */}
      <div aria-hidden className={s.glow} />

      <div className={s.top}>
        {isLive ? (
          <span className={s.live}>
            <span className={s.liveDot} />
            Ao vivo
          </span>
        ) : (
          <StatusBadge status={game.status} />
        )}
        {isLive && <span className={s.clock}>{clock.label}</span>}
      </div>

      {/* Placar */}
      {showScore ? (
        <div className={s.scoreboard}>
          {TEAMS.map((t) => (
            <div key={t.key} className={`${s.team} ${t.team}`}>
              <span className={`${s.crest} ${t.crest}`}>{t.key}</span>
              <span className={s.teamName}>{t.name}</span>
            </div>
          ))}
          <div className={s.score}>
            <span className={s.scoreValue}>{scoreA}</span>
            <span className={s.scoreColon}>:</span>
            <span className={s.scoreValue}>{scoreB}</span>
          </div>
        </div>
      ) : (
        <div className={s.date}>
          <p className={s.dateText}>{formatGameDateTime(game.scheduled_at)}</p>
        </div>
      )}

      {/* Meta */}
      <div className={s.meta}>
        <span className={s.metaItem}>
          <CalendarIcon width={14} height={14} />
          {game.game_format?.label ?? '—'}
        </span>
        {game.location && (
          <span className={s.metaItem}>
            <PinIcon width={14} height={14} />
            {game.location}
          </span>
        )}
      </div>
    </div>
  );
}
