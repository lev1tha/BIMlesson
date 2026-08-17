import { describe, expect, it } from 'vitest';
import { checkGateAnswer, evalGate, truthTable } from './logic';

describe('evalGate', () => {
  it('AND', () => {
    expect(evalGate('AND', true, true)).toBe(true);
    expect(evalGate('AND', true, false)).toBe(false);
  });
  it('OR', () => {
    expect(evalGate('OR', false, false)).toBe(false);
    expect(evalGate('OR', true, false)).toBe(true);
  });
  it('XOR', () => {
    expect(evalGate('XOR', true, true)).toBe(false);
    expect(evalGate('XOR', true, false)).toBe(true);
  });
  it('NAND', () => {
    expect(evalGate('NAND', true, true)).toBe(false);
    expect(evalGate('NAND', true, false)).toBe(true);
  });
  it('NOT (игнорирует второй вход)', () => {
    expect(evalGate('NOT', true, false)).toBe(false);
    expect(evalGate('NOT', false, true)).toBe(true);
  });
});

describe('truthTable', () => {
  it('бинарный вентиль — 4 строки', () => {
    expect(truthTable('AND')).toHaveLength(4);
  });
  it('NOT — 2 строки', () => {
    const t = truthTable('NOT');
    expect(t).toHaveLength(2);
    expect(t[0]).toEqual({ a: false, out: true });
    expect(t[1]).toEqual({ a: true, out: false });
  });
  it('таблица AND верна', () => {
    const t = truthTable('AND');
    expect(t.map((r) => r.out)).toEqual([false, false, false, true]);
  });
});

describe('checkGateAnswer', () => {
  it('верный ответ', () => {
    expect(checkGateAnswer({ gate: 'AND', a: true, b: true }, true).correct).toBe(true);
  });
  it('неверный ответ объясняет', () => {
    const r = checkGateAnswer({ gate: 'AND', a: true, b: false }, true);
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('AND');
  });
});
