import r from './rating.module.css';

/** Classe da "pílula" sólida de rating (0–10), estilo SofaScore. */
export function ratingPill(v: number | null | undefined): string {
  if (v == null) return r.pillNone;
  if (v >= 7.5) return r.pillTop;
  if (v >= 6.5) return r.pillGood;
  if (v >= 5.5) return r.pillMid;
  return r.pillLow;
}

/** Classe da cor do texto do rating (para números grandes). */
export function ratingText(v: number | null | undefined): string {
  if (v == null) return r.textNone;
  if (v >= 7.5) return r.textTop;
  if (v >= 6.5) return r.textGood;
  if (v >= 5.5) return r.textMid;
  return r.textLow;
}
