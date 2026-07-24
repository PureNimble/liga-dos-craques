export type LangCode = 'pt' | 'en';

export const LANG_LABELS: Record<LangCode, string> = {
  pt: 'Português',
  en: 'English',
};

/** Forma de um dicionário de traduções — cada feature exporta o seu (`<feature>.i18n.ts`). */
export type TranslationDict = Record<string, Record<LangCode, string>>;
