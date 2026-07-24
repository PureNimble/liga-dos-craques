/** Meio-campo para escolher posições: coordenadas e regra de seleção. */

export interface PitchXY {
  /** % da largura (0–100), esquerda→direita. */
  x: number;
  /** unidades do viewBox (0–PITCH_H), topo = ataque, fundo = baliza própria. */
  y: number;
}

/** Altura do viewBox (a largura é 100). 100×80 ≈ um meio-campo real (68 m × 52,5 m). */
export const PITCH_H = 80;
/** Proporção do campo, para o CSS bater certo com o viewBox. */
export const PITCH_RATIO = `100 / ${PITCH_H}`;

/**
 * Lugar de cada posição, por `position.code`. Ataca-se para cima, e os lados são
 * os de quem joga: RW/RB à direita do ecrã, LW/LB à esquerda.
 *
 *      LW · ST · RW
 *           SS
 *           AM
 *      LM · CM · RM
 *           DM
 *   LWB · · · · · RWB
 *      LB · CB · RB
 *           GK
 */
export const POSITION_XY: Record<string, PitchXY> = {
  ST: { x: 50, y: 7 },
  LW: { x: 15, y: 13 },
  RW: { x: 85, y: 13 },
  SS: { x: 50, y: 18 },
  AM: { x: 50, y: 29 },
  CM: { x: 50, y: 40 },
  LM: { x: 14, y: 40 },
  RM: { x: 86, y: 40 },
  DM: { x: 50, y: 51 },
  LWB: { x: 10, y: 55 },
  RWB: { x: 90, y: 55 },
  LB: { x: 20, y: 62 },
  CB: { x: 50, y: 62 },
  RB: { x: 80, y: 62 },
  GK: { x: 50, y: 73 },
};

/** Posição no campo, ou null para um código que não conheçamos. */
export function xyFor(code: string): PitchXY | null {
  return POSITION_XY[code] ?? null;
}

export type PositionState = 'none' | 'main' | 'secondary';

export interface PositionSelection {
  mainId: number | null;
  secondaryIds: number[];
}

export function stateOf(sel: PositionSelection, id: number): PositionState {
  if (sel.mainId === id) return 'main';
  return sel.secondaryIds.includes(id) ? 'secondary' : 'none';
}

/**
 * Um clique numa posição:
 *   livre      → principal, se ainda não houver; senão secundária
 *   secundária → principal (a que era principal desce a secundária)
 *   principal  → sai da seleção
 */
export function togglePosition(sel: PositionSelection, id: number): PositionSelection {
  if (sel.mainId === id) return { mainId: null, secondaryIds: sel.secondaryIds };

  if (sel.secondaryIds.includes(id)) {
    const rest = sel.secondaryIds.filter((x) => x !== id);
    return {
      mainId: id,
      secondaryIds: sel.mainId != null ? [...rest, sel.mainId] : rest,
    };
  }

  if (sel.mainId == null) return { mainId: id, secondaryIds: sel.secondaryIds };
  return { mainId: sel.mainId, secondaryIds: [...sel.secondaryIds, id] };
}
