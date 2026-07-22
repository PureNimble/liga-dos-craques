import { SERIES } from './charts/chartTheme';
import s from './RankedBars.module.css';

export interface RankedItem {
  id: string;
  label: string;
  count: number;
  /** Texto à direita em vez da quota calculada (ex.: '% da base'). */
  caption?: string;
}

interface Props {
  items: RankedItem[];
  empty: string;
  color?: string;
  /** Mostra a quota de cada linha no total da lista. */
  showShare?: boolean;
}

/** Barras horizontais ordenadas (magnitude por categoria), feitas à mão em CSS. */
export function RankedBars({ items, empty, color = SERIES.goals, showShare = true }: Props) {
  const max = items.reduce((m, i) => Math.max(m, i.count), 0) || 1;
  const total = items.reduce((sum, i) => sum + i.count, 0);

  if (items.length === 0) return <p className={s.empty}>{empty}</p>;

  return (
    <ul className={s.list}>
      {items.map((item) => (
        <li key={item.id} className={s.row}>
          <span className={s.name} title={item.label}>
            {item.label}
          </span>
          <span className={s.track}>
            <span
              className={s.fill}
              style={{ width: `${(item.count / max) * 100}%`, backgroundColor: color }}
            />
          </span>
          <span className={s.value}>{item.count.toLocaleString('pt-PT')}</span>
          <span className={s.share}>
            {item.caption ??
              (showShare && total > 0 ? `${Math.round((item.count / total) * 100)}%` : '')}
          </span>
        </li>
      ))}
    </ul>
  );
}
