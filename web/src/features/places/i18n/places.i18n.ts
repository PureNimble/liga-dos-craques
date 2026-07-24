import type { TranslationDict } from '@/shared/i18n/translations';

export const placesTranslations = {
  'places.title': { pt: 'Mapa de campos', en: 'Field map' },
  'places.addField': { pt: 'Adicionar campo', en: 'Add field' },
  'places.searchPlaceholder': { pt: 'Pesquisar campos…', en: 'Search fields…' },
  'places.back': { pt: '← Voltar', en: '← Back' },
  'places.toggleList': { pt: 'Expandir/recolher a lista', en: 'Expand/collapse the list' },
  'places.filterDistrict': { pt: 'Distrito', en: 'District' },
  'places.filterConcelho': { pt: 'Concelho', en: 'Municipality' },
  'places.allDistricts': { pt: 'Todos os distritos', en: 'All districts' },
  'places.allConcelhos': { pt: 'Todos os concelhos', en: 'All municipalities' },
  'places.fieldsCount': { pt: '{count} campos', en: '{count} fields' },
  'places.empty.title': { pt: 'Ainda não há campos', en: 'No fields yet' },
  'places.empty.description': {
    pt: 'Adiciona o primeiro campo para o veres aqui e no mapa.',
    en: 'Add the first field to see it here and on the map.',
  },
  'places.empty.noResults.title': { pt: 'Sem resultados', en: 'No results' },
  'places.empty.noResults.description': {
    pt: 'Nenhum campo corresponde à tua pesquisa.',
    en: 'No field matches your search.',
  },
  'places.empty.district.title': {
    pt: 'Sem campos neste distrito',
    en: 'No fields in this district',
  },
  'places.empty.district.description': {
    pt: 'Sê o primeiro a adicionar um campo aqui.',
    en: 'Be the first to add a field here.',
  },
  'places.empty.concelho.title': {
    pt: 'Sem campos neste concelho',
    en: 'No fields in this municipality',
  },
  'places.empty.concelho.description': {
    pt: 'Sê o primeiro a adicionar um campo aqui.',
    en: 'Be the first to add a field here.',
  },
  'places.directions': { pt: 'Direções', en: 'Directions' },
  'places.viewLink': { pt: 'Ver ligação', en: 'View link' },
} satisfies TranslationDict;

/** Valid translation keys for the places feature. */
export type PlacesTranslationKey = keyof typeof placesTranslations;
