/**
 * Чистая логика тренажёра «ABC/XYZ-анализ» — без React и без DOM.
 * ABC по накопленной доле выручки, XYZ по коэффициенту вариации,
 * матрица 3×3, стратегии и проверка задач. Покрыто тестами.
 */

export interface Product {
  id: string;
  name: string;
  /** Выручка по месяцам, сом. */
  monthly: number[];
}

export type Abc = 'A' | 'B' | 'C';
export type Xyz = 'X' | 'Y' | 'Z';
export type Cell = `${Abc}${Xyz}`;

export interface Thresholds {
  /** Накопленная доля ДО товара меньше этого порога → A, %. */
  aMax: number;
  /** …меньше этого → B, иначе C, %. */
  bMax: number;
  /** Коэффициент вариации не больше этого → X, %. */
  xMax: number;
  /** …не больше этого → Y, иначе Z, %. */
  yMax: number;
}

export const DEFAULT_THRESHOLDS: Thresholds = { aMax: 80, bMax: 95, xMax: 10, yMax: 25 };

/** Выручка за месяц: отрицательные и мусорные значения считаем нулём. */
function clean(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

export function total(values: number[]): number {
  return values.reduce((sum, v) => sum + clean(v), 0);
}

/**
 * Коэффициент вариации, %: стандартное отклонение генеральной совокупности
 * (делим на n) ÷ среднее × 100. Пустой ряд или нулевое среднее — `null`.
 */
export function coefficientOfVariation(values: number[]): number | null {
  if (values.length === 0) return null;
  const xs = values.map(clean);
  const mean = xs.reduce((s, v) => s + v, 0) / xs.length;
  if (mean === 0) return null;
  const variance = xs.reduce((s, v) => s + (v - mean) ** 2, 0) / xs.length;
  return (Math.sqrt(variance) / mean) * 100;
}

/** Класс по накопленной доле ДО товара: товар, «перешагнувший» порог, остаётся в старшем классе. */
export function abcClass(cumBeforePct: number, t: Thresholds = DEFAULT_THRESHOLDS): Abc {
  if (cumBeforePct < t.aMax) return 'A';
  if (cumBeforePct < t.bMax) return 'B';
  return 'C';
}

/** Класс по стабильности спроса; без продаж (`null`) — Z. */
export function xyzClass(cv: number | null, t: Thresholds = DEFAULT_THRESHOLDS): Xyz {
  if (cv === null) return 'Z';
  if (cv <= t.xMax) return 'X';
  if (cv <= t.yMax) return 'Y';
  return 'Z';
}

export interface Row {
  id: string;
  name: string;
  total: number;
  sharePct: number;
  cumBeforePct: number;
  cumPct: number;
  abc: Abc;
  cv: number | null;
  xyz: Xyz;
  cell: Cell;
}

/** Полный разбор ассортимента, по убыванию выручки (при равенстве — по названию). */
export function analyze(products: Product[], t: Thresholds = DEFAULT_THRESHOLDS): Row[] {
  const sum = products.reduce((s, p) => s + total(p.monthly), 0);
  const sorted = [...products].sort(
    (a, b) => total(b.monthly) - total(a.monthly) || a.name.localeCompare(b.name, 'ru'),
  );
  let cum = 0;
  return sorted.map((p) => {
    const t0 = total(p.monthly);
    const sharePct = sum > 0 ? (t0 / sum) * 100 : 0;
    const cumBeforePct = cum;
    cum += sharePct;
    const abc = abcClass(cumBeforePct, t);
    const cv = coefficientOfVariation(p.monthly);
    const xyz = xyzClass(cv, t);
    return { id: p.id, name: p.name, total: t0, sharePct, cumBeforePct, cumPct: cum, abc, cv, xyz, cell: `${abc}${xyz}` };
  });
}

export const CELLS: Cell[] = ['AX', 'AY', 'AZ', 'BX', 'BY', 'BZ', 'CX', 'CY', 'CZ'];

/** Какие товары попали в каждую клетку матрицы. */
export function matrix(rows: Row[]): Record<Cell, string[]> {
  const result = Object.fromEntries(CELLS.map((c) => [c, [] as string[]])) as Record<Cell, string[]>;
  for (const row of rows) result[row.cell].push(row.name);
  return result;
}

export type Policy = 'never-out' | 'buffer' | 'to-order' | 'regular' | 'periodic' | 'cut';

/** Политика запасов для клетки матрицы. */
export function policyFor(cell: Cell): Policy {
  switch (cell) {
    case 'AX':
      return 'never-out';
    case 'AY':
    case 'BX':
      return 'buffer';
    case 'AZ':
    case 'BZ':
      return 'to-order';
    case 'BY':
      return 'regular';
    case 'CX':
    case 'CY':
      return 'periodic';
    case 'CZ':
      return 'cut';
  }
}

export const POLICY_TEXT: Record<Policy, string> = {
  'never-out': 'Не допускать дефицита: автозаказ по точке заказа, небольшой страховой запас',
  buffer: 'Держать постоянно, но с заметным страховым запасом на колебания',
  'to-order': 'Не держать большой запас: заказ под проект и предоплату, минимум на полке',
  regular: 'Обычный заказ раз в неделю–две с умеренным запасом',
  periodic: 'Заказывать редко и крупно: дёшево хранить, мало влияет на выручку',
  cut: 'Кандидат на вывод из ассортимента или продажу только под заказ',
};

/** «41,01%» — два знака после запятой. */
export function formatPct(value: number): string {
  return `${value.toFixed(2).replace('.', ',')}%`;
}

/** «1 100 000 сом». */
export function formatSom(value: number): string {
  const rounded = Math.round(value);
  return `${String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ' ')} сом`;
}

// ── Задачи ────────────────────────────────────────────────────────────────

export type AbcTask =
  | { kind: 'cell'; id: string; question: string; productId: string }
  | { kind: 'policy'; id: string; question: string; cell: Cell; options: Policy[] };

export interface CheckResult {
  correct: boolean;
  reason: string;
}

export function correctAnswer(task: AbcTask, rows: Row[]): string {
  if (task.kind === 'policy') return policyFor(task.cell);
  return rows.find((r) => r.id === task.productId)?.cell ?? '';
}

function explainAbc(row: Row, t: Thresholds): string {
  const before = formatPct(row.cumBeforePct);
  const after = formatPct(row.cumPct);
  if (row.abc === 'A') {
    return `до товара накоплено ${before} — меньше ${t.aMax}%, значит A (с ним уже ${after}, но класс решает накопленное до него)`;
  }
  if (row.abc === 'B') return `до товара накоплено ${before} — от ${t.aMax}% и меньше ${t.bMax}%, значит B`;
  return `до товара накоплено ${before} — не меньше ${t.bMax}%, значит C`;
}

function explainXyz(row: Row, t: Thresholds): string {
  if (row.cv === null) return 'продаж не было вовсе — спрос непредсказуем, значит Z';
  const cv = formatPct(row.cv);
  if (row.xyz === 'X') return `CV = ${cv}, не больше ${t.xMax}% — спрос ровный, X`;
  if (row.xyz === 'Y') return `CV = ${cv}: больше ${t.xMax}%, но не больше ${t.yMax}% — Y`;
  return `CV = ${cv}, больше ${t.yMax}% — спрос скачет, Z`;
}

export function checkTask(task: AbcTask, answer: string, rows: Row[], t: Thresholds = DEFAULT_THRESHOLDS): CheckResult {
  if (task.kind === 'policy') {
    const right = policyFor(task.cell);
    if (!task.options.includes(answer as Policy)) return { correct: false, reason: 'Выберите один из вариантов.' };
    if (answer === right) return { correct: true, reason: `Верно! Для ${task.cell}: ${POLICY_TEXT[right].toLowerCase()}.` };
    return {
      correct: false,
      reason: `Для ${task.cell} это не подходит. Первая буква — вклад в выручку, вторая — предсказуемость спроса. Правильно: ${POLICY_TEXT[right].toLowerCase()}.`,
    };
  }

  const row = rows.find((r) => r.id === task.productId);
  if (!row) return { correct: false, reason: 'Такого товара нет в таблице.' };
  if (!(CELLS as string[]).includes(answer)) return { correct: false, reason: 'Выберите клетку матрицы.' };
  const abcOk = answer[0] === row.abc;
  const xyzOk = answer[1] === row.xyz;
  const why = `${explainAbc(row, t)}; ${explainXyz(row, t)}.`;
  if (abcOk && xyzOk) return { correct: true, reason: `Верно, ${row.cell}: ${why}` };
  const which = !abcOk && !xyzOk ? 'Обе буквы мимо' : !abcOk ? 'Буква ABC мимо' : 'Буква XYZ мимо';
  return { correct: false, reason: `${which}. Здесь ${row.cell}: ${why}` };
}
