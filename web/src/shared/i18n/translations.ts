/** Supported UI language codes. */
export type LangCode = 'pt' | 'en';

export const LANG_LABELS: Record<LangCode, string> = {
  pt: 'Português',
  en: 'English',
};

/** Shape of a translation dictionary — each feature exports its own (`<feature>.i18n.ts`). */
export type TranslationDict = Record<string, Record<LangCode, string>>;
