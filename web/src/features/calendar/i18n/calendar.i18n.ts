import type { TranslationDict } from '@/shared/i18n/translations';

/** Translation strings for the Calendar screen. */
export const calendarTranslations = {
  'calendar.title': { pt: 'Calendário', en: 'Calendar' },
  'calendar.prevMonth': { pt: 'Mês anterior', en: 'Previous month' },
  'calendar.nextMonth': { pt: 'Mês seguinte', en: 'Next month' },
  'calendar.game': { pt: 'Jogo', en: 'Game' },
} satisfies TranslationDict;

/** Valid translation keys for the Calendar screen. */
export type CalendarTranslationKey = keyof typeof calendarTranslations;
