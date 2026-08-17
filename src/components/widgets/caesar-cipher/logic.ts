/**
 * Чистая логика шифра Цезаря — без React и без DOM.
 * Сдвиг букв по алфавиту (латиница и кириллица), не-буквы не трогаем. Покрыто тестами.
 */

const ALPHABETS = [
  'abcdefghijklmnopqrstuvwxyz',
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  'абвгдеёжзийклмнопрстуфхцчшщъыьэюя',
  'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ',
];

/** Максимальная осмысленная длина сдвига (кириллица, 33 буквы). */
export const MAX_SHIFT = 32;

export function shiftChar(ch: string, shift: number): string {
  for (const alpha of ALPHABETS) {
    const idx = alpha.indexOf(ch);
    if (idx !== -1) {
      const len = alpha.length;
      const next = (((idx + shift) % len) + len) % len;
      return alpha[next];
    }
  }
  return ch;
}

/** Шифрует текст сдвигом на shift позиций. */
export function caesarShift(text: string, shift: number): string {
  return Array.from(text)
    .map((ch) => shiftChar(ch, shift))
    .join('');
}

/** Дешифрует текст, зашифрованный сдвигом shift. */
export function caesarDecode(text: string, shift: number): string {
  return caesarShift(text, -shift);
}

/** Верно ли, что применение shift к encoded даёт целевой текст. */
export function decodesTo(encoded: string, shift: number, target: string): boolean {
  return caesarShift(encoded, shift) === target;
}
