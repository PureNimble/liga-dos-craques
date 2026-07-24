import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';

export type ThemeChoice = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'peladinhas-theme';

export interface ThemeContextValue {
  theme: ThemeChoice;
  setTheme: (theme: ThemeChoice) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

function readStoredTheme(): ThemeChoice {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored === 'light' || stored === 'dark' ? stored : 'system';
  } catch {
    return 'system';
  }
}

/** Tema da app (claro/escuro/sistema). O `<script>` em index.html já aplica o
 * `data-theme` guardado antes do primeiro paint — isto só assume a partir daí. */
export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<ThemeChoice>(readStoredTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }

    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      const isLight =
        theme === 'light' ||
        (theme === 'system' && window.matchMedia('(prefers-color-scheme: light)').matches);
      meta.setAttribute('content', isLight ? '#f8fafc' : '#08090c');
    }
  }, [theme]);

  const setTheme = (next: ThemeChoice) => {
    setThemeState(next);
    try {
      if (next === 'system') {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, next);
      }
    } catch {
      /* localStorage indisponível (modo privado) — o tema fica só nesta sessão. */
    }
  };

  const value = useMemo(() => ({ theme, setTheme }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
