import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { flushNow, trackPageView } from '../lib/tracker';

/** Regista cada mudança de rota enquanto houver consentimento. */
export function usePageTracking(userId: string | undefined, enabled: boolean) {
  const { pathname } = useLocation();

  useEffect(() => {
    if (!enabled || !userId) return;
    trackPageView(userId, pathname);
  }, [enabled, userId, pathname]);

  useEffect(() => {
    if (!enabled) return;
    const onHide = () => {
      if (document.visibilityState === 'hidden') flushNow();
    };
    document.addEventListener('visibilitychange', onHide);
    window.addEventListener('pagehide', flushNow);
    return () => {
      document.removeEventListener('visibilitychange', onHide);
      window.removeEventListener('pagehide', flushNow);
    };
  }, [enabled]);
}
