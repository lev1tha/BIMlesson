import { describe, expect, it } from 'vitest';
import { caesarDecode, caesarShift, decodesTo, shiftChar } from './logic';

describe('shiftChar', () => {
  it('латиница со сдвигом', () => {
    expect(shiftChar('a', 1)).toBe('b');
    expect(shiftChar('H', 3)).toBe('K');
  });
  it('перенос через конец алфавита', () => {
    expect(shiftChar('z', 1)).toBe('a');
    expect(shiftChar('я', 1)).toBe('а');
  });
  it('кириллица', () => {
    expect(shiftChar('а', 2)).toBe('в');
  });
  it('не-буквы не меняются', () => {
    expect(shiftChar(' ', 5)).toBe(' ');
    expect(shiftChar('!', 5)).toBe('!');
    expect(shiftChar('7', 5)).toBe('7');
  });
});

describe('caesarShift / caesarDecode', () => {
  it('шифрует строку', () => {
    expect(caesarShift('abc', 1)).toBe('bcd');
    expect(caesarShift('Hello', 3)).toBe('Khoor');
  });
  it('сохраняет пробелы и знаки', () => {
    expect(caesarShift('a b!', 1)).toBe('b c!');
  });
  it('дешифровка — обратный сдвиг', () => {
    const enc = caesarShift('привет', 5);
    expect(caesarDecode(enc, 5)).toBe('привет');
  });
});

describe('decodesTo', () => {
  it('верный сдвиг восстанавливает текст', () => {
    const enc = caesarShift('тайна', 4);
    expect(decodesTo(enc, -4, 'тайна')).toBe(true);
  });
  it('неверный сдвиг — false', () => {
    const enc = caesarShift('тайна', 4);
    expect(decodesTo(enc, -3, 'тайна')).toBe(false);
  });
});
