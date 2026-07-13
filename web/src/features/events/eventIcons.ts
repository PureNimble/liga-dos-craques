/**
 * Tom (cor do "chip") por polaridade do evento — positivo / neutro / negativo.
 * O ícone SVG em si vive em `EventIcon.tsx`.
 */
import t from './eventTone.module.css';

const TONES: Record<string, string> = {
  goal: t.green,
  penalty_scored: t.green,
  freekick_scored: t.green,
  save: t.sky,
  assist: t.sky,
  own_goal: t.red,
  penalty_missed: t.red,
  substitution: t.neutral,
};

export function eventTone(code: string): string {
  return TONES[code] ?? t.neutral;
}
