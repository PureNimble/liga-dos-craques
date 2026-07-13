import type { PlayerStats } from './statsHooks';
import s from './StatsGrid.module.css';

interface StatTileProps {
  label: string;
  value: number | string;
  accent?: boolean;
}

function StatTile({ label, value, accent }: StatTileProps) {
  return (
    <div className={s.tile}>
      <p className={`${s.tileValue} ${accent ? s.tileValueAccent : ''}`}>{value}</p>
      <p className={s.tileLabel}>{label}</p>
    </div>
  );
}

/** Grelha de estatísticas individuais. `compact` mostra só o essencial. */
export function StatsGrid({ stats, compact = false }: { stats: PlayerStats; compact?: boolean }) {
  const winRate = stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0;

  if (compact) {
    return (
      <div className={s.compact}>
        <div className={s.grid4}>
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
    { key: 'w', n: stats.wins, cls: s.segWin },
    { key: 'd', n: stats.draws, cls: s.segDraw },
    { key: 'l', n: stats.losses, cls: s.segLoss },
  ].filter((x) => x.n > 0);

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
    <div className={s.full}>
      {/* Registo V-E-D */}
      <div className={s.record}>
        <div className={s.recordHead}>
          <span className={s.win}>{stats.wins}V</span>
          <span className={s.draw}>{stats.draws}E</span>
          <span className={s.loss}>{stats.losses}D</span>
        </div>
        <div className={s.bar}>
          {seg.map((x) => (
            <div key={x.key} className={x.cls} style={{ width: `${(x.n / total) * 100}%` }} />
          ))}
        </div>
      </div>

      {/* Tiles */}
      <div className={s.grid3}>
        {tiles.map((d) => (
          <StatTile key={d.label} {...d} />
        ))}
      </div>
    </div>
  );
}
