/** Crossbar Challenge variant; the ladder is display-only, the DB stores the spot index. */
export type CrossbarVariant = 'quick' | 'long';

export const CROSSBAR_LADDERS: Record<CrossbarVariant, string[]> = {
  quick: ['Grande área', 'Fora da área', 'Meio-campo'],
  long: [
    'Grande área',
    'Fora da área (centro)',
    'Fora da área (esquerda)',
    'Fora da área (direita)',
    'Meio-campo',
    'Outro lado do campo',
  ],
};

export const CROSSBAR_VARIANT_LABEL: Record<CrossbarVariant, string> = {
  quick: 'Rápida',
  long: 'Longa',
};

export const CROSSBAR_PITCH_LEN = 133.33;
export const CROSSBAR_PITCH_H = 100;

/** A point on the pitch, in viewBox coordinates. */
export interface SpotXY {
  x: number;
  y: number;
}

export const GOAL: SpotXY = { x: 12, y: 50 };

const SPOT_POS: Record<number, SpotXY[]> = {
  3: [
    { x: 15, y: 50 },
    { x: 34, y: 50 },
    { x: 66.67, y: 50 },
  ],
  6: [
    { x: 15, y: 50 },
    { x: 32, y: 50 },
    { x: 32, y: 26 },
    { x: 32, y: 74 },
    { x: 66.67, y: 50 },
    { x: 108, y: 50 },
  ],
};

/** Position of a spot on the pitch for a given spot count and index, with a uniform fallback. */
export function spotPos(spotCount: number, index: number): SpotXY {
  const preset = SPOT_POS[spotCount];
  if (preset) return preset[index] ?? { x: 66.67, y: 50 };
  if (spotCount <= 1) return { x: 66.67, y: 50 };
  return { x: 24 + (index / (spotCount - 1)) * 94, y: 50 };
}

/** Number of spots in a variant. */
export function spotCount(variant: CrossbarVariant): number {
  return CROSSBAR_LADDERS[variant].length;
}

/** Determines the variant from the spot count stored on the session. */
export function variantFromCount(count: number): CrossbarVariant {
  return count <= CROSSBAR_LADDERS.quick.length ? 'quick' : 'long';
}

/** Name of the spot at a given index, or `null` when the game is complete. */
export function spotLabel(variant: CrossbarVariant, index: number): string | null {
  return CROSSBAR_LADDERS[variant][index] ?? null;
}
