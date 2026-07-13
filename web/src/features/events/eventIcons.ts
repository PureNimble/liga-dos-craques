/**
 * Tom (cor do "chip") por polaridade do evento — positivo / neutro / negativo.
 * O ícone SVG em si vive em `EventIcon.tsx`.
 */
const TONES: Record<string, string> = {
  goal: 'bg-pitch-500/15 text-pitch-300',
  penalty_scored: 'bg-pitch-500/15 text-pitch-300',
  freekick_scored: 'bg-pitch-500/15 text-pitch-300',
  save: 'bg-sky-500/15 text-sky-300',
  assist: 'bg-sky-500/15 text-sky-300',
  own_goal: 'bg-red-500/15 text-red-300',
  penalty_missed: 'bg-red-500/15 text-red-300',
  substitution: 'bg-white/[0.06] text-slate-300',
};

export function eventTone(code: string): string {
  return TONES[code] ?? 'bg-white/[0.06] text-slate-300';
}
