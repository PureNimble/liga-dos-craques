import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  AXIS_TICK,
  CURSOR_FILL,
  GRID_STROKE,
  LEGEND_STYLE,
  SURFACE,
  TOOLTIP_LABEL_STYLE,
  TOOLTIP_STYLE,
} from '../../lib/chartTheme';
import s from './chartEmpty.module.css';

export interface StackSeries {
  key: string;
  name: string;
  color: string;
}

interface Props {
  data: Array<Record<string, number | string>>;
  series: StackSeries[];
  height?: number;
  /** Mensagem quando não há dados — nunca deixar o cartão vazio. */
  empty?: string;
}

/** Barras empilhadas: composição de um total ao longo do tempo. */
export function StackedBars({
  data,
  series,
  height = 280,
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
        <Legend wrapperStyle={LEGEND_STYLE} iconType="circle" />
        {series.map((se, i) => (
          <Bar
            key={se.key}
            dataKey={se.key}
            name={se.name}
            stackId="total"
            fill={se.color}
            /* Fio da cor da superfície a separar os segmentos empilhados. */
            stroke={SURFACE}
            strokeWidth={1.5}
            maxBarSize={48}
            radius={i === series.length - 1 ? [4, 4, 0, 0] : undefined}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
