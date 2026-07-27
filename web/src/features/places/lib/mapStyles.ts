import type { PathOptions } from 'leaflet';

export const PLACE_ZOOM = 13;

export const baseStyle: PathOptions = {
  color: 'var(--accent-strong)',
  weight: 1.5,
  fillColor: 'var(--accent)',
  fillOpacity: 0.15,
};
export const hoverStyle: PathOptions = { ...baseStyle, fillOpacity: 0.35 };
