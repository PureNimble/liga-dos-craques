import type { TranslationDict } from '@/shared/i18n/translations';

/** Textos da barra de nível/XP (`XpBar`). */
export const xpTranslations = {
  'xp.level': { pt: 'Nível {level}', en: 'Level {level}' },
  'xp.total': { pt: '{value} XP', en: '{value} XP' },
  'xp.maxLevel': { pt: 'Nível máximo atingido', en: 'Max level reached' },
  'xp.toNext': { pt: '{amount} XP para o nível {level}', en: '{amount} XP to level {level}' },
} satisfies TranslationDict;

export type XpTranslationKey = keyof typeof xpTranslations;
