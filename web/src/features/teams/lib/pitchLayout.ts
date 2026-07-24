import type { PositionCategory } from '@/types/database';

export type Line = 'GK' | 'DEF' | 'MID' | 'FWD';

/** Um lugar no campo. `code` só existe quando a formação o declara. */
export interface PitchPos {
  code?: string;
  x: number;
  y: number;
}

/** Formação tática predefinida: nome + linhas de jogadores de campo (GR implícito). */
export interface Formation {
  name: string;
  rows: number[];
  /**
   * Posição de cada lugar (sem o GR), na ordem de `buildSlots`: linha a linha, da
   * defesa para o ataque, e da esquerda para a direita. Um lateral e um ala podem
   * ocupar o mesmo sítio — só a formação os distingue, a geometria não.
   * Sem `codes` (formatos pequenos), a posição sai de `positionCode`.
   */
  codes?: string[];
}

const RANK: Record<Line, number> = { GK: 0, DEF: 1, MID: 2, FWD: 3 };
const catRank = (c: PositionCategory | null) => (c == null ? 2 : RANK[c as Line]);

const F = (name: string, rows: number[], codes?: string[]): Formation => ({ name, rows, codes });

/**
 * Catálogo de formações por tamanho de equipa (jogadores por lado, GR incluído).
 * Até 5v5 usa formações de futsal; 6v6+ usa formações de futebol.
 * Fontes: 5-a-side.com, footballdna.co.uk, goal.com, themastermindsite.com.
 */
