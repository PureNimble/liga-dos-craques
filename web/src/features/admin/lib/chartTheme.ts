/**
 * Cores e estilos partilhados dos gráficos (Recharts). A paleta categórica das
 * séries é fixa nos dois temas (dataviz: OKLCH L 0.48–0.67, CVD-safe); o
 * cromo do gráfico (eixos, grelha, tooltip, legenda) usa os tokens semânticos
 * de `shared/tokens/colors.css`, que já invertem por tema.
 */
export const SERIES = {
  players: '#199e70', // aqua (marca)
  games: '#3987e5', // azul
  goals: '#d95926', // laranja
  xp: '#9085e9', // violeta
  challenges: '#d55181', // rosa
} as const;

/** Fatias do donut — mesma paleta categórica, ordem fixa (validada para CVD). */
export const DONUT_COLORS = ['#199e70', '#3987e5', '#d95926', '#9085e9', '#c98500', '#d55181'];

/** Rampa sequencial (magnitude) — uma só hue, clara → escura invertida no escuro. */
export const HEAT_HUE = '#199e70';

export const AXIS_TICK = { fill: 'var(--chart-axis)', fontSize: 11 } as const;
export const GRID_STROKE = 'var(--chart-grid)';

/** Superfície do cartão — usada para abrir folga entre marcas empilhadas. */
export const SURFACE = 'var(--surface-panel)';

/** Realce neutro sob o cursor (barra/coluna em foco). */
export const CURSOR_FILL = 'var(--surface-ghost-hover)';

export const TOOLTIP_STYLE = {
  backgroundColor: 'var(--surface-tooltip)',
  border: '1px solid var(--border-default)',
  borderRadius: 10,
  color: 'var(--text-color)',
  fontSize: 12,
} as const;

export const TOOLTIP_LABEL_STYLE = { color: 'var(--text-subtle)' } as const;
export const LEGEND_STYLE = { fontSize: 12, color: 'var(--text-subtle)' } as const;
