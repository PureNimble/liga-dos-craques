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
const Y_ATTACK = 12; // terço ofensivo (topo do campo)

// Profundidade tática normalizada por linha (0 = baliza própria, 1 = ataque).
const D_GK = 0.05;
const D_DEF = 0.16; // linha defensiva
const D_FWD = 0.92; // linha avançada
const D_MID_SOLO = 0.5; // única linha de campo (formações pequenas)
const D_SS = 0.8; // "na cova", entre o médio ofensivo e o ponta de lança

/** Converte profundidade [0,1] em coordenada `y` no campo (0 topo, 100 fundo). */
function depthToY(d: number): number {
  return Y_GOAL + (Y_ATTACK - Y_GOAL) * d;
}

/**
 * Espalhamento horizontal simétrico de `count` jogadores numa linha. O espaço
 * afina com o número: linhas cheias ocupam quase toda a largura; pares ficam
 * centrais (dois pontas/centrais no meio, não nas linhas laterais).
 */
function rowX(count: number, j: number): number {
  if (count <= 1) return 50;
  const gap = Math.min(24, 80 / (count - 1));
  return 50 + (j - (count - 1) / 2) * gap;
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

  const side = x < 36 ? 'L' : x > 64 ? 'R' : 'C';

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
  // Guarda-redes (sempre, junto à própria baliza).
  slots.push({ line: 'GK', x: 50, y: depthToY(D_GK), code: 'GK' });

  const R = f.rows.length;
  let k = 0;
  f.rows.forEach((count, i) => {
    const line: Line = R === 1 ? 'MID' : i === 0 ? 'DEF' : i === R - 1 ? 'FWD' : 'MID';
    const d = R === 1 ? D_MID_SOLO : D_DEF + (D_FWD - D_DEF) * (i / (R - 1));
    const y = depthToY(d);
    for (let j = 0; j < count; j++) {
      const x = rowX(count, j);
      slots.push({ line, x, y, code: f.codes?.[k] ?? positionCode(x, y) });
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
 * Grelha COMPLETA de posições (tática livre / personalizada): a união de todos
 * os slots das formações de 11v11, independentemente do formato do jogo. Assim
 * pode colocar-se um jogador em qualquer posição (GK, LB, CB, CM, ST, …) sem
 * ficar restrito às posições da formação do tamanho da equipa.
 */
export function unionSlots(): PitchPos[] {
  const MIN = 8; // distância mínima entre slots (%) — baixa para manter o DC central
  const kept: PitchPos[] = [];
  for (const f of formationsFor(11)) {
    for (const s of slotsFor(f)) {
      if (!kept.some((k) => Math.hypot(k.x - s.x, k.y - s.y) < MIN)) kept.push(s);
    }
  }
  // Nenhuma formação cai em d ≈ 0.8, por isso o lugar do SS entra à mão.
  const ss: PitchPos = { x: 50, y: depthToY(D_SS), code: 'SS' };
  if (!kept.some((k) => Math.hypot(k.x - ss.x, k.y - ss.y) < MIN)) kept.push(ss);
  return kept;
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
