import { CalendarIcon, PinIcon } from '@/shared/components/ui/icons';
import { formatGameDateTime } from '@/shared/lib/datetime';
import { StatusBadge } from './StatusBadge';
import type { MatchClock } from './useMatchClock';
import type { GameWithFormat } from './gameHooks';

interface MatchHeaderProps {
  game: GameWithFormat;
  clock: MatchClock;
}

/** Nome curto e "crest" de cada equipa (A verde, B azul). */
const TEAMS = [
  { key: 'A' as const, name: 'Equipa A', ring: 'ring-pitch-500/60', chip: 'bg-pitch-500 text-navy-975' },
  { key: 'B' as const, name: 'Equipa B', ring: 'ring-sky-500/60', chip: 'bg-sky-500 text-navy-975' },
];

export function MatchHeader({ game, clock }: MatchHeaderProps) {
  const isLive = game.status === 'in_progress';
  const hasScore = game.team_a_score !== null || game.team_b_score !== null;
  const showScore = hasScore || isLive;
  const scoreA = game.team_a_score ?? 0;
  const scoreB = game.team_b_score ?? 0;

  return (
    <div className="gloss relative overflow-hidden rounded-2xl border border-white/[0.07] bg-gradient-to-b from-navy-850 to-navy-950">
      {/* brilho de relvado */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-16 h-40 bg-[radial-gradient(60%_100%_at_50%_0%,rgba(16,185,129,0.13),transparent_70%)]"
      />

      <div className="relative flex items-center justify-between px-4 pt-3.5">
        {isLive ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 text-xs font-bold uppercase tracking-wide text-red-400">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            Ao vivo
          </span>
        ) : (
          <StatusBadge status={game.status} />
        )}
        {isLive && (
          <span className="font-mono text-lg font-bold tabular-nums text-white">{clock.label}</span>
        )}
      </div>

      {/* Placar */}
      {showScore ? (
        <div className="relative grid grid-cols-3 items-center gap-2 px-4 py-5">
          {TEAMS.map((t, i) => (
            <div
              key={t.key}
              className={`flex flex-col items-center gap-2 ${i === 1 ? 'order-3' : 'order-1'}`}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-2xl text-lg font-black ring-2 ${t.chip} ${t.ring}`}
              >
                {t.key}
              </span>
              <span className="text-xs font-semibold text-slate-300">{t.name}</span>
            </div>
          ))}
          <div className="order-2 flex items-center justify-center gap-3">
            <span className="font-display text-5xl font-extrabold tabular-nums text-white">{scoreA}</span>
            <span className="text-2xl font-light text-slate-600">:</span>
            <span className="font-display text-5xl font-extrabold tabular-nums text-white">{scoreB}</span>
          </div>
        </div>
      ) : (
        <div className="relative px-4 py-5 text-center">
          <p className="font-display text-2xl font-bold capitalize text-white">
            {formatGameDateTime(game.scheduled_at)}
          </p>
        </div>
      )}

      {/* Meta */}
      <div className="relative flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-t border-navy-800 px-4 py-2.5 text-sm text-slate-400">
        <span className="inline-flex items-center gap-1">
          <CalendarIcon width={14} height={14} />
          {game.game_format?.label ?? '—'}
        </span>
        {game.location && (
          <span className="inline-flex items-center gap-1">
            <PinIcon width={14} height={14} />
            {game.location}
          </span>
        )}
      </div>
    </div>
  );
}
