import { describe, expect, it } from 'vitest';
import { buildReel } from './iconicSpin';
import type { IconicGoal } from '../../hooks/iconic/iconicGoalHooks';

const goal = (id: number): IconicGoal => ({
  id,
  code: `g${id}`,
  scorer: `S${id}`,
  title: `T${id}`,
  achievement_name: `A${id}`,
  year: 2000,
  youtube_id: `y${id}`,
  video_start: 0,
  difficulty: 1,
  sort_order: id,
  active: true,
  embeddable: true,
});

describe('buildReel', () => {
  const goals = [goal(1), goal(2), goal(3), goal(4)];

  it('assenta no golo-alvo em targetIndex', () => {
    const { items, targetIndex } = buildReel(goals, 3, 6);
    expect(items[targetIndex].id).toBe(3);
  });

  it('tem loops passes completos antes do alvo', () => {
    const { items, targetIndex } = buildReel(goals, 2, 5);
    expect(targetIndex).toBe(5 * goals.length);
    // cauda para as cartas de baixo espreitarem
    expect(items.length).toBe(5 * goals.length + 1 + 3);
  });

  it('cai no primeiro golo se o alvo for desconhecido', () => {
    const { items, targetIndex } = buildReel(goals, 999, 2);
    expect(items[targetIndex].id).toBe(1);
  });

  it('devolve vazio sem golos', () => {
    expect(buildReel([], 1)).toEqual({ items: [], targetIndex: 0 });
  });
});
