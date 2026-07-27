import { useContext } from 'react';
import { AccentContext, type AccentContextValue } from './AccentProvider';

/** Reads the current accent choice and setter from `AccentProvider`. */
export function useAccent(): AccentContextValue {
  const ctx = useContext(AccentContext);
  if (!ctx) throw new Error('useAccent deve ser usado dentro de <AccentProvider>');
  return ctx;
}
