/** Escadas de posições do Crossbar Challenge (só display; a BD guarda o índice). */
export type CrossbarVariant = 'quick' | 'long';

export const CROSSBAR_LADDERS: Record<CrossbarVariant, string[]> = {
  quick: ['Marca de penálti (11m)', 'Meia-lua (18m)', 'Meio-campo'],
  long: [
    'Grande área (~5,5m)',
    'Marca de penálti (11m)',
    'Meia-lua (18m)',
    'Meio-campo',
    'Grande área contrária',
  ],
};

export const CROSSBAR_VARIANT_LABEL: Record<CrossbarVariant, string> = {
  quick: 'Rápida',
  long: 'Longa',
};

/** Nº de posições de uma variante. */
export function spotCount(variant: CrossbarVariant): number {
  return CROSSBAR_LADDERS[variant].length;
}

/** Descobre a variante a partir do nº de posições guardado na sessão. */
export function variantFromCount(count: number): CrossbarVariant {
  return count <= CROSSBAR_LADDERS.quick.length ? 'quick' : 'long';
}

/** Nome da posição num dado índice (ou `null` se já não há mais — jogo completo). */
export function spotLabel(variant: CrossbarVariant, index: number): string | null {
  return CROSSBAR_LADDERS[variant][index] ?? null;
}
