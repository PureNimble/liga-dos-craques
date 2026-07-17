/** Completude do perfil: que campos faltam preencher. */

/** Só o que é preciso para decidir. */
export interface CompletableProfile {
  main_position_id: number | null;
  preferred_foot: string | null;
  weight_kg: number | null;
  height_cm: number | null;
}

export interface ProfileCompletion {
  /** Campos em falta, prontos para mostrar (ex.: "pé preferido"). */
  missing: string[];
  isComplete: boolean;
  /** A posição principal é a única que o `teamBalancer` usa. */
  positionMissing: boolean;
  done: number;
  total: number;
}

const FIELDS: { label: string; filled: (p: CompletableProfile) => boolean }[] = [
  { label: 'a posição principal', filled: (p) => p.main_position_id != null },
  { label: 'o pé preferido', filled: (p) => p.preferred_foot != null },
  { label: 'os dados físicos', filled: (p) => p.weight_kg != null && p.height_cm != null },
];

export function profileCompletion(profile: CompletableProfile): ProfileCompletion {
  const missing = FIELDS.filter((f) => !f.filled(profile)).map((f) => f.label);
  return {
    missing,
    isComplete: missing.length === 0,
    positionMissing: profile.main_position_id == null,
    done: FIELDS.length - missing.length,
    total: FIELDS.length,
  };
}

/** "a, b e c" — enumeração em português (vírgulas e "e" no último). */
export function listMissing(missing: string[]): string {
  if (missing.length === 0) return '';
  if (missing.length === 1) return missing[0];
  return `${missing.slice(0, -1).join(', ')} e ${missing[missing.length - 1]}`;
}
