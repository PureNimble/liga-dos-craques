import { useEffect, useState } from 'react';

/** Derived state of a game's running clock. */
export interface MatchClock {
  elapsedSec: number;
  minute: number;
  label: string;
  running: boolean;
}

/** Computes a live match clock derived from `started_at`, ticking every second while running. */
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
