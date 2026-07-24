import { describe, expect, it } from 'vitest';
import { formationsFor, positionCode, slotsFor, unionSlots } from './pitchLayout';

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

const Y_GOAL = 92;
const Y_ATTACK = 6;
const yAt = (d: number) => Y_GOAL + (Y_ATTACK - Y_GOAL) * d;
const codeAt = (d: number, x: number) => positionCode(x, yAt(d));

const CENTRO = 50;
const ESQ = 14;
const DIR = 86;

describe('positionCode', () => {
  it('usa só códigos da tabela `position` (sem GR/DC/LE/PL do sistema antigo)', () => {
    const vistos = new Set<string>();
    for (let d = 0; d <= 1; d += 0.01) {
      for (const x of [ESQ, 30, CENTRO, 70, DIR]) vistos.add(codeAt(d, x));
    }
    for (const c of vistos) expect(CODIGOS).toContain(c);
  });

  it('eixo: GK → CB → DM → CM → AM → SS → ST, da baliza para o ataque', () => {
    expect(codeAt(0.05, CENTRO)).toBe('GK');
    expect(codeAt(0.16, CENTRO)).toBe('CB');
    expect(codeAt(0.41, CENTRO)).toBe('DM');
    expect(codeAt(0.54, CENTRO)).toBe('CM');
    expect(codeAt(0.67, CENTRO)).toBe('AM');
    expect(codeAt(0.8, CENTRO)).toBe('SS');
    expect(codeAt(0.92, CENTRO)).toBe('ST');
  });

  it('corredor: LB → LWB → LM → LW (e o espelho à direita)', () => {
    expect(codeAt(0.16, ESQ)).toBe('LB');
    expect(codeAt(0.35, ESQ)).toBe('LWB');
    expect(codeAt(0.54, ESQ)).toBe('LM');
    expect(codeAt(0.92, ESQ)).toBe('LW');

    expect(codeAt(0.16, DIR)).toBe('RB');
    expect(codeAt(0.35, DIR)).toBe('RWB');
    expect(codeAt(0.54, DIR)).toBe('RM');
    expect(codeAt(0.92, DIR)).toBe('RW');
  });

  it('o guarda-redes é guarda-redes em qualquer corredor', () => {
    for (const x of [ESQ, CENTRO, DIR]) expect(codeAt(0.02, x)).toBe('GK');
  });

  it('a ordem no eixo nunca anda para trás', () => {
    const ordem = ['GK', 'CB', 'DM', 'CM', 'AM', 'SS', 'ST'];
    let anterior = -1;
    for (let d = 0; d <= 1; d += 0.005) {
      const i = ordem.indexOf(codeAt(d, CENTRO));
      expect(i).toBeGreaterThanOrEqual(anterior);
      anterior = i;
    }
    expect(codeAt(1, CENTRO)).toBe('ST');
  });
});

