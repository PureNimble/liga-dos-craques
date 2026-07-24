import { useT } from '@/shared/i18n/useT';
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
  const { t } = useT();
  const winRate = stats.games > 0 ? Math.round((stats.wins / stats.games) * 100) : 0;

  if (compact) {
    return (
      <div className={s.compact}>
        <div className={s.grid4}>
          <StatTile label={t('stats.games')} value={stats.games} />
          <StatTile label={t('stats.goals')} value={stats.goals} accent />
          <StatTile label={t('stats.assistsShort')} value={stats.assists} />
          <StatTile label={t('stats.wins')} value={stats.wins} />
        </div>
      </div>
    );
  }

  // Barra V-E-D proporcional. Normaliza pela SOMA dos segmentos, não por
  // `games`: `v_player_stats.games` conta todas as participações, mas V/E/D só
  // contam com equipa e resultado preenchidos — um jogo sem equipa/resultado
  // entra em `games` e em nenhum segmento, deixando a barra por encher.
  const seg = [
    { key: 'w', n: stats.wins, cls: s.segWin },
    { key: 'd', n: stats.draws, cls: s.segDraw },
    { key: 'l', n: stats.losses, cls: s.segLoss },
  ].filter((x) => x.n > 0);

  // Jogos e nota média já vivem no cabeçalho — aqui só o que não se repete.
  const tiles: StatTileProps[] = [
    { label: t('stats.winRate'), value: `${winRate}%`, accent: true },
    { label: t('stats.goals'), value: stats.goals, accent: true },
    { label: t('stats.assists'), value: stats.assists },
    { label: t('stats.saves'), value: stats.saves },
    { label: t('stats.mvps'), value: stats.mvps, accent: true },
    { label: t('stats.flops'), value: stats.flops },
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
          {/* flex-grow (não width %): reparte o espaço LIVRE, já descontados os
              gaps do flex — com larguras em % os 2px de cada gap sobravam. */}
          {seg.map((x) => (
            <div key={x.key} className={x.cls} style={{ flex: x.n }} />
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
