import { useContext } from 'react';
import { ThemeContext, type ThemeContextValue } from './ThemeProvider';

/** Reads the current theme choice and setter from `ThemeProvider`. */
export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme deve ser usado dentro de <ThemeProvider>');
  return ctx;
}
