import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { AXIS_TICK, GRID_STROKE, LEGEND_STYLE, TOOLTIP_LABEL_STYLE, TOOLTIP_STYLE } from '../../lib/chartTheme';
import emptyStyles from './chartEmpty.module.css';

export interface TrendSeries {
  key: string;
  name: string;
  color: string;
}

interface Props {
  data: Array<Record<string, number | string>>;
  series: TrendSeries[];
  height?: number;
  /** Uma série só dispensa legenda — o título já a nomeia. */
  legend?: boolean;
  /** Mensagem quando não há dados — nunca deixar o cartão vazio. */
  empty?: string;
}

/** Área empilhada suave para séries mensais (dataviz: multi-série categórica). */
export function TrendAreaChart({
  data,
  series,
  height = 260,
  legend = true,
  empty = 'Sem dados no período.',
}: Props) {
  if (data.length === 0) return <p className={emptyStyles.empty}>{empty}</p>;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -18 }}>
        <defs>
          {series.map((se) => (
            <linearGradient key={se.key} id={`grad-${se.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={se.color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={se.color} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
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
          cursor={{ stroke: GRID_STROKE }}
        />
        {legend && <Legend wrapperStyle={LEGEND_STYLE} iconType="plainline" />}
        {series.map((se) => (
          <Area
            key={se.key}
            type="monotone"
            dataKey={se.key}
            name={se.name}
            stroke={se.color}
            strokeWidth={2}
            fill={`url(#grad-${se.key})`}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}
