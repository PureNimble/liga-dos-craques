import type { ReactNode } from 'react';
import { Card } from '@/shared/components/ui';
import { ratingText } from '@/features/stats/ratingColor';

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
    <Card className="flex w-full items-center gap-5 sm:flex-1">
      <div className="shrink-0 text-center">
        <span className={`block font-display text-6xl font-extrabold tabular-nums leading-none ${ratingText(avgRating)}`}>
          {avgRating.toFixed(1)}
        </span>
        <span className="mt-1.5 block text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          Nota média
        </span>
      </div>

      <div className="h-16 w-px shrink-0 bg-white/10" />

      <div className="flex min-w-0 flex-col gap-2">
        <p className="text-sm text-slate-400">Média das avaliações por jogo</p>
        <div className="flex flex-wrap gap-1.5">
          {footLabel && <Chip>Pé {footLabel.toLowerCase()}</Chip>}
          {games != null && games > 0 && <Chip>{games} jogos</Chip>}
        </div>
        {featured && (
          <div className="mt-0.5 flex items-center gap-2">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pitch-500/10 text-lg ring-1 ring-pitch-500/25"
              aria-hidden
            >
              {featured.icon}
            </span>
            <span className="min-w-0 truncate text-xs font-medium text-slate-300">{featured.label}</span>
          </div>
        )}
      </div>
    </Card>
  );
}

function Chip({ children }: { children: ReactNode }) {
  return (
    <span className="w-fit rounded-full bg-white/[0.05] px-2.5 py-0.5 text-xs font-medium text-slate-300">
      {children}
    </span>
  );
}
