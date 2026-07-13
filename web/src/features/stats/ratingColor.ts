/** Cor sólida do "pill" de rating (0–10), estilo SofaScore. */
export function ratingPill(v: number | null | undefined): string {
  if (v == null) return 'bg-navy-700 text-slate-300';
  if (v >= 7.5) return 'bg-pitch-500 text-navy-975';
  if (v >= 6.5) return 'bg-emerald-600 text-white';
  if (v >= 5.5) return 'bg-amber-500 text-navy-975';
  return 'bg-red-500 text-white';
}

/** Cor do texto do rating (para números grandes). */
export function ratingText(v: number | null | undefined): string {
  if (v == null) return 'text-slate-300';
  if (v >= 7.5) return 'text-pitch-400';
  if (v >= 6.5) return 'text-emerald-400';
  if (v >= 5.5) return 'text-amber-400';
  return 'text-red-400';
}