const CATALOG: Record<number, Formation[]> = {
  1: [F('GR', [])],
  2: [F('1', [1])],
  3: [F('1-1', [1, 1]), F('2', [2])],
  4: [F('2-1', [2, 1]), F('1-2', [1, 2]), F('1-1-1', [1, 1, 1])],
  // Futsal (5v5)
  5: [
    F('1-2-1', [1, 2, 1]), // diamante
    F('2-2', [2, 2]),
    F('2-1-1', [2, 1, 1]),
    F('1-1-2', [1, 1, 2]),
    F('3-1', [3, 1]),
    F('4-0', [4]),
  ],
  // Futebol
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
  // Defesa a 4/5 → laterais (LB/RB); defesa a 3 → alas (LWB/RWB). Nunca ambos.
  11: [
    F('4-4-2', [4, 4, 2], ['LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST']),
    F('4-3-3', [4, 3, 3], ['LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'ST', 'RW']),
    // 4-3-3 com o meio-campo inclinado: trinco a recuar / médio ofensivo a subir.
    F('4-1-2-3', [4, 1, 2, 3], ['LB', 'CB', 'CB', 'RB', 'DM', 'CM', 'CM', 'LW', 'ST', 'RW']),
    F('4-2-1-3', [4, 2, 1, 3], ['LB', 'CB', 'CB', 'RB', 'DM', 'DM', 'AM', 'LW', 'ST', 'RW']),
    // Falso 9: o ponta de lança recua (SS).
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
    // Árvore de Natal.
    F('4-3-2-1', [4, 3, 2, 1], ['LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'AM', 'AM', 'ST']),
    F('3-4-1-2', [3, 4, 1, 2], ['CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'RWB', 'AM', 'ST', 'ST']),
    F('4-4-1-1', [4, 4, 1, 1], ['LB', 'CB', 'CB', 'RB', 'LM', 'CM', 'CM', 'RM', 'SS', 'ST']),
    F('4-3-1-2', [4, 3, 1, 2], ['LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'AM', 'ST', 'ST']),
    // Defesa a 3 sem alas: a largura vem dos médios de lado.
    F('3-1-4-2', [3, 1, 4, 2], ['CB', 'CB', 'CB', 'DM', 'LM', 'CM', 'CM', 'RM', 'ST', 'ST']),
    F('3-4-2-1', [3, 4, 2, 1], ['CB', 'CB', 'CB', 'LWB', 'CM', 'CM', 'RWB', 'AM', 'AM', 'ST']),
    F('4-2-4', [4, 2, 4], ['LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'LW', 'ST', 'ST', 'RW']),
    // Retângulo mágico.
    F('4-2-2-2', [4, 2, 2, 2], ['LB', 'CB', 'CB', 'RB', 'DM', 'DM', 'AM', 'AM', 'ST', 'ST']),
    // Sem ponta de lança.
    F('4-6-0', [4, 3, 3], ['LB', 'CB', 'CB', 'RB', 'CM', 'CM', 'CM', 'LW', 'AM', 'RW']),
  ],
};

/** Fallback para tamanhos fora do catálogo (equilibrado). */
function fallbackFormation(n: number): Formation {
  const o = Math.max(0, n - 1);
  if (o === 0) return F('GR', []);
  const def = Math.round(o * 0.4);
  const fwd = Math.round(o * 0.35);
  const mid = o - def - fwd;
  const rows = [def, mid, fwd].filter((c) => c > 0);
  return F(rows.join('-'), rows);
}

export function formationsFor(n: number): Formation[] {
  return CATALOG[n] ?? [fallbackFormation(n)];
}

export function defaultFormation(n: number): Formation {
  return formationsFor(n)[0];
}

/* -------------------------------------------------------------------------- */
/*  Geometria                                                                  */
/*                                                                              */
/*  Um só campo por equipa: a equipa ataca sempre para CIMA — a sua baliza em  */
/*  baixo, o ataque em cima. Não há espelhamento por equipa (isso trata-se na  */
/*  UI, que alterna qual a equipa em campo).                                    */
/* -------------------------------------------------------------------------- */

const Y_GOAL = 92; // linha da própria baliza (fundo do campo)
const Y_ATTACK = 6; // dentro da área contrária (o `.goalTop` vai até aos 14%)

// Profundidade tática normalizada por linha (0 = baliza própria, 1 = ataque).
const Y_GK = 93; // guarda-redes: fixo dentro da pequena área (abaixo de Y_GOAL)
const D_DEF = 0.16; // linha defensiva
const D_FWD = 0.96; // linha avançada
const D_MID_SOLO = 0.5; // única linha de campo (formações pequenas)

/**
 * As seis linhas de campo, da defesa ao ataque. Formações e tática livre assentam
 * exatamente nas mesmas linhas — trocar de formação nunca desloca as posições, só
 * muda que lugares ficam ocupados. Caem no centro das bandas de `positionCode`,
 * por isso cada linha lê-se como uma posição do eixo: CB → DM → CM → AM → SS → ST.
 */
const LADDER = [D_DEF, 0.32, 0.48, 0.64, 0.8, D_FWD];

/** Aproxima uma profundidade à linha mais próxima da grelha. */
const snapToLadder = (d: number) =>
  LADDER.reduce((best, v) => (Math.abs(v - d) < Math.abs(best - d) ? v : best));

/** Limites dos corredores: fora deles é lado, entre eles é eixo. */
const X_LEFT = 32;
const X_RIGHT = 68;

/** Converte profundidade [0,1] em coordenada `y` no campo (0 topo, 100 fundo). */
function depthToY(d: number): number {
  return Y_GOAL + (Y_ATTACK - Y_GOAL) * d;
}

/**
 * Colunas simétricas de uma linha, por nº de lugares — sempre em UNION_X, para os
 * lugares das formações assentarem na mesma grelha da tática livre. Até três ficam
 * centrais (dois pontas/centrais no meio, não nas linhas laterais); a partir de
 * quatro abrem-se às pontas.
 */
const ROW_COLS: Record<number, number[]> = {
  1: [50],
  2: [34, 66],
  3: [34, 50, 66],
  4: [14, 34, 66, 86],
  5: [14, 34, 50, 66, 86],
};

/** Recurso para linhas fora do catálogo: distribui simétrico entre as pontas. */
function evenSpread(count: number): number[] {
  if (count <= 1) return [50];
  const gap = 72 / (count - 1);
  return Array.from({ length: count }, (_, j) => 14 + gap * j);
}

/**
 * Colunas (x) de uma linha. Com posições declaradas, laterais e alas vão às pontas
 * (L→14, R→86) e os centrais às colunas do meio; sem elas (formatos pequenos), os
 * lugares espalham-se simétricos. Tudo cai em UNION_X.
 */
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

/**
 * Posição a partir das coordenadas, no vocabulário da tabela `position`.
 * Bandas, da própria baliza para o ataque:
 *   corredor lateral:  LB/RB → LWB/RWB → LM/RM → LW/RW
 *   eixo:              GK → CB → DM → CM → AM → SS → ST
 */
export function positionCode(x: number, y: number): string {
  const d = Math.min(1, Math.max(0, (Y_GOAL - y) / (Y_GOAL - Y_ATTACK))); // 0 baliza → 1 ataque
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

/** Slots (GR + linhas) distribuídos em profundidade no campo inteiro. */
function buildSlots(f: Formation): { line: Line; x: number; y: number; code: string }[] {
  const slots: { line: Line; x: number; y: number; code: string }[] = [];
  // Guarda-redes (sempre, dentro da pequena área).
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

/** Coordenadas (e posição) dos slots de uma formação. */
export function slotsFor(f: Formation): PitchPos[] {
  return buildSlots(f).map((s) => ({ x: s.x, y: s.y, code: s.code }));
}

/**
 * Colunas da grelha livre: um lugar de cada lado e três no eixo. Os do meio ficam
 * bem dentro de [X_LEFT, X_RIGHT] para se lerem como centrais.
 */
const UNION_X = [14, 34, 50, 66, 86];

/**
 * Grelha COMPLETA de posições (tática livre / personalizada): as seis linhas do
 * `LADDER` cruzadas com UNION_X. Assim pode colocar-se um jogador em qualquer
 * posição (GK, LB, CB, CM, ST, …) sem ficar restrito à formação do tamanho da
 * equipa, e nos mesmos sítios onde as formações assentam os seus lugares.
 *
 * Sem formação não há posições declaradas: cada lugar vale pelo sítio onde está.
 * Um lugar por lado em cada linha — não se joga com dois laterais esquerdos; ao
 * meio repetem-se (dois centrais, dois pontas).
 */
export function unionSlots(): PitchPos[] {
  const out: PitchPos[] = [{ x: 50, y: Y_GK, code: 'GK' }];
  for (const d of LADDER) {
    const y = depthToY(d);
    for (const x of UNION_X) out.push({ x, y, code: positionCode(x, y) });
  }
  return out;
}

/**
 * Atribui cada jogador ao slot mais adequado à sua categoria (GR na baliza,
 * defesas atrás, avançados à frente). Devolve coordenadas por jogador.
 */
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
