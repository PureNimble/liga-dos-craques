import { useContext } from 'react';
import { I18nContext, type I18nContextValue } from './I18nProvider';

export function useT(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useT deve ser usado dentro de <I18nProvider>');
  return ctx;
}
