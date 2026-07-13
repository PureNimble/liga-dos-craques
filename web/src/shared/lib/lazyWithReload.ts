import { lazy, type ComponentType } from 'react';

const RELOAD_KEY = 'chunk-reload-attempt';

/**
 * Como `React.lazy`, mas resistente a deploys: quando um chunk deixa de existir
 * (novo deploy substituiu os ficheiros com hashes antigos pelos novos), o import
 * falha com "Failed to fetch dynamically imported module". Nesse caso recarregamos
 * a página UMA vez para obter o index.html atualizado com os hashes corretos.
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
        // Não resolve — a página vai recarregar de qualquer forma.
        return new Promise<{ default: T }>(() => {});
      }
      throw err;
    }
  });
}
