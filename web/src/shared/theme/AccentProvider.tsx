import { createContext, useEffect, useMemo, useState, type ReactNode } from 'react';

/** User-facing accent color choice. */
export type AccentChoice = 'blue' | 'green' | 'red' | 'purple' | 'amber';

const STORAGE_KEY = 'peladinhas-accent';
const DEFAULT_ACCENT: AccentChoice = 'blue';
const ACCENT_CHOICES: AccentChoice[] = ['blue', 'green', 'red', 'purple', 'amber'];

/** Current accent choice and its setter. */
export interface AccentContextValue {
  accent: AccentChoice;
  setAccent: (accent: AccentChoice) => void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AccentContext = createContext<AccentContextValue | undefined>(undefined);

function readStoredAccent(): AccentChoice {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return (ACCENT_CHOICES as string[]).includes(stored ?? '')
      ? (stored as AccentChoice)
      : DEFAULT_ACCENT;
  } catch {
    return DEFAULT_ACCENT;
  }
}

/**
 * App accent color provider. The `<script>` in index.html already applies the
 * stored `data-accent` before first paint — this just takes over from there.
 */
export function AccentProvider({ children }: { children: ReactNode }) {
  const [accent, setAccentState] = useState<AccentChoice>(readStoredAccent);

  useEffect(() => {
    const root = document.documentElement;
    if (accent === DEFAULT_ACCENT) {
      root.removeAttribute('data-accent');
    } else {
      root.setAttribute('data-accent', accent);
    }
  }, [accent]);

  const setAccent = (next: AccentChoice) => {
    setAccentState(next);
    try {
      if (next === DEFAULT_ACCENT) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, next);
      }
    } catch {
      // localStorage unavailable — accent stays for this session only.
    }
  };

  const value = useMemo(() => ({ accent, setAccent }), [accent]);

  return <AccentContext.Provider value={value}>{children}</AccentContext.Provider>;
}
