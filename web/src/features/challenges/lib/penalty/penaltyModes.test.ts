import { describe, expect, it } from 'vitest';
import {
  ALL_ZONES,
  allFilled,
  entryToMode,
  filledCount,
  parsePenaltyEntry,
  parsePenaltyMode,
  zoneCell,
  zoneFilled,
} from './penaltyModes';

describe('penaltyModes', () => {
  it('ALL_ZONES é o bitmask das 6 zonas', () => {
    expect(ALL_ZONES).toBe(63);
  });

  it('zoneFilled lê o bit certo', () => {
    expect(zoneFilled(0b000001, 0)).toBe(true);
    expect(zoneFilled(0b000001, 1)).toBe(false);
    expect(zoneFilled(0b100000, 5)).toBe(true);
  });

  it('filledCount conta as zonas preenchidas', () => {
    expect(filledCount(0)).toBe(0);
    expect(filledCount(0b101010)).toBe(3);
    expect(filledCount(ALL_ZONES)).toBe(6);
  });

  it('allFilled só é verdade com as 6 zonas', () => {
    expect(allFilled(0b011111)).toBe(false);
    expect(allFilled(ALL_ZONES)).toBe(true);
  });

  it('zoneCell mapeia índice → grelha 2×3', () => {
    expect(zoneCell(0)).toEqual({ row: 0, col: 0 });
    expect(zoneCell(2)).toEqual({ row: 0, col: 2 });
    expect(zoneCell(3)).toEqual({ row: 1, col: 0 });
    expect(zoneCell(5)).toEqual({ row: 1, col: 2 });
  });

  it('parsePenaltyMode valida o modo', () => {
    expect(parsePenaltyMode('pen_zones')).toBe('pen_zones');
    expect(parsePenaltyMode('crossbar')).toBeNull();
    expect(parsePenaltyMode(null)).toBeNull();
  });

  it('entryToMode: golos fácil/difícil e zonas', () => {
    expect(entryToMode('goals', 'facil')).toBe('pen_goals');
    expect(entryToMode('goals', 'dificil')).toBe('pen_target');
    expect(entryToMode('zones', 'facil')).toBe('pen_zones');
    expect(entryToMode('zones', 'dificil')).toBe('pen_zones');
  });

  it('parsePenaltyEntry valida a entrada', () => {
    expect(parsePenaltyEntry('goals')).toBe('goals');
    expect(parsePenaltyEntry('zones')).toBe('zones');
    expect(parsePenaltyEntry('pen_goals')).toBeNull();
    expect(parsePenaltyEntry(null)).toBeNull();
  });
});
