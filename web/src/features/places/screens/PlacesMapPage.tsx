import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { MapContainer, TileLayer, GeoJSON, ZoomControl, useMap, useMapEvents } from 'react-leaflet';
import L, {
  type GeoJSON as LeafletGeoJSON,
  type Map as LeafletMap,
  type Layer,
  type LeafletMouseEvent,
  type MarkerClusterGroup,
  type PathOptions,
} from 'leaflet';
import 'leaflet.markercluster';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Page,
  PageTitle,
  Select,
} from '@/shared/components/ui';
import { ImageIcon, PhoneIcon, PinIcon, SearchIcon } from '@/shared/components/ui/icons';
import { useTheme } from '@/shared/theme/useTheme';
import { useT } from '@/shared/i18n/useT';
import { usePlaces, usePlacesInDistrict, type Place } from '../hooks/placeHooks';
import { AddPlaceModal } from '../components/AddPlaceModal';
import { CONCELHOS_BY_DISTRICT, DISTRICTS } from '../schemas/place.schemas';
import districtsData from '../lib/districts.json';
import municipalitiesData from '../lib/municipalities.json';
import s from './PlacesMapPage.module.css';

function useIsLightTheme(): boolean {
  const { theme } = useTheme();
  const [systemLight, setSystemLight] = useState(
    () => window.matchMedia('(prefers-color-scheme: light)').matches,
  );
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => setSystemLight(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return theme === 'light' || (theme === 'system' && systemLight);
}

interface DistrictProperties {
  dis_name: string;
  dis_code: string;
}
interface MunicipalityProperties {
  dis_name: string;
  dis_code: string;
  con_name: string;
  con_code: string;
}
type BoundaryProperties = DistrictProperties | MunicipalityProperties;

function isMunicipality(props: BoundaryProperties): props is MunicipalityProperties {
  return 'con_name' in props;
}

const districts = districtsData as FeatureCollection<Geometry, DistrictProperties>;
const municipalities = municipalitiesData as FeatureCollection<Geometry, MunicipalityProperties>;

const PORTUGAL_CENTER: [number, number] = [39.6, -8.0];
const PORTUGAL_ZOOM = 7;
const PLACE_ZOOM = 13;

const SHEET_CLOSED_REM = 3;
const SHEET_MID_REM = 24;
const SHEET_DRAG_THRESHOLD = 10;
const SHEET_FLICK_VELOCITY = 0.5;

function remToPx(rem: number): number {
  const root = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return rem * root;
}

const baseStyle: PathOptions = {
  color: 'var(--accent-strong)',
  weight: 1.5,
  fillColor: 'var(--accent)',
  fillOpacity: 0.15,
};
const hoverStyle: PathOptions = { ...baseStyle, fillOpacity: 0.35 };

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

function BackgroundClickHandler({ onBackgroundClick }: { onBackgroundClick: () => void }) {
  useMapEvents({ click: onBackgroundClick });
  return null;
}

function ClusterLayer({
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

/** Interactive map of Portugal with clickable districts, a search/list panel, and list-map sync. */
export function PlacesMapPage() {
  const { t } = useT();
  const isLight = useIsLightTheme();
  const mapRef = useRef<LeafletMap | null>(null);
  const geoJsonRef = useRef<LeafletGeoJSON | null>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [selectedConcelho, setSelectedConcelho] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [sheetState, setSheetState] = useState<'closed' | 'mid' | 'full'>('mid');
  const nextSheetState: Record<typeof sheetState, typeof sheetState> = {
    closed: 'mid',
    mid: 'full',
    full: 'closed',
  };

  const sheetDragRef = useRef<{
    startY: number;
    startHeight: number;
    lastY: number;
    lastTime: number;
    velocity: number;
    moved: boolean;
  } | null>(null);
  const sheetDraggedRef = useRef(false);
  const [sheetDragHeight, setSheetDragHeight] = useState<number | null>(null);
  const [sheetDragging, setSheetDragging] = useState(false);

  function sheetAnchorHeight(state: typeof sheetState): number {
    if (state === 'closed') return remToPx(SHEET_CLOSED_REM);
    if (state === 'mid') return remToPx(SHEET_MID_REM);
    const layoutHeight = layoutRef.current?.getBoundingClientRect().height ?? 0;
    return Math.max(0, layoutHeight - remToPx(SHEET_CLOSED_REM));
  }

  function handleSheetPointerDown(e: ReactPointerEvent<HTMLButtonElement>) {
    e.currentTarget.setPointerCapture(e.pointerId);
    sheetDragRef.current = {
      startY: e.clientY,
      startHeight: sheetDragHeight ?? sheetAnchorHeight(sheetState),
      lastY: e.clientY,
      lastTime: performance.now(),
      velocity: 0,
      moved: false,
    };
    setSheetDragging(true);
  }

  function handleSheetPointerMove(e: ReactPointerEvent<HTMLButtonElement>) {
    const drag = sheetDragRef.current;
    if (!drag) return;
    const now = performance.now();
    const dt = now - drag.lastTime;
    if (dt > 0) drag.velocity = (drag.lastY - e.clientY) / dt;
    drag.lastY = e.clientY;
    drag.lastTime = now;
    const delta = drag.startY - e.clientY;
    if (Math.abs(delta) > SHEET_DRAG_THRESHOLD) drag.moved = true;
    const min = remToPx(SHEET_CLOSED_REM);
    const max = sheetAnchorHeight('full');
    setSheetDragHeight(Math.min(max, Math.max(min, drag.startHeight + delta)));
  }

  function handleSheetPointerEnd() {
    const drag = sheetDragRef.current;
    sheetDragRef.current = null;
    setSheetDragging(false);
    if (!drag || !drag.moved) {
      setSheetDragHeight(null);
      return;
    }
    sheetDraggedRef.current = true;
    const current = sheetDragHeight ?? drag.startHeight;
    let next: typeof sheetState;
    if (drag.velocity > SHEET_FLICK_VELOCITY) {
      next = sheetState === 'closed' ? 'mid' : 'full';
    } else if (drag.velocity < -SHEET_FLICK_VELOCITY) {
      next = sheetState === 'full' ? 'mid' : 'closed';
    } else {
      const anchors: Array<[typeof sheetState, number]> = [
        ['closed', sheetAnchorHeight('closed')],
        ['mid', sheetAnchorHeight('mid')],
        ['full', sheetAnchorHeight('full')],
      ];
      next = anchors.reduce(
        (best, [state, height]) =>
          Math.abs(height - current) < Math.abs(sheetAnchorHeight(best) - current) ? state : best,
        'mid' as typeof sheetState,
      );
    }
    setSheetState(next);
    setSheetDragHeight(null);
  }

  function handleHandleClick() {
    if (sheetDraggedRef.current) {
      sheetDraggedRef.current = false;
      return;
    }
    setSheetState((v) => nextSheetState[v]);
  }

  const { data: allPlaces } = usePlaces();
  const { data: districtPlaces } = usePlacesInDistrict(selectedDistrict);

  const visiblePlaces = useMemo(
    () => (selectedDistrict ? (districtPlaces ?? []) : (allPlaces ?? [])),
    [selectedDistrict, districtPlaces, allPlaces],
  );
  const filteredPlaces = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visiblePlaces.filter((p) => {
      if (selectedConcelho && p.concelho !== selectedConcelho) return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [visiblePlaces, search, selectedConcelho]);

  const districtCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of allPlaces ?? []) m.set(p.district, (m.get(p.district) ?? 0) + 1);
    return m;
  }, [allPlaces]);
  const concelhoCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const p of districtPlaces ?? []) m.set(p.concelho, (m.get(p.concelho) ?? 0) + 1);
    return m;
  }, [districtPlaces]);

  const districtMunicipalities = useMemo(() => {
    if (!selectedDistrict) return null;
    return {
      type: 'FeatureCollection',
      features: municipalities.features.filter((f) => f.properties.dis_name === selectedDistrict),
    } as FeatureCollection<Geometry, MunicipalityProperties>;
  }, [selectedDistrict]);

  const activeData = districtMunicipalities ?? districts;

  function selectDistrict(name: string) {
    setSelectedDistrict(name);
    setSelectedConcelho(null);
    const feature = districts.features.find((f) => f.properties.dis_name === name);
    if (feature) {
      mapRef.current?.fitBounds(L.geoJSON(feature).getBounds(), { padding: [16, 16] });
    }
  }

  function goBack() {
    if (selectedDistrict) {
      setSelectedDistrict(null);
      setSelectedConcelho(null);
      mapRef.current?.setView(PORTUGAL_CENTER, PORTUGAL_ZOOM);
    }
  }

  function selectConcelho(name: string) {
    setSelectedConcelho(name);
    const feature = municipalities.features.find(
      (f) => f.properties.dis_name === selectedDistrict && f.properties.con_name === name,
    );
    if (feature) {
      mapRef.current?.fitBounds(L.geoJSON(feature).getBounds(), { padding: [16, 16] });
    }
  }

  function handleDistrictSelect(e: ChangeEvent<HTMLSelectElement>) {
    if (e.target.value) selectDistrict(e.target.value);
    else goBack();
    setSheetState('closed');
  }

  function handleConcelhoSelect(e: ChangeEvent<HTMLSelectElement>) {
    if (e.target.value) {
      selectConcelho(e.target.value);
      setSheetState('closed');
      return;
    }
    setSelectedConcelho(null);
    setSheetState('closed');
    const feature = districts.features.find((f) => f.properties.dis_name === selectedDistrict);
    if (feature) {
      mapRef.current?.fitBounds(L.geoJSON(feature).getBounds(), { padding: [16, 16] });
    }
  }

  function fitToActiveArea() {
    if (selectedConcelho) {
      const feature = municipalities.features.find(
        (f) =>
          f.properties.dis_name === selectedDistrict && f.properties.con_name === selectedConcelho,
      );
      if (feature) {
        mapRef.current?.flyToBounds(L.geoJSON(feature).getBounds(), {
          padding: [16, 16],
          duration: 0.5,
        });
        return;
      }
    }
    if (selectedDistrict) {
      const feature = districts.features.find((f) => f.properties.dis_name === selectedDistrict);
      if (feature) {
        mapRef.current?.flyToBounds(L.geoJSON(feature).getBounds(), {
          padding: [16, 16],
          duration: 0.5,
        });
        return;
      }
    }
    mapRef.current?.flyTo(PORTUGAL_CENTER, PORTUGAL_ZOOM, { duration: 0.5 });
  }

  function selectPlace(place: Place, source: 'list' | 'map') {
    setHighlightedId(place.id);
    setSelectedPlace(place);
    if (source === 'list') {
      const zoom = Math.max(mapRef.current?.getZoom() ?? PLACE_ZOOM, PLACE_ZOOM);
      mapRef.current?.flyTo([place.latitude, place.longitude], zoom, { duration: 0.5 });
    }
    setSheetState((v) => (v === 'closed' ? 'mid' : v));
  }

  const tooltipContentFor = useCallback(
    (props: BoundaryProperties): string => {
      const municipality = isMunicipality(props);
      const label = municipality ? props.con_name : props.dis_name;
      const count = municipality
        ? (concelhoCounts.get(props.con_name) ?? 0)
        : (districtCounts.get(props.dis_name) ?? 0);
      return `${label} <span class="${s.tooltipCount}">${t('places.fieldsCount', { count })}</span>`;
    },
    [concelhoCounts, districtCounts, t],
  );

  function handleEachFeature(feature: Feature<Geometry, BoundaryProperties>, layer: Layer) {
    const props = feature.properties;
    const municipality = isMunicipality(props);
    layer.bindTooltip(tooltipContentFor(props), { sticky: true, className: s.tooltip });
    layer.on({
      click: (e: LeafletMouseEvent) => {
        L.DomEvent.stopPropagation(e);
        if (municipality) {
          selectConcelho(props.con_name);
        } else {
          selectDistrict(props.dis_name);
        }
      },
      mouseover: () => {
        if ('setStyle' in layer) (layer as L.Polygon).setStyle(hoverStyle);
      },
      mouseout: () => {
        if ('setStyle' in layer) (layer as L.Polygon).setStyle(baseStyle);
      },
    });
  }

  useEffect(() => {
    const layer = geoJsonRef.current;
    if (!layer) return;
    layer.eachLayer((l) => {
      const feature = (l as Layer & { feature?: Feature<Geometry, BoundaryProperties> }).feature;
      if (feature) l.getTooltip()?.setContent(tooltipContentFor(feature.properties));
    });
  }, [tooltipContentFor]);

  const emptyTitle = search.trim()
    ? t('places.empty.noResults.title')
    : selectedConcelho
      ? t('places.empty.concelho.title')
      : selectedDistrict
        ? t('places.empty.district.title')
        : t('places.empty.title');
  const emptyDescription = search.trim()
    ? t('places.empty.noResults.description')
    : selectedConcelho
      ? t('places.empty.concelho.description')
      : selectedDistrict
        ? t('places.empty.district.description')
        : t('places.empty.description');

  return (
    <Page>
      <div className={s.header}>
        <PageTitle>{t('places.title')}</PageTitle>
        <Button onClick={() => setShowAddModal(true)}>{t('places.addField')}</Button>
      </div>

      <div className={s.layout} ref={layoutRef}>
        <Card
          className={`${s.panel} ${sheetState === 'full' ? s.panelFull : ''} ${sheetState === 'closed' && sheetDragHeight === null ? s.panelClosed : ''}`}
          padded={false}
          style={
            sheetDragHeight !== null ? { height: sheetDragHeight, transition: 'none' } : undefined
          }
        >
          <button
            type="button"
            className={[s.handle, sheetDragging ? s.handleDragging : ''].filter(Boolean).join(' ')}
            aria-expanded={sheetState !== 'closed'}
            aria-label={t('places.toggleList')}
            onClick={handleHandleClick}
            onPointerDown={handleSheetPointerDown}
            onPointerMove={handleSheetPointerMove}
            onPointerUp={handleSheetPointerEnd}
            onPointerCancel={handleSheetPointerEnd}
          >
            <span className={s.handleBar} />
          </button>

          {selectedPlace ? (
            <div className={s.detail}>
              <button
                type="button"
                className={s.backButton}
                onClick={(e) => {
                  e.currentTarget.blur();
                  setSelectedPlace(null);
                  fitToActiveArea();
                }}
              >
                {t('places.back')}
              </button>

              <div className={s.detailScroll}>
                <div className={s.detailImage}>
                  <ImageIcon width={28} height={28} />
                </div>

                <h3 className={s.detailName}>{selectedPlace.name}</h3>

                <div className={s.detailRows}>
                  <span className={s.detailRow}>
                    <PinIcon width={16} height={16} />
                    {selectedPlace.concelho}, {selectedPlace.district}
                  </span>
                  {selectedPlace.phone && (
                    <span className={s.detailRow}>
                      <PhoneIcon width={16} height={16} />
                      {selectedPlace.phone}
                    </span>
                  )}
                </div>

                <div className={s.detailActions}>
                  <a
                    className={s.detailActionLink}
                    href={`https://www.google.com/maps/dir/?api=1&destination=${selectedPlace.latitude},${selectedPlace.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {t('places.directions')}
                  </a>
                  {selectedPlace.url && (
                    <a
                      className={s.detailActionLink}
                      href={selectedPlace.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {t('places.viewLink')}
                    </a>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <>
              {(selectedDistrict || selectedConcelho) && (
                <button
                  type="button"
                  className={s.backButton}
                  onClick={(e) => {
                    e.currentTarget.blur();
                    goBack();
                  }}
                >
                  {t('places.back')}
                </button>
              )}

              <div className={s.filters}>
                <Field label={t('places.filterDistrict')} htmlFor="places-district-filter">
                  <Select
                    id="places-district-filter"
                    value={selectedDistrict ?? ''}
                    onChange={handleDistrictSelect}
                  >
                    <option value="">{t('places.allDistricts')}</option>
                    {DISTRICTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label={t('places.filterConcelho')} htmlFor="places-concelho-filter">
                  <Select
                    id="places-concelho-filter"
                    value={selectedConcelho ?? ''}
                    onChange={handleConcelhoSelect}
                    disabled={!selectedDistrict}
                  >
                    <option value="">{t('places.allConcelhos')}</option>
                    {(selectedDistrict ? (CONCELHOS_BY_DISTRICT[selectedDistrict] ?? []) : []).map(
                      (c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ),
                    )}
                  </Select>
                </Field>
              </div>

              <div className={s.searchRow}>
                <SearchIcon width={16} height={16} className={s.searchIcon} />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder={t('places.searchPlaceholder')}
                  className={s.searchInput}
                />
              </div>

              {filteredPlaces.length === 0 ? (
                <EmptyState
                  icon={<PinIcon width={26} height={26} />}
                  title={emptyTitle}
                  description={emptyDescription}
                />
              ) : (
                <ul className={s.list}>
                  {filteredPlaces.map((place) => (
                    <li key={place.id}>
                      <button
                        type="button"
                        onClick={() => selectPlace(place, 'list')}
                        className={`${s.placeCard} ${highlightedId === place.id ? s.placeCardActive : ''}`}
                      >
                        <span className={s.placeCardName}>{place.name}</span>
                        <span className={s.placeCardMeta}>
                          {place.concelho}, {place.district}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Card>

        <div className={s.mapWrap}>
          <MapContainer
            ref={mapRef}
            className={s.map}
            center={PORTUGAL_CENTER}
            zoom={PORTUGAL_ZOOM}
            scrollWheelZoom
            zoomControl={false}
          >
            <ZoomControl position="topright" />
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
              url={`https://{s}.basemaps.cartocdn.com/${isLight ? 'light_all' : 'dark_all'}/{z}/{x}/{y}{r}.png`}
            />
            <BackgroundClickHandler onBackgroundClick={goBack} />
            <GeoJSON
              ref={geoJsonRef}
              key={selectedDistrict ?? 'country'}
              data={activeData}
              style={baseStyle}
              onEachFeature={handleEachFeature}
            />

            <ClusterLayer
              places={filteredPlaces}
              highlightedId={highlightedId}
              onSelect={(place) => selectPlace(place, 'map')}
            />
          </MapContainer>
        </div>
      </div>

      {showAddModal && (
        <AddPlaceModal
          onClose={() => setShowAddModal(false)}
          defaultDistrict={selectedDistrict ?? undefined}
        />
      )}
    </Page>
  );
}
