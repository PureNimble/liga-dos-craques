import { describe, it, expect } from 'vitest';
import { localInputToISO, formatGameDateTime, formatDate } from './datetime';

describe('datetime', () => {
  it('localInputToISO produz um ISO UTC válido', () => {
    const iso = localInputToISO('2026-07-11T20:00');
    expect(iso.endsWith('Z')).toBe(true);
    expect(Number.isNaN(Date.parse(iso))).toBe(false);
  });

  it('formatadores devolvem strings não vazias', () => {
    const iso = new Date('2026-07-11T19:00:00Z').toISOString();
    expect(formatGameDateTime(iso).length).toBeGreaterThan(0);
    expect(formatDate(iso)).toContain('2026');
  });
});
