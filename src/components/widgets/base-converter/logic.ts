/**
 * Чистая логика конвертера систем счисления — без React и без DOM.
 * Разбор и перевод между двоичной, десятичной и шестнадцатеричной; покрыто тестами.
 */

export type Base = 2 | 10 | 16;

export const BASE_LABEL: Record<Base, string> = {
  2: 'двоичная',
  10: 'десятичная',
  16: 'шестнадцатеричная',
};

/** Разбирает строку как число в указанной системе. Некорректный ввод → null. */
export function parseInBase(input: string, base: Base): number | null {
  const s = input.trim().toLowerCase();
  if (s === '') return null;
  const pattern = base === 2 ? /^[01]+$/ : base === 16 ? /^[0-9a-f]+$/ : /^\d+$/;
  if (!pattern.test(s)) return null;
  const n = parseInt(s, base);
  return Number.isNaN(n) ? null : n;
}

/** Переводит число в строку в указанной системе (буквы hex — заглавные). */
export function toBase(n: number, base: Base): string {
  return n.toString(base).toUpperCase();
}

export interface ConvTask {
  id: string;
  value: number;
  from: Base;
  to: Base;
}

export interface CheckResult {
  correct: boolean;
  reason: string;
}

export function checkConversion(task: ConvTask, answer: string): CheckResult {
  const parsed = parseInBase(answer, task.to);
  if (parsed === null) {
    return { correct: false, reason: `Не похоже на число в ${BASE_LABEL[task.to]} системе.` };
  }
  if (parsed === task.value) {
    return { correct: true, reason: `Верно: ${toBase(task.value, task.to)} (${BASE_LABEL[task.to]}).` };
  }
  return {
    correct: false,
    reason: `Пока нет. ${toBase(task.value, task.from)} в ${BASE_LABEL[task.from]} — это ${toBase(task.value, task.to)} в ${BASE_LABEL[task.to]}.`,
  };
}
