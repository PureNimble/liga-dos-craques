import { z } from 'zod';
import type { District } from '@/types/database';
import municipalitiesData from './municipalities.json';

/** Converte string vazia (inputs HTML) em null. */
const emptyToNull = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' || v === undefined ? null : v), schema);

export const DISTRICTS: District[] = [
  'Aveiro',
  'Beja',
  'Braga',
  'Bragança',
  'Castelo Branco',
  'Coimbra',
  'Évora',
  'Faro',
  'Guarda',
  'Leiria',
  'Lisboa',
  'Portalegre',
  'Porto',
  'Santarém',
  'Setúbal',
  'Viana do Castelo',
  'Vila Real',
  'Viseu',
  'Açores',
  'Madeira',
];

interface MunicipalityFeature {
  properties: { dis_name: string; con_name: string };
}
const municipalities = municipalitiesData as { features: MunicipalityFeature[] };

/** Concelhos por distrito (derivado do GeoJSON dos concelhos), para o Select em cascata. */
export const CONCELHOS_BY_DISTRICT: Record<string, string[]> = {};
for (const feature of municipalities.features) {
  const { dis_name, con_name } = feature.properties;
  (CONCELHOS_BY_DISTRICT[dis_name] ??= []).push(con_name);
}
for (const list of Object.values(CONCELHOS_BY_DISTRICT)) {
  list.sort((a, b) => a.localeCompare(b));
}

export const createPlaceSchema = z
  .object({
    name: z.string().trim().min(1, 'Indica o nome do campo').max(120),
    district: z.enum(DISTRICTS as [District, ...District[]], {
      errorMap: () => ({ message: 'Escolhe o distrito' }),
    }),
    concelho: z.string().trim().min(1, 'Escolhe o concelho'),
    latitude: z.coerce
      .number({ invalid_type_error: 'Indica a latitude' })
      .min(-90, 'Valor inválido')
      .max(90, 'Valor inválido'),
    longitude: z.coerce
      .number({ invalid_type_error: 'Indica a longitude' })
      .min(-180, 'Valor inválido')
      .max(180, 'Valor inválido'),
    phone: emptyToNull(z.string().trim().max(30, 'Máximo de 30 caracteres').nullable()),
    url: emptyToNull(z.string().trim().url('URL inválido').nullable()),
  })
  .refine((data) => (CONCELHOS_BY_DISTRICT[data.district] ?? []).includes(data.concelho), {
    message: 'Escolhe um concelho válido para o distrito',
    path: ['concelho'],
  });

export type CreatePlaceValues = z.infer<typeof createPlaceSchema>;
