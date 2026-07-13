import type { PlayerStats } from './statsHooks';

interface StatTileProps {
  label: string;
  value: number | string;
  accent?: boolean;
}

function StatTile({ label, value, accent }: StatTileProps) {
  return (
    <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3 text-center transition hover:border-white/[0.12]">
      <p
        className={`font-display text-2xl font-bold tabular-nums ${
          accent ? 'text-pitch-300' : 'text-slate-100'
        }`}
      >
        {value}
      </p>
      <p className="mt-0.5 text-xs text-slate-400">{label}</p>
    </div>
  );
}

/** Grelha de estatísticas individuais. `compact` mostra só o essencial. */
export function StatsGrid({ stats, compact = false }: { stats: PlayerStats; compact?: boolean }) {
  const winRate = stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0;

  if (compact) {
    // @container + @xs: adapta as colunas à largura do PRÓPRIO bloco (não do
    // ecrã) — 2 colunas quando estreito, 4 quando há espaço.
    return (
      <div className="@container">
        <div className="grid grid-cols-2 gap-2 @xs:grid-cols-4">
          <StatTile label="Jogos" value={stats.games} />
          <StatTile label="Golos" value={stats.goals} accent />
          <StatTile label="Assist." value={stats.assists} />
          <StatTile label="Vitórias" value={stats.wins} />
        </div>
      </div>
    );
  }

  // Barra V-E-D proporcional.
  const total = Math.max(1, stats.games);
  const seg = [
    { key: 'w', n: stats.wins, cls: 'bg-pitch-500' },
    { key: 'd', n: stats.draws, cls: 'bg-slate-500' },
    { key: 'l', n: stats.losses, cls: 'bg-red-500' },
  ].filter((s) => s.n > 0);

  // Jogos e nota média já vivem no cabeçalho — aqui só o que não se repete.
  const tiles: StatTileProps[] = [
    { label: '% Vitórias', value: `${winRate}%`, accent: true },
    { label: 'Golos', value: stats.goals, accent: true },
    { label: 'Assistências', value: stats.assists },
    { label: 'Defesas', value: stats.saves },
    { label: 'MVPs', value: stats.mvps, accent: true },
    { label: 'Flops', value: stats.flops },
  ];

  return (
    <div className="@container flex flex-col gap-3">
      {/* Registo V-E-D */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-3">
        <div className="mb-2 flex items-center justify-between text-xs font-semibold">
          <span className="text-pitch-400">{stats.wins}V</span>
          <span className="text-slate-400">{stats.draws}E</span>
          <span className="text-red-400">{stats.losses}D</span>
        </div>
        <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-white/[0.05]">
          {seg.map((s) => (
            <div key={s.key} className={`${s.cls} rounded-full`} style={{ width: `${(s.n / total) * 100}%` }} />
          ))}
        </div>
      </div>

      {/* Tiles — 2 colunas quando estreito, 3 quando há espaço (por container). */}
      <div className="grid grid-cols-2 gap-2 @sm:grid-cols-3">
        {tiles.map((d) => (
          <StatTile key={d.label} {...d} />
        ))}
      </div>
    </div>
  );
}
