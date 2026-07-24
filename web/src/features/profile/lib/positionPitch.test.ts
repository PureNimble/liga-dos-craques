import { describe, expect, it } from 'vitest';
import {
  POSITION_XY,
  PITCH_H,
  stateOf,
  togglePosition,
  xyFor,
  type PositionSelection,
} from './positionPitch';

const CODIGOS = [
  'GK',
  'CB',
  'RB',
  'LB',
  'DM',
  'CM',
  'AM',
  'RW',
  'LW',
  'ST',
  'RWB',
  'LWB',
  'RM',
  'LM',
  'SS',
];

const vazio: PositionSelection = { mainId: null, secondaryIds: [] };

describe('mapa do campo', () => {
  it('cobre todas as posições da BD e nada mais', () => {
    expect(Object.keys(POSITION_XY).sort()).toEqual([...CODIGOS].sort());
  });

  it('mantém as posições dentro do campo', () => {
    for (const code of CODIGOS) {
      const xy = xyFor(code)!;
      expect(xy.x).toBeGreaterThanOrEqual(0);
      expect(xy.x).toBeLessThanOrEqual(100);
      expect(xy.y).toBeGreaterThanOrEqual(0);
      expect(xy.y).toBeLessThanOrEqual(PITCH_H);
    }
  });

  it('ataca para cima: o guarda-redes está atrás dos defesas, e estes do ponta de lança', () => {
    expect(xyFor('GK')!.y).toBeGreaterThan(xyFor('CB')!.y);
    expect(xyFor('CB')!.y).toBeGreaterThan(xyFor('DM')!.y);
    expect(xyFor('DM')!.y).toBeGreaterThan(xyFor('CM')!.y);
    expect(xyFor('CM')!.y).toBeGreaterThan(xyFor('AM')!.y);
    expect(xyFor('AM')!.y).toBeGreaterThan(xyFor('ST')!.y);
  });

  it('o DM fica um pouco abaixo do CM (e não ao lado)', () => {
    expect(xyFor('DM')!.y).toBeGreaterThan(xyFor('CM')!.y);
    expect(xyFor('DM')!.x).toBe(xyFor('CM')!.x);
  });

  it('o CM fica exatamente a meio do AM e do DM', () => {
    const am = xyFor('AM')!.y;
    const cm = xyFor('CM')!.y;
    const dm = xyFor('DM')!.y;
    expect(cm - am).toBeCloseTo(dm - cm);
    expect(cm).toBeCloseTo((am + dm) / 2);
  });

  it('os alas ficam entre os laterais e os médios de lado', () => {
    for (const [wb, back, mid] of [
      ['LWB', 'LB', 'LM'],
      ['RWB', 'RB', 'RM'],
    ]) {
      expect(xyFor(wb)!.y).toBeLessThan(xyFor(back)!.y);
      expect(xyFor(wb)!.y).toBeGreaterThan(xyFor(mid)!.y);
    }
  });

  it('põe o lado esquerdo à esquerda e o direito à direita', () => {
    for (const [left, right] of [
      ['LB', 'RB'],
      ['LW', 'RW'],
      ['LM', 'RM'],
      ['LWB', 'RWB'],
    ]) {
      expect(xyFor(left)!.x).toBeLessThan(50);
      expect(xyFor(right)!.x).toBeGreaterThan(50);
      expect(xyFor(left)!.x).toBeLessThan(xyFor(right)!.x);
    }
    for (const c of ['GK', 'CB', 'DM', 'CM', 'AM', 'SS', 'ST']) expect(xyFor(c)!.x).toBe(50);
  });

  it('o SS fica no eixo, entre o ST e o AM (falso nove: substitui o ponta de lança)', () => {
    const ss = xyFor('SS')!;
    expect(ss.x).toBe(50);
    expect(ss.y).toBeGreaterThan(xyFor('ST')!.y);
    expect(ss.y).toBeLessThan(xyFor('AM')!.y);
  });

  it('os médios de lado ficam à altura do CM (linha LM · CM · RM), não à do AM', () => {
    expect(xyFor('LM')!.y).toBe(xyFor('CM')!.y);
    expect(xyFor('RM')!.y).toBe(xyFor('CM')!.y);
    expect(xyFor('LM')!.y).toBeGreaterThan(xyFor('AM')!.y);
  });

  it('os extremos ficam à frente dos médios de lado', () => {
    expect(xyFor('LW')!.y).toBeLessThan(xyFor('LM')!.y);
    expect(xyFor('RW')!.y).toBeLessThan(xyFor('RM')!.y);
  });

  it('os alas ficam entre o DM e a linha defensiva', () => {
    for (const wb of ['LWB', 'RWB']) {
      expect(xyFor(wb)!.y).toBeGreaterThan(xyFor('DM')!.y);
      expect(xyFor(wb)!.y).toBeLessThan(xyFor('LB')!.y);
    }
  });

  it('o guarda-redes não fica colado à linha de fundo', () => {
    expect(xyFor('GK')!.y).toBeLessThan(PITCH_H - 5);
  });

  it('devolve null para um código desconhecido', () => {
    expect(xyFor('XX')).toBeNull();
  });

  it('não sobrepõe duas posições', () => {
    for (const a of CODIGOS) {
      for (const b of CODIGOS) {
        if (a === b) continue;
        const p = xyFor(a)!;
        const q = xyFor(b)!;
        expect(Math.hypot(p.x - q.x, p.y - q.y)).toBeGreaterThan(10);
      }
    }
  });
});

describe('togglePosition', () => {
  it('a primeira escolha é a principal', () => {
    expect(togglePosition(vazio, 5)).toEqual({ mainId: 5, secondaryIds: [] });
  });

  it('as seguintes são secundárias', () => {
    const sel = togglePosition(togglePosition(vazio, 5), 7);
    expect(sel).toEqual({ mainId: 5, secondaryIds: [7] });
  });

  it('clicar na principal tira-a (sem promover ninguém)', () => {
    const sel = togglePosition({ mainId: 5, secondaryIds: [7] }, 5);
    expect(sel).toEqual({ mainId: null, secondaryIds: [7] });
  });

  it('clicar numa secundária promove-a, e a antiga principal desce', () => {
    const sel = togglePosition({ mainId: 5, secondaryIds: [7, 9] }, 7);
    expect(sel.mainId).toBe(7);
    expect(sel.secondaryIds.sort()).toEqual([5, 9]);
  });

  it('promover sem principal anterior não inventa uma secundária', () => {
    const sel = togglePosition({ mainId: null, secondaryIds: [7] }, 7);
    expect(sel).toEqual({ mainId: 7, secondaryIds: [] });
  });

  it('a principal nunca fica também nas secundárias', () => {
    let sel: PositionSelection = vazio;
    for (const id of [1, 2, 3, 2, 1, 3]) {
      sel = togglePosition(sel, id);
      if (sel.mainId != null) expect(sel.secondaryIds).not.toContain(sel.mainId);
      expect(new Set(sel.secondaryIds).size).toBe(sel.secondaryIds.length);
    }
  });

  it('stateOf descreve o que está selecionado', () => {
    const sel = { mainId: 5, secondaryIds: [7] };
    expect(stateOf(sel, 5)).toBe('main');
    expect(stateOf(sel, 7)).toBe('secondary');
    expect(stateOf(sel, 9)).toBe('none');
  });
});
