import type { PlayerXp } from './xpHooks';
import s from './XpBar.module.css';

/** Barra de nível/XP com progresso para o nível seguinte. */
export function XpBar({ xp }: { xp: PlayerXp }) {
  const atMax = xp.next_level_xp === null;
  const span = atMax ? 1 : xp.next_level_xp! - xp.level_min_xp;
  const gained = xp.total_xp - xp.level_min_xp;
  const pct = atMax ? 100 : Math.max(0, Math.min(100, Math.round((gained / span) * 100)));
  const toNext = atMax ? 0 : xp.next_level_xp! - xp.total_xp;

  return (
    <div className={s.card}>
      <div className={s.head}>
        <span className={s.level}>
          <span className={s.levelBadge}>{xp.level}</span>
          Nível {xp.level}
        </span>
        <span className={s.total}>{xp.total_xp} XP</span>
      </div>

      <div className={s.track}>
        <div className={s.fill} style={{ width: `${pct}%` }} />
      </div>

      <p className={s.foot}>
        {atMax ? 'Nível máximo atingido' : `${toNext} XP para o nível ${xp.level + 1}`}
      </p>
    </div>
  );
}
