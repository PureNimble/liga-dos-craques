import { lazy, type ComponentType } from 'react';

const RELOAD_KEY = 'chunk-reload-attempt';

/**
 * Like `React.lazy`, but deploy-resistant: reloads the page once if a chunk
 * fails to load (stale hash from before the latest deploy) instead of erroring.
 */
export function lazyWithReload<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(async () => {
    try {
      const mod = await factory();
      sessionStorage.removeItem(RELOAD_KEY);
      return mod;
    } catch (err) {
      if (!sessionStorage.getItem(RELOAD_KEY)) {
        sessionStorage.setItem(RELOAD_KEY, '1');
        window.location.reload();
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}
