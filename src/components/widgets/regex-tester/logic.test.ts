import { describe, expect, it } from 'vitest';
import { countMatches, evaluateRegex } from './logic';
import { DEFAULT_TASK } from './data';

describe('evaluateRegex', () => {
  it('верный паттерн проходит все кейсы', () => {
    const r = evaluateRegex('^\\d+$', DEFAULT_TASK.flags, DEFAULT_TASK.cases);
    expect(r.valid).toBe(true);
    expect(r.allCorrect).toBe(true);
  });
  it('слишком общий паттерн ловит лишнее → не все верно', () => {
    const r = evaluateRegex('\\d+', DEFAULT_TASK.flags, DEFAULT_TASK.cases);
    expect(r.valid).toBe(true);
    // '12a' содержит цифры → совпадёт, хотя не должен
    const case12a = r.results.find((c) => c.text === '12a');
    expect(case12a?.matches).toBe(true);
    expect(case12a?.correct).toBe(false);
    expect(r.allCorrect).toBe(false);
  });
  it('пустой паттерн — невалиден', () => {
    const r = evaluateRegex('', '', DEFAULT_TASK.cases);
    expect(r.valid).toBe(false);
    expect(r.allCorrect).toBe(false);
  });
  it('некорректный паттерн → ошибка', () => {
    const r = evaluateRegex('(', '', DEFAULT_TASK.cases);
    expect(r.valid).toBe(false);
    expect(r.error).toBeTruthy();
  });
  it('корректно помечает should-not-match', () => {
    const r = evaluateRegex('^[a-z]+$', '', [
      { text: 'abc', shouldMatch: true },
      { text: '123', shouldMatch: false },
    ]);
    expect(r.allCorrect).toBe(true);
  });
});

describe('countMatches', () => {
  it('считает числа в тексте', () => {
    expect(countMatches('\\d+', 'g', 'a1 b22 c333')).toBe(3);
  });
  it('добавляет флаг g, если его нет', () => {
    expect(countMatches('\\d+', '', 'a1 b22')).toBe(2);
  });
  it('нет совпадений → 0', () => {
    expect(countMatches('\\d+', 'g', 'abc')).toBe(0);
  });
  it('пустой паттерн → null', () => {
    expect(countMatches('', 'g', 'abc')).toBeNull();
  });
  it('некорректный паттерн → null', () => {
    expect(countMatches('(', 'g', 'abc')).toBeNull();
  });
});
