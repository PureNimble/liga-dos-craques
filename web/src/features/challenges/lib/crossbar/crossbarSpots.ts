/** Escadas de posições do Crossbar Challenge (só display; a BD guarda o índice). */
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

/** ViewBox landscape do campo: largura × altura. Baliza à esquerda (x≈2). */
export const CROSSBAR_PITCH_LEN = 133.33;
export const CROSSBAR_PITCH_H = 100;

export interface SpotXY {
  x: number;
  y: number;
}

/** Baliza (onde a bola entra) — para onde vai o token de quem completa tudo. */
export const GOAL: SpotXY = { x: 12, y: 50 };

/**
 * Posição de cada spot no campo (x = distância à baliza; y = eixo esquerda↔direita),
 * por nº de posições. Segue a geometria: grande área junto à baliza, meio-campo ao
 * centro (66.67), outro lado do campo junto à baliza do fundo.
 */
const SPOT_POS: Record<number, SpotXY[]> = {
  // Grande área · fora da área · meio-campo
  3: [
    { x: 15, y: 50 },
    { x: 34, y: 50 },
    { x: 66.67, y: 50 },
  ],
  // Grande área · fora da área (centro/esq/dir) · meio-campo · outro lado
  6: [
    { x: 15, y: 50 },
    { x: 32, y: 50 },
    { x: 32, y: 26 },
    { x: 32, y: 74 },
    { x: 66.67, y: 50 },
    { x: 108, y: 50 },
  ],
};

export function spotPos(spotCount: number, index: number): SpotXY {
  const preset = SPOT_POS[spotCount];
  if (preset) return preset[index] ?? { x: 66.67, y: 50 };
  // Fallback (nº inesperado): distribui uniformemente na linha central.
  if (spotCount <= 1) return { x: 66.67, y: 50 };
  return { x: 24 + (index / (spotCount - 1)) * 94, y: 50 };
}

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
