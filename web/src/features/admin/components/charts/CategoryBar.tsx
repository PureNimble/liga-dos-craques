import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AXIS_TICK,
  CURSOR_FILL,
  GRID_STROKE,
  SERIES,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_STYLE,
} from '../../lib/chartTheme';
import s from './chartEmpty.module.css';

interface Props {
  data: Array<{ label: string; count: number }>;
  color?: string;
  height?: number;
  /** Mensagem quando não há dados — nunca deixar o cartão vazio. */
  empty?: string;
}

/** Barras verticais para contagens por categoria (hue única). */
export function CategoryBar({
  data,
  color = SERIES.players,
  height = 220,
  empty = 'Sem dados no período.',
}: Props) {
  if (data.length === 0) return <p className={s.empty}>{empty}</p>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
        <XAxis dataKey="label" tick={AXIS_TICK} tickLine={false} axisLine={false} />
        <YAxis
          tick={AXIS_TICK}
          tickLine={false}
          axisLine={false}
          width={40}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={TOOLTIP_LABEL_STYLE}
          cursor={{ fill: CURSOR_FILL }}
        />
        <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={40}>
          {data.map((_, i) => (
            <Cell key={i} fill={color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
