import { Avatar } from '@/shared/components/ui';
import type { CardAttribute } from './cardStats';

interface PlayerCardProps {
  name: string;
  photoUrl: string | null;
  overall: number;
  position: string;
  attributes: CardAttribute[];
  subtitle?: string | null;
}

/** Escalão do cartão por overall (cor de destaque tipo FIFA). */
function tier(overall: number) {
  if (overall >= 85)
    return { ring: 'ring-amber-300/60', accent: 'text-amber-300', glow: 'rgba(252,211,77,0.25)' };
  if (overall >= 70)
    return { ring: 'ring-slate-200/50', accent: 'text-slate-100', glow: 'rgba(226,232,240,0.18)' };
  return { ring: 'ring-orange-400/50', accent: 'text-orange-300', glow: 'rgba(251,146,60,0.2)' };
}

export function PlayerCard({
  name,
  photoUrl,
  overall,
  position,
  attributes,
  subtitle,
}: PlayerCardProps) {
  const t = tier(overall);
  return (
    <div
      className={`gloss relative mx-auto w-full max-w-[300px] overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-b from-navy-800 to-navy-975 p-5 ring-2 ${t.ring}`}
      style={{ boxShadow: `0 20px 60px -20px ${t.glow}` }}
    >
      {/* brilho de topo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 -top-10 h-32"
        style={{ background: `radial-gradient(60% 100% at 50% 0%, ${t.glow}, transparent 70%)` }}
      />

      <div className="relative flex items-start gap-3">
        <div className="flex flex-col items-center leading-none">
          <span className={`font-display text-4xl font-extrabold tabular-nums ${t.accent}`}>{overall}</span>
          <span className="mt-1 text-sm font-bold text-slate-200">{position}</span>
          <span className="mt-2 h-px w-6 bg-white/20" />
        </div>
        <div className="ml-auto">
          <Avatar name={name} src={photoUrl} size="xl" className="ring-2 ring-white/10" />
        </div>
      </div>

      <div className="relative mt-3 border-t border-white/10 pt-2 text-center">
        <p className="truncate text-lg font-black uppercase tracking-wide text-white">{name}</p>
        {subtitle && <p className="truncate text-xs text-slate-400">{subtitle}</p>}
      </div>

      <div className="relative mt-3 grid grid-cols-3 gap-x-4 gap-y-2">
        {attributes.map((a) => (
          <div key={a.key} className="flex items-baseline justify-center gap-1.5">
            <span className="text-base font-black tabular-nums text-white">{a.value}</span>
            <span className="text-[11px] font-semibold text-slate-400">{a.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
