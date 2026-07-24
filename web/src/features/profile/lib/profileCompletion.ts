/** Minimal profile fields needed to determine completion status. */
export interface CompletableProfile {
  main_position_id: number | null;
  preferred_foot: string | null;
  weight_kg: number | null;
  height_cm: number | null;
}

/** Key of a missing field; the translated label is up to the caller. */
export type MissingField = 'position' | 'foot' | 'physical';

/** Result of checking which profile fields are missing. */
export interface ProfileCompletion {
  missing: MissingField[];
  isComplete: boolean;
  positionMissing: boolean;
  done: number;
  total: number;
}

const FIELDS: { key: MissingField; filled: (p: CompletableProfile) => boolean }[] = [
  { key: 'position', filled: (p) => p.main_position_id != null },
  { key: 'foot', filled: (p) => p.preferred_foot != null },
  { key: 'physical', filled: (p) => p.weight_kg != null && p.height_cm != null },
];

/** Determines which profile fields are still missing and whether the profile is complete. */
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

/** Joins items into a list with `conjunction` before the last one (e.g. "a, b and c"). */
export function listMissing(missing: string[], conjunction: string): string {
  if (missing.length === 0) return '';
  if (missing.length === 1) return missing[0];
  return `${missing.slice(0, -1).join(', ')} ${conjunction} ${missing[missing.length - 1]}`;
}
