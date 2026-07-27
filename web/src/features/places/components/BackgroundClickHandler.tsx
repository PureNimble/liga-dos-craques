import { useMapEvents } from 'react-leaflet';

/** Invokes a callback on any map click that isn't already handled by a marker/layer (used to clear selection). */
export function BackgroundClickHandler({ onBackgroundClick }: { onBackgroundClick: () => void }) {
  useMapEvents({ click: onBackgroundClick });
  return null;
}
