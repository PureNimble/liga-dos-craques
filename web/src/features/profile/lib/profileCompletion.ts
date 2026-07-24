/** Completude do perfil: que campos faltam preencher. */

/** Só o que é preciso para decidir. */
export interface CompletableProfile {
  main_position_id: number | null;
  preferred_foot: string | null;
  weight_kg: number | null;
  height_cm: number | null;
}

/** Chave do campo em falta — a etiqueta traduzida fica a cargo de quem mostra. */
export type MissingField = 'position' | 'foot' | 'physical';

export interface ProfileCompletion {
  missing: MissingField[];
  isComplete: boolean;
  /** A posição principal é a única que o `teamBalancer` usa. */
  positionMissing: boolean;
  done: number;
  total: number;
}

const FIELDS: { key: MissingField; filled: (p: CompletableProfile) => boolean }[] = [
  { key: 'position', filled: (p) => p.main_position_id != null },
  { key: 'foot', filled: (p) => p.preferred_foot != null },
  { key: 'physical', filled: (p) => p.weight_kg != null && p.height_cm != null },
];

export function profileCompletion(profile: CompletableProfile): ProfileCompletion {
  const missing = FIELDS.filter((f) => !f.filled(profile)).map((f) => f.key);
  return {
    missing,
    isComplete: missing.length === 0,
    positionMissing: profile.main_position_id == null,
    done: FIELDS.length - missing.length,
    total: FIELDS.length,
  };
}

/** "a, b e c" / "a, b and c" — enumeração com `conjunction` antes do último item. */
export function listMissing(missing: string[], conjunction: string): string {
  if (missing.length === 0) return '';
  if (missing.length === 1) return missing[0];
  return `${missing.slice(0, -1).join(', ')} ${conjunction} ${missing[missing.length - 1]}`;
}
