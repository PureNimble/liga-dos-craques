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

/** Maps an event type code to its tone class (positive/neutral/negative). */
export function eventTone(code: string): string {
  return TONES[code] ?? t.neutral;
}
