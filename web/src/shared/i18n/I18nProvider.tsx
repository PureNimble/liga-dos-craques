import { createContext, useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { LangCode, TranslationDict } from './translations';

const STORAGE_KEY = 'peladinhas-lang';

export interface I18nContextValue {
  lang: LangCode;
  setLang: (lang: LangCode) => void;
  /** Chave em falta no dicionário: devolve a própria chave (visível, não rebenta). */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const I18nContext = createContext<I18nContextValue | undefined>(undefined);

function readStoredLang(): LangCode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'en' ? 'en' : 'pt';
  } catch {
    return 'pt';
  }
}

/**
 * Motor de i18n (PT/EN), agnóstico do conteúdo — o dicionário vem de fora
 * (`app/i18nRegistry.ts` junta o de cada feature) para `shared/` nunca
 * depender de `features/`. Cobre só o cromo sempre-visível, não a app toda.
 */
export function I18nProvider({
  dictionary,
  children,
}: {
  dictionary: TranslationDict;
  children: ReactNode;
}) {
  const [lang, setLangState] = useState<LangCode>(readStoredLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: LangCode) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      /* localStorage indisponível (modo privado) — o idioma fica só nesta sessão. */
    }
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => {
      const entry = dictionary[key];
      if (!entry) return key;
      let text = entry[lang] ?? entry.pt;
      if (vars) {
        for (const [name, value] of Object.entries(vars)) {
          text = text.replaceAll(`{${name}}`, String(value));
        }
      }
      return text;
    },
    [dictionary, lang],
  );

  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
