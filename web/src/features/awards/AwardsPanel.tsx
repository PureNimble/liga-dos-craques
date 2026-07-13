import { useMemo } from 'react';
import { Card } from '@/shared/components/ui';
import type { GamePlayerWithProfile } from '@/features/games/gameHooks';
import { useGameAwards, useGameRatings } from './awardHooks';
import s from './AwardsPanel.module.css';

interface AwardsPanelProps {
  gameId: string;
  players: GamePlayerWithProfile[];
}

/**
 * MVP / Flop e avaliações do jogo — decididos pela app (melhor/pior rating;
 * empate desfeito pela consistência). Não há votação.
 */
export function AwardsPanel({ gameId, players }: AwardsPanelProps) {
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
      <h2 className={s.head}>MVP / Flop</h2>

      <div className={s.grid}>
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
        <div className={s.ratings}>
          <p className={s.ratingsLabel}>Avaliações (0–10)</p>
          <ul className={s.list}>
            {ranked.map((r) => (
              <li key={r.player_id} className={s.row}>
                <span className={s.rowName}>
                  {nameById.get(r.player_id) ?? 'Jogador'}
                  {r.player_id === mvpId && <span className={s.tagMvp}>MVP</span>}
                  {r.player_id === flopId && <span className={s.tagFlop}>Flop</span>}
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
    <div className={`${s.card} ${accent && name ? s.cardAccent : ''}`}>
      <p className={s.cardTitle}>{title}</p>
      {name ? (
        <div className={s.cardRow}>
          <p className={s.cardName}>{name}</p>
          {rating != null && <RatingBadge value={rating} />}
        </div>
      ) : (
        <p className={s.cardEmpty}>—</p>
      )}
    </div>
  );
}

function RatingBadge({ value }: { value: number | null }) {
  if (value == null) return <span className={s.badgeNull}>—</span>;
  const tone =
    value >= 7.5 ? s.badgeTop : value >= 6 ? s.badgeGood : value >= 5 ? s.badgeMid : s.badgeLow;
  return <span className={`${s.badge} ${tone}`}>{value.toFixed(1)}</span>;
}
