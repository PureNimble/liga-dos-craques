import type { ReactNode } from 'react';
import { Card, LockOverlay } from '@/shared/components/ui';
import { NamedIcon } from '@/shared/components/ui/icons';
import { ratingText } from '@/features/stats/ratingColor';
import { MIN_GAMES_FOR_STATS, statsLockMessage } from '@/features/stats/statsHooks';
import s from './PlayerHeader.module.css';

interface PlayerHeaderProps {
  footLabel?: string | null;
  avgRating?: number | null;
  games?: number;
  own?: boolean;
  featured?: { icon: string; label: string } | null;
}

/** Cartão de nota média (estilo SofaScore) — fica ao lado do cartão do jogador. */
export function PlayerHeader({
  footLabel,
  avgRating,
  games,
  own = false,
  featured,
}: PlayerHeaderProps) {
  // Bloqueado até jogar o mínimo de jogos: mostra o cartão desfocado com cadeado.
  if (avgRating == null || (games ?? 0) < MIN_GAMES_FOR_STATS) {
    return (
      <LockOverlay locked className={s.lockWrap} message={statsLockMessage(own)}>
        <Card className={s.header}>
          <div className={s.rating}>
            <span className={`${s.ratingValue} ${ratingText(7.4)}`}>7.4</span>
            <span className={s.ratingLabel}>Nota média</span>
          </div>
          <div className={s.divider} />
          <div className={s.body}>
            <p className={s.caption}>Média das avaliações por jogo</p>
            <div className={s.chips}>
              <Chip>{MIN_GAMES_FOR_STATS} jogos</Chip>
            </div>
          </div>
        </Card>
      </LockOverlay>
    );
  }
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
              <NamedIcon name={featured.icon} width={18} height={18} />
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
