import { useEffect, useRef, useState } from 'react';
import { ZONE_COUNT } from './penaltyModes';

const STEPS = 12;

export interface ZoneSpin {
  /** Zona a destacar agora (aleatória enquanto gira; a alvo quando pára). */
  displayZone: number | null;
  spinning: boolean;
  /** Termina a animação já, assentando na zona-alvo. */
  skip: () => void;
}

/**
 * Sorteio animado da zona-alvo (efeito "slot"): salta ao acaso entre zonas,
 * desacelera e assenta na alvo. Joga uma vez por `revealKey` (vez de cada jogador).
 */
export function useZoneSpin(revealKey: string, target: number | null, enabled: boolean): ZoneSpin {
  const [displayZone, setDisplayZone] = useState<number | null>(target);
  const [spinning, setSpinning] = useState(false);
  const doneKey = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    if (!enabled || target === null || revealKey === '') {
      setSpinning(false);
      setDisplayZone(target);
      return;
    }
    // Esta vez já foi revelada (re-render/refetch não recomeça a animação).
    if (doneKey.current === revealKey) {
      setDisplayZone(target);
      return;
    }

    setSpinning(true);
    let step = 0;
    const tick = () => {
      setDisplayZone((z) => {
        let n = z ?? 0;
        while (n === z) n = Math.floor(Math.random() * ZONE_COUNT);
        return n;
      });
      step += 1;
      if (step >= STEPS) {
        doneKey.current = revealKey;
        setDisplayZone(target);
        setSpinning(false);
        return;
      }
      timer.current = setTimeout(tick, 55 + step * 22); // desacelera até parar
    };
    timer.current = setTimeout(tick, 55);
    return () => clearTimeout(timer.current);
  }, [revealKey, target, enabled]);

  function skip() {
    clearTimeout(timer.current);
    doneKey.current = revealKey;
    setDisplayZone(target);
    setSpinning(false);
  }

  return { displayZone, spinning, skip };
}
