import type { TranslationDict } from '@/shared/i18n/translations';

export const achievementsTranslations = {
  'achievements.title': { pt: 'Conquistas', en: 'Achievements' },
  'achievements.hint': {
    pt: 'Toca numa conquista desbloqueada para a destacares no cartão.',
    en: 'Tap an unlocked achievement to feature it on your card.',
  },
} satisfies TranslationDict;

/** Valid translation keys for the achievements feature. */
export type AchievementsTranslationKey = keyof typeof achievementsTranslations;
