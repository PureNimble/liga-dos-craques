import { useEffect, useState } from 'react';
import { useTheme } from '@/shared/theme/useTheme';

/** Whether the map should render in light mode: explicit light theme, or "system" while the OS is light. */
export function useIsLightTheme(): boolean {
  const { theme } = useTheme();
  const [systemLight, setSystemLight] = useState(
    () => window.matchMedia('(prefers-color-scheme: light)').matches,
  );
  useEffect(() => {
    const mql = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => setSystemLight(mql.matches);
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, []);
  return theme === 'light' || (theme === 'system' && systemLight);
}
