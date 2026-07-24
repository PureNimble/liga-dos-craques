import r from './rating.module.css';

/** Class for the solid rating "pill" (0-10), SofaScore-style. */
export function ratingPill(v: number | null | undefined): string {
  if (v == null) return r.pillNone;
  if (v >= 7.5) return r.pillTop;
  if (v >= 6.5) return r.pillGood;
  if (v >= 5.5) return r.pillMid;
  return r.pillLow;
}

/** Class for the rating text color (for large numbers). */
export function ratingText(v: number | null | undefined): string {
  if (v == null) return r.textNone;
  if (v >= 7.5) return r.textTop;
  if (v >= 6.5) return r.textGood;
  if (v >= 5.5) return r.textMid;
  return r.textLow;
}
