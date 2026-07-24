/** A point on the pitch: x as a width percentage, y in viewBox units. */
export interface PitchXY {
  x: number;
  y: number;
}

export const PITCH_H = 80;
export const PITCH_RATIO = `100 / ${PITCH_H}`;

/**
 * Attack points up; sides are from the player's perspective (RW/RB on screen-right, LW/LB on screen-left):
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

/** Pitch position for a position code, or null if the code is unknown. */
export function xyFor(code: string): PitchXY | null {
  return POSITION_XY[code] ?? null;
}

/** Whether a position id is unselected, the main pick, or a secondary pick. */
export type PositionState = 'none' | 'main' | 'secondary';

/** The currently selected main position and secondary positions. */
export interface PositionSelection {
  mainId: number | null;
  secondaryIds: number[];
}

/** Reports whether a position id is the main pick, a secondary pick, or unselected. */
export function stateOf(sel: PositionSelection, id: number): PositionState {
  if (sel.mainId === id) return 'main';
  return sel.secondaryIds.includes(id) ? 'secondary' : 'none';
}

/**
 * Toggles a position: promotes it to main (the old main becomes secondary),
 * or deselects it if it was already the main.
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
