export const SERIES = {
  players: '#199e70',
  games: '#3987e5',
  goals: '#d95926',
  xp: '#9085e9',
  challenges: '#d55181',
} as const;

export const DONUT_COLORS = ['#199e70', '#3987e5', '#d95926', '#9085e9', '#c98500', '#d55181'];

export const HEAT_HUE = '#199e70';

export const AXIS_TICK = { fill: 'var(--chart-axis)', fontSize: 11 } as const;
export const GRID_STROKE = 'var(--chart-grid)';

export const SURFACE = 'var(--surface-panel)';

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