describe('catálogo de formações', () => {
  it('cada formação de 11v11 tem 10 jogadores de campo (o GR é à parte)', () => {
    for (const f of formationsFor(11)) {
      const total = f.rows.reduce((a, b) => a + b, 0);
      expect(total, `${f.name} soma ${total}`).toBe(10);
    }
  });

  it('os codes seguem as linhas, um por lugar', () => {
    for (const f of formationsFor(11)) {
      expect(f.codes!.length, f.name).toBe(f.rows.reduce((a, b) => a + b, 0));
    }
  });

  it('declara uma posição para cada lugar de campo', () => {
    for (const f of formationsFor(11)) {
      expect(f.codes, `${f.name} sem codes`).toBeDefined();
      expect(f.codes!).toHaveLength(10);
      for (const c of f.codes!) expect(CODIGOS).toContain(c);
    }
  });

  it('NENHUMA formação usa laterais e alas ao mesmo tempo', () => {
    for (const f of formationsFor(11)) {
      const tem = (c: string) => f.codes!.includes(c);
      const laterais = tem('LB') || tem('RB');
      const alas = tem('LWB') || tem('RWB');
      expect(laterais && alas, `${f.name}: ${f.codes!.join(' ')}`).toBe(false);
    }
  });

  it('quem usa alas tem defesa a 3; quem usa laterais tem defesa a 4 ou 5', () => {
    for (const f of formationsFor(11)) {
      const defesa = f.rows[0];
      if (f.codes!.includes('LWB')) expect(defesa, f.name).toBe(3);
      if (f.codes!.includes('LB')) expect(defesa, f.name).toBeGreaterThanOrEqual(4);
    }
  });

  it('tem variantes com falso 9 (o SS no lugar do ponta de lança)', () => {
    const falso9 = formationsFor(11).filter((f) => f.name.includes('falso 9'));
    expect(falso9.length).toBeGreaterThan(0);
    for (const f of falso9) {
      expect(f.codes).toContain('SS');
      const base = formationsFor(11).find((b) => b.name === f.name.replace(' (falso 9)', ''))!;
      expect(f.rows).toEqual(base.rows);
      expect(f.codes!.filter((c) => c !== 'SS')).toEqual(base.codes!.filter((c) => c !== 'ST'));
    }
  });

  it('cada formação tem exatamente um guarda-redes e pelo menos um avançado', () => {
    for (const f of formationsFor(11)) {
      expect(f.codes!.filter((c) => c === 'GK')).toHaveLength(0);
      const frente = f.codes!.filter((c) => ['ST', 'SS', 'LW', 'RW'].includes(c));
      expect(frente.length, f.name).toBeGreaterThan(0);
    }
  });

  it('não há formações repetidas', () => {
    const nomes = formationsFor(11).map((f) => f.name);
    expect(new Set(nomes).size).toBe(nomes.length);
  });

  it('inclui as que faltavam face ao catálogo de referência', () => {
    const nomes = formationsFor(11).map((f) => f.name);
    for (const n of [
      '4-1-4-1',
      '5-4-1',
      '4-3-2-1',
      '3-4-1-2',
      '4-4-1-1',
      '4-3-1-2',
      '3-1-4-2',
      '3-4-2-1',
    ]) {
      expect(nomes).toContain(n);
    }
  });

  it('a família do 4-3-3 inclina o meio-campo com DM/AM, e usa os nomes reais', () => {
    const byName = (n: string) => formationsFor(11).find((f) => f.name === n)!;
    const base = byName('4-3-3');
    const comTrinco = byName('4-1-2-3');
    const comOfensivo = byName('4-2-1-3');

    expect(base.codes).not.toContain('DM');
    expect(comTrinco.codes).toContain('DM');
    expect(comOfensivo.codes).toContain('AM');

    for (const f of [base, comTrinco, comOfensivo]) {
      expect(f.rows[0], f.name).toBe(4);
      expect(
        f.codes!.filter((c) => ['DM', 'CM', 'AM'].includes(c)),
        f.name,
      ).toHaveLength(3);
      expect(
        f.codes!.filter((c) => ['LW', 'ST', 'SS', 'RW'].includes(c)),
        f.name,
      ).toHaveLength(3);
    }
  });

  it('não inventa nomes de formações: nada de "(defensivo)"/"(ofensivo)"', () => {
    for (const f of formationsFor(11)) {
      expect(f.name, f.name).not.toMatch(/defensiv|ofensiv|attack|defend|holding/i);
    }
  });

  it('cada formação dá 11 lugares (GR incluído)', () => {
    for (const f of formationsFor(11)) expect(slotsFor(f)).toHaveLength(11);
  });
});

describe('unionSlots (tática livre)', () => {
  it('dá para pôr um jogador em QUALQUER posição, incluindo alas e segundo avançado', () => {
    const alcancaveis = new Set(unionSlots().map((s) => positionCode(s.x, s.y)));
    for (const c of ['LWB', 'RWB', 'SS']) {
      expect(alcancaveis, `${c} sem lugar na tática livre`).toContain(c);
    }
  });

  it('a posição de cada lugar é a do sítio onde ele está', () => {
    for (const s of unionSlots()) {
      expect(s.code, `x=${s.x} y=${s.y.toFixed(1)}`).toBe(positionCode(s.x, s.y));
    }
  });

  it('só há um lugar de cada lado em cada linha', () => {
    const laterais = new Set(['LB', 'RB', 'LWB', 'RWB', 'LM', 'RM', 'LW', 'RW']);
    const vistos = new Map<string, number>();
    for (const s of unionSlots()) {
      if (!laterais.has(s.code!)) continue;
      const key = `${s.y.toFixed(2)}:${s.code}`;
      vistos.set(key, (vistos.get(key) ?? 0) + 1);
    }
    for (const [key, n] of vistos) expect(n, key).toBe(1);
  });

  it('a linha do segundo avançado tem lugares dos lados, como as outras', () => {
    const ss = unionSlots().filter((s) => s.code === 'SS');
    expect(ss.length).toBeGreaterThan(1);
  });

  it('não põe dois lugares em cima um do outro', () => {
    const slots = unionSlots();
    for (let i = 0; i < slots.length; i++) {
      for (let j = i + 1; j < slots.length; j++) {
        const d = Math.hypot(slots[i].x - slots[j].x, slots[i].y - slots[j].y);
        expect(d).toBeGreaterThanOrEqual(8);
      }
    }
  });
});
