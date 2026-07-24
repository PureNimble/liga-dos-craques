import type { PositionCategory } from '@/types/database';

/** Pitch line a player occupies. */
export type Line = 'GK' | 'DEF' | 'MID' | 'FWD';

/** A spot on the pitch. `code` is only set when a formation declares it. */
export interface PitchPos {
  code?: string;
  x: number;
  y: number;
}

/** A predefined tactical formation: name plus outfield player rows (GK implicit). */
export interface Formation {
  name: string;
  rows: number[];
  codes?: string[];
}

const RANK: Record<Line, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
const catRank = (c: PositionCategory | null) => (c == null ? 2 : RANK[c as Line]);

const F = (name: string, rows: number[], codes?: string[]): Formation => ({ name, rows, codes });

const CATALOG: Record<number, Formation[]> = {
  1: [F('GR', [])],
  2: [F('1', [1])],
  3: [F('1-1', [1, 1]), F('2', [2])],
  4: [F('2-1', [2, 1]), F('1-2', [1, 2]), F('1-1-1', [1, 1, 1])],
  5: [
    F('1-2-1', [1, 2, 1]),
    F('2-2', [2, 2]),
    F('2-1-1', [2, 1, 1]),
    F('1-1-2', [1, 1, 2]),
    F('3-1', [3, 1]),
    F('4-0', [4]),
  ],
  6: [
    F('2-2-1', [2, 2, 1]),
    F('2-1-2', [2, 1, 2]),
    F('1-2-2', [1, 2, 2]),
    F('3-1-1', [3, 1, 1]),
    F('3-2', [3, 2]),
  ],
  7: [
    F('2-3-1', [2, 3, 1]),
    F('3-2-1', [3, 2, 1]),
    F('2-1-2-1', [2, 1, 2, 1]),
    F('3-1-2', [3, 1, 2]),
    F('1-3-2', [1, 3, 2]),
    F('2-2-2', [2, 2, 2]),
  ],
  8: [
    F('3-3-1', [3, 3, 1]),
    F('2-3-2', [2, 3, 2]),
    F('3-2-2', [3, 2, 2]),
    F('2-4-1', [2, 4, 1]),
    F('3-1-3', [3, 1, 3]),
  ],
  9: [
    F('3-3-2', [3, 3, 2]),
    F('3-2-3', [3, 2, 3]),
    F('2-3-3', [2, 3, 3]),
    F('2-4-2', [2, 4, 2]),
    F('4-3-1', [4, 3, 1]),
    F('3-1-3-1', [3, 1, 3, 1]),
  ],
  10: [F('4-3-2', [4, 3, 2]), F('3-4-2', [3, 4, 2]), F('4-4-1', [4, 4, 1]), F('3-3-3', [3, 3, 3])],
  11: [
    F('4-4-2', [4, 4, 2], ['LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST']),
    F('4-3-3', [4, 3, 3], ['LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW']),
    F('4-1-2-3', [4, 1, 2, 3], ['LB', 'CB', 'CB', 'RB', 'DM', 'CM', 'CM', 'LW', 'ST', 'RW']),
    F('4-2-1-3', [4, 2, 1, 3], ['LB', 'CB', 'CB', 'RB', 'DM', 'DM', 'AM', 'LW', 'ST', 'RW']),
    F('4-3-3 (falso 9)', [4, 3, 3], ['LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'SS', 'RW']),
    F('4-2-3-1', [4, 2, 3, 1], ['LB', 'CB', 'CB', 'RB', 'DM', 'DM', 'LW', 'AM', 'RW', 'ST']),
    F(
      '4-2-3-1 (falso 9)',
      [4, 2, 3, 1],
      ['LB', 'CB', 'CB', 'RB', 'DM', 'DM', 'LW', 'AM', 'RW', 'SS'],
    ),
    F('3-5-2', [3, 5, 2], ['CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'CM', 'RWB', 'ST', 'ST']),
    F('4-5-1', [4, 5, 1], ['LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'CM', 'RM', 'ST']),
    F('3-4-3', [3, 4, 3], ['CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'RWB', 'LW', 'ST', 'RW']),
    F('5-3-2', [5, 3, 2], ['LB', 'CB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'ST', 'ST']),
    F('4-1-2-1-2', [4, 1, 2, 1, 2], ['LB', 'CB', 'CB', 'RB', 'DM', 'CM', 'CM', 'AM', 'ST', 'ST']),
    F('4-1-4-1', [4, 1, 4, 1], ['LB', 'CB', 'CB', 'RB', 'DM', 'LM', 'CM', 'CM', 'RM', 'ST']),
    F('5-4-1', [5, 4, 1], ['LB', 'CB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST']),
    F('4-3-2-1', [4, 3, 2, 1], ['LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'AM', 'AM', 'ST']),
    F('3-4-1-2', [3, 4, 1, 2], ['CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'RWB', 'AM', 'ST', 'ST']),
    F('4-4-1-1', [4, 4, 1, 1], ['LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'SS', 'ST']),
    F('4-3-1-2', [4, 3, 1, 2], ['LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'AM', 'ST', 'ST']),
    F('3-1-4-2', [3, 1, 4, 2], ['CB', 'CB', 'CB', 'DM', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST']),
    F('3-4-2-1', [3, 4, 2, 1], ['CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'RWB', 'AM', 'AM', 'ST']),
    F('4-2-4', [4, 2, 4], ['LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'LW', 'ST', 'ST', 'RW']),
    F('4-2-2-2', [4, 2, 2, 2], ['LB', 'CB', 'CB', 'RB', 'DM', 'DM', 'AM', 'AM', 'ST', 'ST']),
    F('4-6-0', [4, 3, 3], ['LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'AM', 'RW']),
  ],
};

function fallbackFormation(n: number): Formation {
  const o = Math.max(0, n - 1);
  if (o === 0) return F('GR', []);
  const def = Math.round(o * 0.4);
  const fwd = Math.round(o * 0.35);
  const mid = o - def - fwd;
  const rows = [def, mid, fwd].filter((c) => c > 0);
  return F(rows.join('-'), rows);
}

/** Formations available for a given team size (falls back to a balanced generated formation). */
export function formationsFor(n: number): Formation[] {
  return CATALOG[n] ?? [fallbackFormation(n)];
}

/** The default (first-listed) formation for a given team size. */
export function defaultFormation(n: number): Formation {
  return formationsFor(n)[0];
}

const Y_GOAL = 92;
const Y_ATTACK = 6;

const Y_GK = 93;
const D_DEF = 0.16;
const D_FWD = 0.96;
const D_MID_SOLO = 0.5;

const LADDER = [D_DEF, 0.32, 0.48, 0.64, 0.8, D_FWD];

const snapToLadder = (d: number) =>
  LADDER.reduce((best, v) => (Math.abs(v - d) < Math.abs(best - d) ? v : best));

const X_LEFT = 32;
const X_RIGHT = 68;

function depthToY(d: number): number {
  return Y_GOAL + (Y_ATTACK - Y_GOAL) * d;
}

const ROW_COLS: Record<number, number[]> = {
  1: [50],
  2: [34, 66],
  3: [34, 50, 66],
  4: [14, 34, 66, 86],
  5: [14, 34, 50, 66, 86],
};

function evenSpread(count: number): number[] {
  if (count <= 1) return [50];
  const gap = 72 / (count - 1);
  return Array.from({ length: count }, (_, j) => 14 + gap * j);
}

function rowColumns(count: number, codes?: string[]): number[] {
  if (!codes) return ROW_COLS[count] ?? evenSpread(count);
  const xs = new Array<number>(count);
  const central: number[] = [];
  codes.forEach((c, j) => {
    if (c[0] === 'L') xs[j] = 14;
    else if (c[0] === 'R') xs[j] = 86;
    else central.push(j);
  });
  const cols = ROW_COLS[central.length] ?? evenSpread(central.length);
  central.forEach((j, m) => (xs[j] = cols[m]));
  return xs;
}

/** Position code for a coordinate, in the `position` table's vocabulary (e.g. GK, CB, DM, LW). */
export function positionCode(x: number, y: number): string {
  const d = Math.min(1, Math.max(0, (Y_GOAL - y) / (Y_GOAL - Y_ATTACK)));
  if (d < 0.1) return 'GK';

  const side = x < X_LEFT ? 'L' : x > X_RIGHT ? 'R' : 'C';

  if (side !== 'C') {
    const l = side === 'L';
    if (d < 0.26) return l ? 'LB' : 'RB';
    if (d < 0.45) return l ? 'LWB' : 'RWB';
    if (d < 0.7) return l ? 'LM' : 'RM';
    return l ? 'LW' : 'RW';
  }

  if (d < 0.3) return 'CB';
  if (d < 0.47) return 'DM';
  if (d < 0.62) return 'CM';
  if (d < 0.76) return 'AM';
  if (d < 0.88) return 'SS';
  return 'ST';
}

function buildSlots(f: Formation): { line: Line; x: number; y: number; code: string }[] {
  const slots: { line: Line; x: number; y: number; code: string }[] = [];
  slots.push({ line: 'GK', x: 50, y: Y_GK, code: 'GK' });

  const R = f.rows.length;
  let k = 0;
  f.rows.forEach((count, i) => {
    const line: Line = R === 1 ? 'MID' : i === 0 ? 'DEF' : i === R - 1 ? 'FWD' : 'MID';
    const d = R === 1 ? D_MID_SOLO : D_DEF + (D_FWD - D_DEF) * (i / (R - 1));
    const y = depthToY(snapToLadder(d));
    const rowCodes = f.codes?.slice(k, k + count);
    const xs = rowColumns(count, rowCodes);
    for (let j = 0; j < count; j++) {
      const x = xs[j];
      slots.push({ line, x, y, code: rowCodes?.[j] ?? positionCode(x, y) });
      k++;
    }
  });
  return slots;
}

/** Coordinates and position codes of a formation's slots. */
export function slotsFor(f: Formation): PitchPos[] {
  return buildSlots(f).map((s) => ({ x: s.x, y: s.y, code: s.code }));
}

const UNION_X = [14, 34, 50, 66, 86];

/** Full grid of slots for free/custom tactics, covering every position regardless of team size. */
export function unionSlots(): PitchPos[] {
  const out: PitchPos[] = [{ x: 50, y: Y_GK, code: 'GK' }];
  for (const d of LADDER) {
    const y = depthToY(d);
    for (const x of UNION_X) out.push({ x, y, code: positionCode(x, y) });
  }
  return out;
}

/** Assigns each player to the slot best matching their position category (GK in goal, defenders back, forwards up). */
export function buildLayout(
  playerIds: string[],
  f: Formation,
  categoryOf: (id: string) => PositionCategory | null,
): Map<string, PitchPos> {
  const slots = buildSlots(f);
  const remaining = [...playerIds];
  const result = new Map<string, PitchPos>();

  for (const slot of slots) {
    if (remaining.length === 0) break;
    let bestIdx = 0;
    let bestDelta = Infinity;
    remaining.forEach((id, idx) => {
      const d = Math.abs(catRank(categoryOf(id)) - RANK[slot.line]);
      if (d < bestDelta) {
        bestDelta = d;
        bestIdx = idx;
      }
    });
    const [id] = remaining.splice(bestIdx, 1);
    result.set(id, { x: slot.x, y: slot.y });
  }
  remaining.forEach((id) => result.set(id, { x: 50, y: 70 }));
  return result;
}
