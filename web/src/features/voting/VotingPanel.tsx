import { useMemo } from 'react';
import { Card } from '@/components/ui';
import type { GamePlayerWithProfile } from '@/features/games/gameHooks';
import { useGameAwards, useGameRatings } from './voteHooks';

interface VotingPanelProps {
  gameId: string;
  players: GamePlayerWithProfile[];
}

/**
 * MVP / Flop e avaliações do jogo — decididos pela app (melhor/pior rating;
 * empate desfeito pela consistência). Não há votação.
 */
export function VotingPanel({ gameId, players }: VotingPanelProps) {
  const { data: ratings } = useGameRatings(gameId);
  const { data: awards } = useGameAwards(gameId);

  const nameById = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of players) m.set(p.player_id, p.profile?.name ?? 'Jogador');
    return m;
  }, [players]);

  const ratingById = useMemo(() => {
    const m = new Map<string, number>();
    for (const r of ratings ?? []) if (r.rating != null) m.set(r.player_id, r.rating);
    return m;
  }, [ratings]);

  const ranked = useMemo(
    () => [...(ratings ?? [])].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0)),
    [ratings],
  );

  const mvpId = (awards ?? []).find((a) => a.category === 'mvp')?.player_id ?? null;
  const flopId = (awards ?? []).find((a) => a.category === 'flop')?.player_id ?? null;

  return (
    <Card>
      <h2 className="mb-3 font-bold text-slate-100">MVP / Flop</h2>

      <div className="grid grid-cols-2 gap-3">
        <AwardCard
          title="MVP"
          name={mvpId ? (nameById.get(mvpId) ?? '—') : null}
          rating={mvpId ? ratingById.get(mvpId) : undefined}
          accent
        />
        <AwardCard
          title="Flop"
          name={flopId ? (nameById.get(flopId) ?? '—') : null}
          rating={flopId ? ratingById.get(flopId) : undefined}
        />
      </div>

      {ranked.length > 0 && (
        <div className="mt-4 border-t border-white/[0.07] pt-4">
          <p className="mb-2 text-xs font-medium text-slate-400">Avaliações (0–10)</p>
          <ul className="flex flex-col gap-1">
            {ranked.map((r) => (
              <li key={r.player_id} className="flex items-center gap-2 text-sm">
                <span className="flex flex-1 items-center gap-1.5 truncate text-slate-200">
                  {nameById.get(r.player_id) ?? 'Jogador'}
                  {r.player_id === mvpId && (
                    <span className="rounded bg-pitch-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-pitch-300">
                      MVP
                    </span>
                  )}
                  {r.player_id === flopId && (
                    <span className="rounded bg-white/[0.06] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
                      Flop
                    </span>
                  )}
                </span>
                <RatingBadge value={r.rating} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  );
}

function AwardCard({
  title,
  name,
  rating,
  accent,
}: {
  title: string;
  name: string | null;
  rating?: number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        accent && name ? 'border-pitch-500/40 bg-pitch-500/5' : 'border-white/[0.07] bg-white/[0.02]'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{title}</p>
      {name ? (
        <div className="mt-1 flex items-center justify-between gap-2">
          <p className="truncate font-semibold text-slate-100">{name}</p>
          {rating != null && <RatingBadge value={rating} />}
        </div>
      ) : (
        <p className="mt-1 text-sm text-slate-500">—</p>
      )}
    </div>
  );
}

function RatingBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-xs text-slate-600">—</span>;
  const tone =
    value >= 7.5
      ? 'bg-pitch-500/20 text-pitch-300'
      : value >= 6
        ? 'bg-sky-500/15 text-sky-300'
        : value >= 5
          ? 'bg-amber-500/15 text-amber-300'
          : 'bg-red-500/15 text-red-300';
  return (
    <span className={`rounded-md px-1.5 py-0.5 text-xs font-bold tabular-nums ${tone}`}>
      {value.toFixed(1)}
    </span>
  );
}
