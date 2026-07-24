import type { IconicGoal } from '../../hooks/iconic/iconicGoalHooks';

export interface ReelBuild {
  /** Sequência de cartas a rolar (vários passes + o alvo + cauda para espreitar). */
  items: IconicGoal[];
  /** Índice da carta-alvo em `items` (onde o carrossel assenta). */
  targetIndex: number;
}

/**
 * Constrói o carrossel vertical estilo Forza: repete a lista `loops` vezes (o
 * "a rolar"), coloca o golo-alvo a seguir e acrescenta cauda para as cartas de
 * baixo espreitarem. O carrossel desliza até centrar `targetIndex`.
 */
export function buildReel(goals: IconicGoal[], targetId: number, loops = 6): ReelBuild {
  if (goals.length === 0) return { items: [], targetIndex: 0 };
  const target = goals.find((g) => g.id === targetId) ?? goals[0];
  const items: IconicGoal[] = [];
  for (let i = 0; i < loops; i++) items.push(...goals);
  const targetIndex = items.length;
  items.push(target);
  for (let i = 0; i < 3; i++) items.push(goals[i % goals.length]);
  return { items, targetIndex };
}
