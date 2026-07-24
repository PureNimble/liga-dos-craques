import { useEffect, useRef, useState } from 'react';
import { ZONE_COUNT } from '../../lib/penalty/penaltyModes';

const STEPS = 12;

/** State of an animated zone draw: the zone to highlight, whether it's spinning, and a skip action. */
export interface ZoneSpin {
  displayZone: number | null;
  spinning: boolean;
  skip: () => void;
}

/** Animates a slot-style target-zone draw (random jumps that decelerate onto the target), once per `revealKey`. */
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
      timer.current = setTimeout(tick, 55 + step * 22);
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
