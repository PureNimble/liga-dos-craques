import { useMemo, useRef, useState } from 'react';
import { MapContainer, TileLayer, GeoJSON, Marker, Tooltip, ZoomControl, useMapEvents } from 'react-leaflet';
import L, { type Map as LeafletMap, type Layer, type LeafletMouseEvent, type PathOptions } from 'leaflet';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import 'leaflet/dist/leaflet.css';
import { Button, Page, PageTitle } from '@/shared/components/ui';
import { usePlacesInDistrict, type Place } from './placeHooks';
import { AddPlaceModal } from './AddPlaceModal';
import { PlaceDetailModal } from './PlaceDetailModal';
import districtsData from './districts.json';
import municipalitiesData from './municipalities.json';
import s from './PlacesMapPage.module.css';

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

// Centro fixo em Portugal continental — o bounding box de todos os distritos
// (inclui Açores/Madeira, muito a oeste/sul) dava uma vista inicial mal enquadrada.
const PORTUGAL_CENTER: [number, number] = [39.6, -8.0];
const PORTUGAL_ZOOM = 7;

const baseStyle: PathOptions = {
  color: 'var(--accent-strong)',
  weight: 1.5,
  fillColor: 'var(--accent)',
  fillOpacity: 0.15,
};
const hoverStyle: PathOptions = { ...baseStyle, fillOpacity: 0.35 };

// Pin de campo individual — mesmo desenho do PinIcon (shared/icons.tsx), a
// cores da app; escrito à mão porque o L.divIcon corre fora da árvore do React.
const PLACE_PIN_HTML = `
  <svg width="40" height="40" viewBox="0 0 24 24">
    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" fill="var(--accent)" stroke="var(--surface-page)" stroke-width="1.5"/>
    <circle cx="12" cy="10" r="2.5" fill="var(--surface-page)"/>
  </svg>
`;

function placeIcon() {
  return L.divIcon({
    className: s.placeMarker,
    html: PLACE_PIN_HTML,
    iconSize: [40, 40],
    iconAnchor: [20, 37],
    popupAnchor: [0, -34],
  });
}

/** Clicar no mapa fora de qualquer forma (mar, país vizinho) volta à vista de Portugal. */
function BackgroundClickHandler({ onBackgroundClick }: { onBackgroundClick: () => void }) {
  useMapEvents({ click: onBackgroundClick });
  return null;
}

/** Mapa de Portugal com distritos clicáveis — ao escolher um distrito mostra os campos lá dentro. */
export function PlacesMapPage() {
  const mapRef = useRef<LeafletMap | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);

  const { data: districtPlaces } = usePlacesInDistrict(selectedDistrict);

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
    const feature = districts.features.find((f) => f.properties.dis_name === name);
    if (feature) {
      mapRef.current?.fitBounds(L.geoJSON(feature).getBounds(), { padding: [16, 16] });
    }
  }

  function goBack() {
    if (selectedDistrict) {
      setSelectedDistrict(null);
      mapRef.current?.setView(PORTUGAL_CENTER, PORTUGAL_ZOOM);
    }
  }

  function handleEachFeature(feature: Feature<Geometry, BoundaryProperties>, layer: Layer) {
    const props = feature.properties;
    const label = isMunicipality(props) ? props.con_name : props.dis_name;
    layer.bindTooltip(label, { sticky: true, className: s.tooltip });
    layer.on({
      click: (e: LeafletMouseEvent) => {
        // Sem isto, o clique também chegaria ao 'click' do mapa (BackgroundClickHandler)
        // e voltaria à vista de Portugal no mesmo gesto que acabou de escolher o distrito.
        L.DomEvent.stopPropagation(e);
        if (isMunicipality(props)) {
          mapRef.current?.fitBounds(L.geoJSON(feature).getBounds(), { padding: [16, 16] });
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

  return (
    <Page>
      <div className={s.header}>
        <PageTitle>Mapa de campos</PageTitle>
        <Button onClick={() => setShowAddModal(true)}>Adicionar campo</Button>
      </div>

      <div className={s.mapWrap}>
        {selectedDistrict ? (
          <div className={s.overlay}>
            <button type="button" className={s.backButton} onClick={goBack}>
              ← Voltar
            </button>
            <span className={s.districtLabel}>{selectedDistrict}</span>
          </div>
        ) : (
          <div className={s.hint}>Seleciona um distrito no mapa para veres os campos</div>
        )}

        <MapContainer
          ref={mapRef}
          className={s.map}
          center={PORTUGAL_CENTER}
          zoom={PORTUGAL_ZOOM}
          scrollWheelZoom
          zoomControl={false}
        >
          <ZoomControl position="bottomleft" />
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />
          <BackgroundClickHandler onBackgroundClick={goBack} />
          <GeoJSON
            key={selectedDistrict ?? 'country'}
            data={activeData}
            style={baseStyle}
            onEachFeature={handleEachFeature}
          />

          {selectedDistrict &&
            districtPlaces?.map((place) => (
              <Marker
                key={place.id}
                position={[place.latitude, place.longitude]}
                icon={placeIcon()}
                eventHandlers={{
                  click: (e) => {
                    L.DomEvent.stopPropagation(e);
                    setSelectedPlace(place);
                  },
                }}
              >
                <Tooltip direction="top" offset={[0, -34]} className={s.tooltip}>
                  {place.name}
                </Tooltip>
              </Marker>
            ))}
        </MapContainer>
      </div>

      {showAddModal && (
        <AddPlaceModal
          onClose={() => setShowAddModal(false)}
          defaultDistrict={selectedDistrict ?? undefined}
        />
      )}

      {selectedPlace && (
        <PlaceDetailModal place={selectedPlace} onClose={() => setSelectedPlace(null)} />
      )}
    </Page>
  );
}
