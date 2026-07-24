import type { TranslationDict } from '@/shared/i18n/translations';

/** Translation strings for the Home screen. */
export const homeTranslations = {
  'home.welcome': { pt: 'Bem-vindo de volta', en: 'Welcome back' },
  'home.fallbackName': { pt: 'jogador', en: 'player' },
  'home.summaryTitle': { pt: 'O teu resumo', en: 'Your summary' },
  'home.seeAll': { pt: 'Ver tudo', en: 'See all' },
  'home.onboard.title': { pt: 'Completa o teu perfil', en: 'Complete your profile' },
  'home.onboard.missing': { pt: 'Falta {missing}.', en: 'Missing: {missing}.' },
  'home.onboard.and': { pt: 'e', en: 'and' },
  'home.onboard.field.position': { pt: 'a posição principal', en: 'your main position' },
  'home.onboard.field.foot': { pt: 'o pé preferido', en: 'your preferred foot' },
  'home.onboard.field.physical': { pt: 'os dados físicos', en: 'your physical stats' },
  'home.onboard.positionHint': {
    pt: 'A posição principal é o que o gerador de equipas usa para te encaixar.',
    en: 'Your main position is what the team generator uses to place you.',
  },
  'home.onboard.genericHint': {
    pt: 'Ajuda a malta a conhecer-te melhor.',
    en: 'Helps the group get to know you better.',
  },
  'home.onboard.cta': { pt: 'Completar perfil', en: 'Complete profile' },
  'home.quickAccess': { pt: 'Acessos rápidos', en: 'Quick access' },
  'home.action.games.label': { pt: 'Ver jogos', en: 'View games' },
  'home.action.games.hint': { pt: 'Próximos e resultados', en: 'Upcoming and results' },
  'home.action.rankings.label': { pt: 'Rankings', en: 'Rankings' },
  'home.action.rankings.hint': { pt: 'Classificações da malta', en: "The group's standings" },
} satisfies TranslationDict;

/** Valid translation keys for the Home screen. */
export type HomeTranslationKey = keyof typeof homeTranslations;
