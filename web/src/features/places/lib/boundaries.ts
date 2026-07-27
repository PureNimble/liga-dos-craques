import type { FeatureCollection, Geometry } from 'geojson';
import districtsData from './districts.json';
import municipalitiesData from './municipalities.json';

export interface DistrictProperties {
  dis_name: string;
  dis_code: string;
}
export interface MunicipalityProperties {
  dis_name: string;
  dis_code: string;
  con_name: string;
  con_code: string;
}
export type BoundaryProperties = DistrictProperties | MunicipalityProperties;

export function isMunicipality(props: BoundaryProperties): props is MunicipalityProperties {
  return 'con_name' in props;
}

export const districts = districtsData as FeatureCollection<Geometry, DistrictProperties>;
export const municipalities = municipalitiesData as FeatureCollection<
  Geometry,
  MunicipalityProperties
>;
