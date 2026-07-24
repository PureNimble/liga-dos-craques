import type { Json } from '@/types/database';

export const STAT_METRICS = [
  { value: 'games', label: 'Jogos' },
  { value: 'wins', label: 'Vitórias' },
  { value: 'draws', label: 'Empates' },
  { value: 'losses', label: 'Derrotas' },
  { value: 'goals', label: 'Golos' },
  { value: 'assists', label: 'Assistências' },
  { value: 'saves', label: 'Defesas' },
  { value: 'mvps', label: 'MVPs' },
] as const;

export const SPECIAL_KEYS = [{ value: 'hat_trick', label: 'Hat-trick (3 golos num jogo)' }] as const;

/** Form representation of an achievement's unlock criteria: a stat threshold or a special code-implemented key. */
export type CriteriaForm =
  | { type: 'stat'; metric: string; gte: number }
  | { type: 'special'; key: string };

/** Builds the `criteria` jsonb value from the form fields. */
export function buildCriteria(form: CriteriaForm): Json {
  if (form.type === 'stat') {
    return { type: 'stat', metric: form.metric, gte: form.gte };
  }
  return { type: 'special', key: form.key };
}

/** Reads a `criteria` jsonb value into form fields, with safe defaults. */
export function parseCriteria(criteria: Json): CriteriaForm {
  const c = (criteria ?? {}) as Record<string, unknown>;
  if (c.type === 'special') {
    return { type: 'special', key: typeof c.key === 'string' ? c.key : SPECIAL_KEYS[0].value };
  }
  return {
    type: 'stat',
    metric: typeof c.metric === 'string' ? c.metric : STAT_METRICS[0].value,
    gte: typeof c.gte === 'number' ? c.gte : 1,
  };
}

/** Short, human-readable description of a criteria (for list display). */
export function describeCriteria(criteria: Json): string {
  const parsed = parseCriteria(criteria);
  if (parsed.type === 'special') {
    return SPECIAL_KEYS.find((k) => k.value === parsed.key)?.label ?? parsed.key;
  }
  const metric = STAT_METRICS.find((m) => m.value === parsed.metric)?.label ?? parsed.metric;
  return `${metric} ≥ ${parsed.gte}`;
}

function slug(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40);
}

/** Generates a unique `code` for achievements created in the app. */
export function buildAchievementCode(label: string): string {
  const base = slug(label) || 'conquista';
  return `ach_${base}_${Math.random().toString(36).slice(2, 7)}`;
}
