import { describe, expect, it } from 'vitest';
import { checkConversion, parseInBase, toBase, type ConvTask } from './logic';

describe('parseInBase', () => {
  it('двоичная', () => {
    expect(parseInBase('101', 2)).toBe(5);
    expect(parseInBase('1010', 2)).toBe(10);
  });
  it('шестнадцатеричная (регистр не важен)', () => {
    expect(parseInBase('FF', 16)).toBe(255);
    expect(parseInBase('ff', 16)).toBe(255);
    expect(parseInBase('2A', 16)).toBe(42);
  });
  it('десятичная', () => {
    expect(parseInBase('42', 10)).toBe(42);
  });
  it('некорректный ввод → null', () => {
    expect(parseInBase('102', 2)).toBeNull(); // 2 недопустима в двоичной
    expect(parseInBase('4a', 10)).toBeNull();
    expect(parseInBase('xy', 16)).toBeNull();
    expect(parseInBase('   ', 10)).toBeNull();
  });
});

describe('toBase', () => {
  it('в двоичную', () => expect(toBase(5, 2)).toBe('101'));
  it('в шестнадцатеричную (заглавные)', () => {
    expect(toBase(255, 16)).toBe('FF');
    expect(toBase(42, 16)).toBe('2A');
  });
  it('в десятичную', () => expect(toBase(42, 10)).toBe('42'));
});

describe('checkConversion', () => {
  const task: ConvTask = { id: 't', value: 5, from: 10, to: 2 };
  it('верный перевод', () => {
    expect(checkConversion(task, '101').correct).toBe(true);
  });
  it('неверный перевод объясняет', () => {
    const r = checkConversion(task, '110');
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('101');
  });
  it('некорректный ввод для целевой системы', () => {
    const r = checkConversion(task, '123');
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('двоичн');
  });
});
