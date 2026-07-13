import type { PlayerXp } from './xpHooks';

/** Barra de nível/XP com progresso para o nível seguinte. */
export function XpBar({ xp }: { xp: PlayerXp }) {
  const atMax = xp.next_level_xp === null;
  const span = atMax ? 1 : xp.next_level_xp! - xp.level_min_xp;
  const gained = xp.total_xp - xp.level_min_xp;
  const pct = atMax ? 100 : Math.max(0, Math.min(100, Math.round((gained / span) * 100)));
  const toNext = atMax ? 0 : xp.next_level_xp! - xp.total_xp;

  return (
    <div className="rounded-2xl border border-white/[0.07] bg-gradient-to-br from-navy-850/70 to-navy-900 p-4 shadow-card">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="flex items-center gap-2.5 font-semibold text-slate-100">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-pitch-500 text-sm font-black text-navy-975 shadow-glow">
            {xp.level}
          </span>
          Nível {xp.level}
        </span>
        <span className="text-sm font-medium tabular-nums text-slate-400">{xp.total_xp} XP</span>
      </div>

      <div className="h-2.5 w-full overflow-hidden rounded-full bg-navy-950">
        <div
          className="h-full rounded-full bg-gradient-to-r from-pitch-500 to-pitch-400 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <p className="mt-1.5 text-right text-xs text-slate-500">
        {atMax ? 'Nível máximo atingido' : `${toNext} XP para o nível ${xp.level + 1}`}
      </p>
    </div>
  );
}
