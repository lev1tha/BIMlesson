/**
 * Чистая логика автогрейдера кода — без React и без DOM.
 * Сам код студента выполняется в Web Worker (side effect в index.tsx), а здесь —
 * сравнение результата с ожидаемым и формулировка вердикта. Всё покрыто тестами.
 */

export interface TestCase {
  args: unknown[];
  expected: unknown;
}

export interface RawResult {
  got?: unknown;
  error?: string;
}

export interface CaseOutcome {
  pass: boolean;
  args: string;
  expected: string;
  got: string;
  error: string | null;
}

/** Аккуратно превращает любое значение в читаемую строку для вывода студенту. */
export function formatValue(v: unknown): string {
  if (v === undefined) return 'undefined';
  if (typeof v === 'function') return 'функция';
  try {
    return JSON.stringify(v) ?? String(v);
  } catch {
    return String(v);
  }
}

/** Глубокое сравнение значений: примитивы, массивы, объекты, NaN. */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (Object.is(a, b)) return true;
  if (typeof a !== typeof b) return false;

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, i) => deepEqual(item, b[i]));
  }

  if (a && b && typeof a === 'object' && typeof b === 'object') {
    const aKeys = Object.keys(a as Record<string, unknown>);
    const bKeys = Object.keys(b as Record<string, unknown>);
    if (aKeys.length !== bKeys.length) return false;
    return aKeys.every((key) =>
      deepEqual((a as Record<string, unknown>)[key], (b as Record<string, unknown>)[key]),
    );
  }

  return false;
}

/** Сверяет результат одного прогона с ожидаемым и формирует строку для UI. */
export function judgeCase(testCase: TestCase, raw: RawResult): CaseOutcome {
  const args = testCase.args.map(formatValue).join(', ');
  const expected = formatValue(testCase.expected);

  if (raw.error) {
    return { pass: false, args, expected, got: '—', error: raw.error };
  }

  const pass = deepEqual(testCase.expected, raw.got);
  return { pass, args, expected, got: formatValue(raw.got), error: null };
}

export interface Summary {
  passed: number;
  total: number;
  allPass: boolean;
}

export function summarize(outcomes: CaseOutcome[]): Summary {
  const passed = outcomes.filter((o) => o.pass).length;
  return { passed, total: outcomes.length, allPass: outcomes.length > 0 && passed === outcomes.length };
}
