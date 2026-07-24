import type { IconicGoal } from '../../hooks/iconic/iconicGoalHooks';

/** The card sequence to scroll through and the index where the reel settles. */
export interface ReelBuild {
  items: IconicGoal[];
  targetIndex: number;
}

/** Builds a Forza-style vertical reel: repeats `goals` `loops` times, then the target, plus a peek tail. */
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
