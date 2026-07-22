/**
 * Cores e estilos partilhados dos gráficos (Recharts). Paleta categórica
 * validada para superfície escura (dataviz: OKLCH L 0.48–0.67, CVD-safe).
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

export const AXIS_TICK = { fill: '#94a3b8', fontSize: 11 } as const;
export const GRID_STROKE = '#23262e';

/** Superfície do cartão — usada para abrir folga entre marcas empilhadas. */
export const SURFACE = '#191c22';

export const TOOLTIP_STYLE = {
  backgroundColor: '#14161a',
  border: '1px solid #31353f',
  borderRadius: 10,
  color: '#e2e8f0',
  fontSize: 12,
} as const;

export const TOOLTIP_LABEL_STYLE = { color: '#94a3b8' } as const;
