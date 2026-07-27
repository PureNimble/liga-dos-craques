import { describe, it, expect } from 'vitest';
import { buildMonthGrid, dayKey } from './calendarGrid';

describe('buildMonthGrid', () => {
  it('returns a 42-day, Monday-first grid', () => {
    const grid = buildMonthGrid(2026, 7); // July 2026 starts on a Wednesday
    expect(grid).toHaveLength(42);
    expect(grid[0].date.getUTCDay()).toBe(1); // Monday
    expect(grid[0].key).toBe('2026-06-29');
  });

  it('flags the days that belong to the requested month', () => {
    const grid = buildMonthGrid(2026, 7);
    const inMonth = grid.filter((d) => d.inMonth);
    expect(inMonth).toHaveLength(31);
    expect(inMonth[0].key).toBe('2026-07-01');
    expect(inMonth[inMonth.length - 1].key).toBe('2026-07-31');
  });
});

describe('dayKey', () => {
  it('formats an ISO datetime as its Lisbon calendar day', () => {
    expect(dayKey('2026-07-09T23:47:00Z')).toBe('2026-07-10');
  });
});
