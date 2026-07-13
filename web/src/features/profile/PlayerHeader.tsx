import type { ReactNode } from 'react';
import { Card } from '@/shared/components/ui';
import { ratingText } from '@/features/stats/ratingColor';
import s from './PlayerHeader.module.css';

interface PlayerHeaderProps {
  footLabel?: string | null;
  avgRating?: number | null;
  games?: number;
  featured?: { icon: string; label: string } | null;
}

/** Cartão de nota média (estilo SofaScore) — fica ao lado do cartão do jogador. */
export function PlayerHeader({ footLabel, avgRating, games, featured }: PlayerHeaderProps) {
  if (avgRating == null) return null;
  return (
    <Card className={s.header}>
      <div className={s.rating}>
        <span className={`${s.ratingValue} ${ratingText(avgRating)}`}>{avgRating.toFixed(1)}</span>
        <span className={s.ratingLabel}>Nota média</span>
      </div>

      <div className={s.divider} />

      <div className={s.body}>
        <p className={s.caption}>Média das avaliações por jogo</p>
        <div className={s.chips}>
          {footLabel && <Chip>Pé {footLabel.toLowerCase()}</Chip>}
          {games != null && games > 0 && <Chip>{games} jogos</Chip>}
        </div>
        {featured && (
          <div className={s.featured}>
            <span className={s.featuredIcon} aria-hidden>
              {featured.icon}
            </span>
            <span className={s.featuredLabel}>{featured.label}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return <span className={s.chip}>{children}</span>;
}
