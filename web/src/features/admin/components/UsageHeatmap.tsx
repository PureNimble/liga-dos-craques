import type { CSSProperties } from 'react';
import type { HeatRow } from '../hooks/analyticsHooks';
import s from './UsageHeatmap.module.css';

interface Props {
  rows: HeatRow[];
  /** Nome do que está a ser contado (ex.: 'ações'). */
  unit: string;
}

/**
 * Mapa de calor dia da semana × faixa horária (magnitude numa só hue).
 * Feito à mão em CSS — sem biblioteca de gráficos.
 */
export function UsageHeatmap({ rows, unit }: Props) {
  const max = rows.reduce((m, r) => Math.max(m, ...r.cells.map((c) => c.count)), 0);
  const weekdays = rows[0]?.cells.map((c) => c.label) ?? [];

  if (max === 0) return <p className={s.empty}>Sem {unit} no período.</p>;

  return (
    <div className={s.wrap}>
      <table className={s.grid}>
        <thead>
          <tr>
            <th className={s.corner} scope="col">
              <span className={s.srOnly}>Faixa horária</span>
            </th>
            {weekdays.map((d) => (
              <th key={d} className={s.colHead} scope="col">
                {d}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.band}>
              <th className={s.rowHead} scope="row">
                {row.band}
              </th>
              {row.cells.map((cell) => (
                <td
                  key={cell.label}
                  className={s.cell}
                  style={{ '--intensity': cell.count / max } as CSSProperties}
                  title={`${row.band}, ${cell.label}: ${cell.count} ${unit}`}
                >
                  {cell.count > 0 ? cell.count : ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className={s.legend}>
        <span className={s.legendLabel}>menos</span>
        {[0.15, 0.4, 0.65, 0.9].map((i) => (
          <span key={i} className={s.swatch} style={{ '--intensity': i } as CSSProperties} />
        ))}
        <span className={s.legendLabel}>
          mais (máx. {max} {unit})
        </span>
      </p>
    </div>
  );
}
