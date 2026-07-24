import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { DONUT_COLORS, LEGEND_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from '../../lib/chartTheme';
import s from './chartEmpty.module.css';

interface Props {
  data: Array<{ label: string; count: number }>;
  height?: number;
  /** Mensagem quando não há dados — nunca deixar o cartão vazio. */
  empty?: string;
}

/** Donut de contagens por categoria. */
export function CategoryDonut({ data, height = 220, empty = 'Sem dados no período.' }: Props) {
  if (data.length === 0 || data.every((d) => d.count === 0)) {
    return <p className={s.empty}>{empty}</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="count"
          nameKey="label"
          innerRadius="58%"
          outerRadius="82%"
          paddingAngle={2}
          stroke="none"
        >
          {data.map((_, i) => (
            <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
          ))}
        </Pie>
        <Tooltip contentStyle={TOOLTIP_STYLE} labelStyle={TOOLTIP_LABEL_STYLE} />
        <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}
