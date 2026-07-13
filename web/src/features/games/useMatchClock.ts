import { useEffect, useState } from 'react';

export interface MatchClock {
  /** Segundos decorridos desde o início. */
  elapsedSec: number;
  /** Minuto de jogo (1-based), para pré-preencher eventos. */
  minute: number;
  /** "MM:SS" para mostrar no cabeçalho. */
  label: string;
  running: boolean;
}

/**
 * Cronómetro de jogo derivado de `started_at` (fonte única, partilhada por
 * todos via realtime). Atualiza a cada segundo enquanto `running`.
 */
export function useMatchClock(startedAt: string | null | undefined, running: boolean): MatchClock {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!running || !startedAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [running, startedAt]);

  if (!startedAt) {
    return { elapsedSec: 0, minute: 1, label: '00:00', running: false };
  }

  const elapsedSec = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000));
  const mm = Math.floor(elapsedSec / 60);
  const ss = elapsedSec % 60;
  const label = `${String(mm).padStart(2, '0')}:${String(ss).padStart(2, '0')}`;

  return { elapsedSec, minute: mm + 1, label, running };
}
