import { describe, expect, it } from 'vitest';
import { deepEqual, formatValue, judgeCase, summarize, type CaseOutcome } from './logic';

describe('formatValue', () => {
  it('примитивы и структуры', () => {
    expect(formatValue(42)).toBe('42');
    expect(formatValue('hi')).toBe('"hi"');
    expect(formatValue([1, 2])).toBe('[1,2]');
    expect(formatValue({ a: 1 })).toBe('{"a":1}');
  });
  it('undefined и функция', () => {
    expect(formatValue(undefined)).toBe('undefined');
    expect(formatValue(() => 1)).toBe('функция');
  });
  it('несериализуемое (BigInt) не роняет форматтер', () => {
    expect(formatValue(10n)).toBe('10');
  });
  it('symbol обрабатывается через запасной String()', () => {
    expect(formatValue(Symbol('x'))).toBe('Symbol(x)');
  });
});

describe('deepEqual', () => {
  it('примитивы и NaN', () => {
    expect(deepEqual(5, 5)).toBe(true);
    expect(deepEqual(1, 2)).toBe(false);
    expect(deepEqual(NaN, NaN)).toBe(true);
    expect(deepEqual(5, '5')).toBe(false);
  });
  it('массивы', () => {
    expect(deepEqual([1, 2], [1, 2])).toBe(true);
    expect(deepEqual([1], [1, 2])).toBe(false);
    expect(deepEqual([1, 2], [1, 3])).toBe(false);
  });
  it('объекты', () => {
    expect(deepEqual({ a: 1 }, { a: 1 })).toBe(true);
    expect(deepEqual({ a: 1 }, { a: 1, b: 2 })).toBe(false);
    expect(deepEqual({ a: 1 }, { a: 2 })).toBe(false);
  });
  it('null не равен объекту', () => {
    expect(deepEqual(null, {})).toBe(false);
    expect(deepEqual(null, null)).toBe(true);
  });
});

describe('judgeCase', () => {
  it('верный ответ засчитан', () => {
    const o = judgeCase({ args: [[1, 2, 3]], expected: 6 }, { got: 6 });
    expect(o.pass).toBe(true);
    expect(o.args).toBe('[1,2,3]');
    expect(o.expected).toBe('6');
    expect(o.got).toBe('6');
    expect(o.error).toBeNull();
  });
  it('неверный ответ', () => {
    const o = judgeCase({ args: [[1]], expected: 1 }, { got: 2 });
    expect(o.pass).toBe(false);
    expect(o.got).toBe('2');
  });
  it('ошибка выполнения', () => {
    const o = judgeCase({ args: [[1]], expected: 1 }, { error: 'ReferenceError: x is not defined' });
    expect(o.pass).toBe(false);
    expect(o.got).toBe('—');
    expect(o.error).toContain('ReferenceError');
  });
});

describe('summarize', () => {
  const ok: CaseOutcome = { pass: true, args: '', expected: '', got: '', error: null };
  const bad: CaseOutcome = { pass: false, args: '', expected: '', got: '', error: null };
  it('все пройдены', () => {
    expect(summarize([ok, ok])).toEqual({ passed: 2, total: 2, allPass: true });
  });
  it('часть провалена', () => {
    expect(summarize([ok, bad])).toEqual({ passed: 1, total: 2, allPass: false });
  });
  it('пустой список — не пройден', () => {
    expect(summarize([])).toEqual({ passed: 0, total: 0, allPass: false });
  });
});
