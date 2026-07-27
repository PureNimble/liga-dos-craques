import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L, { type MarkerClusterGroup } from 'leaflet';
import type { Place } from '../hooks/placeHooks';
import { PLACE_ZOOM } from '../lib/mapStyles';
import s from '../places.module.css';

const PLACE_PIN_HTML = `
  <svg width="40" height="40" viewBox="0 0 24 24">
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" fill="var(--green-500)" stroke="var(--surface-page)" stroke-width="1.5"/>
    <circle cx="12" cy="10" r="2.5" fill="var(--surface-page)"/>
  </svg>
`;

function placeIcon(active: boolean) {
  return L.divIcon({
    className: active ? `${s.placeMarker} ${s.placeMarkerActive}` : s.placeMarker,
    html: PLACE_PIN_HTML,
    iconSize: [40, 40],
    iconAnchor: [20, 37],
    popupAnchor: [0, -34],
  });
}

/** Clustered place markers, kept in a plain Leaflet layer (not react-leaflet children) for clustering performance. */
export function ClusterLayer({
  places,
  highlightedId,
  onSelect,
}: {
  places: Place[];
  highlightedId: string | null;
  onSelect: (place: Place) => void;
}) {
  const map = useMap();
  const groupRef = useRef<MarkerClusterGroup | null>(null);

  useEffect(() => {
    const group = L.markerClusterGroup({
      maxClusterRadius: 50,
      disableClusteringAtZoom: PLACE_ZOOM,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      iconCreateFunction: (cluster) =>
        L.divIcon({
          html: `<span>${cluster.getChildCount()}</span>`,
          className: s.clusterIcon,
          iconSize: [36, 36],
        }),
    });
    groupRef.current = group;
    map.addLayer(group);
    return () => {
      map.removeLayer(group);
      groupRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    group.clearLayers();
    for (const place of places) {
      const marker = L.marker([place.latitude, place.longitude], {
        icon: placeIcon(highlightedId === place.id),
      });
      marker.bindTooltip(place.name, { direction: 'top', offset: [0, -34], className: s.tooltip });
      marker.on('click', (e) => {
        L.DomEvent.stopPropagation(e);
        onSelect(place);
      });
      group.addLayer(marker);
    }
  }, [places, highlightedId, onSelect]);

  return null;
}
