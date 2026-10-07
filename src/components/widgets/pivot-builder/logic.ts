/**
 * Чистая логика конструктора сводных таблиц — без React и без DOM.
 * Группировка, агрегаты (сумма/количество/среднее), итоги и проверка задач.
 * Покрыто тестами.
 */

export interface SaleRow {
  month: string;
  city: string;
  product: string;
  revenue: number;
  qty: number;
}

export type Dim = 'city' | 'product' | 'month';
export type Measure = 'revenue' | 'qty';
export type Agg = 'sum' | 'count' | 'avg';

export interface PivotSpec {
  rows: Dim;
  cols: Dim | null;
  value: Measure;
  agg: Agg;
}

export const DIM_LABEL: Record<Dim, string> = {
  city: 'Город',
  product: 'Товар',
  month: 'Месяц',
};

export const MEASURE_LABEL: Record<Measure, string> = {
  revenue: 'Выручка, сом',
  qty: 'Количество, шт',
};

export const AGG_LABEL: Record<Agg, string> = {
  sum: 'Сумма',
  count: 'Количество строк',
  avg: 'Среднее',
};

/** Имена функций в русском Excel / Google Таблицах — чтобы связать тренажёр с реальным инструментом. */
export const AGG_FORMULA: Record<Agg, string> = {
  sum: 'СУММ / SUM',
  count: 'СЧЁТ / COUNT',
  avg: 'СРЗНАЧ / AVERAGE',
};

/** Агрегат над набором чисел. Пустой набор — пустая ячейка (null), как в Excel. */
export function aggregate(values: number[], agg: Agg): number | null {
  if (values.length === 0) return null;
  if (agg === 'count') return values.length;
  const sum = values.reduce((acc, v) => acc + v, 0);
  return agg === 'sum' ? sum : sum / values.length;
}

/** Одно и то же поле в строках и столбцах бессмысленно — столбцы отбрасываем. */
export function normalizeSpec(spec: PivotSpec): PivotSpec {
  return spec.cols === spec.rows ? { ...spec, cols: null } : spec;
}

function uniqueInOrder(values: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const v of values) {
    if (!seen.has(v)) {
      seen.add(v);
      out.push(v);
    }
  }
  return out;
}

export interface PivotTable {
  rowKeys: string[];
  /** Пусто, если столбцы не выбраны. */
  colKeys: string[];
  cells: (number | null)[][];
  rowTotals: (number | null)[];
  colTotals: (number | null)[];
  grandTotal: number | null;
}

/**
 * Строит сводную таблицу. Итоги (в том числе «Среднее») считаются по исходным
 * строкам, а не как среднее средних — ровно как это делает Excel.
 */
export function buildPivot(data: SaleRow[], input: PivotSpec): PivotTable {
  const spec = normalizeSpec(input);
  const rows = spec.rows;
  const cols = spec.cols;
  const valuesWhere = (pred: (r: SaleRow) => boolean) =>
    data.filter(pred).map((r) => r[spec.value]);

  const rowKeys = uniqueInOrder(data.map((r) => r[rows]));
  const colKeys = cols ? uniqueInOrder(data.map((r) => r[cols])) : [];

  const cells = rowKeys.map((rk) =>
    cols
      ? colKeys.map((ck) => aggregate(valuesWhere((r) => r[rows] === rk && r[cols] === ck), spec.agg))
      : [],
  );
  const rowTotals = rowKeys.map((rk) => aggregate(valuesWhere((r) => r[rows] === rk), spec.agg));
  const colTotals = cols
    ? colKeys.map((ck) => aggregate(valuesWhere((r) => r[cols] === ck), spec.agg))
    : [];
  const grandTotal = aggregate(
    data.map((r) => r[spec.value]),
    spec.agg,
  );

  return { rowKeys, colKeys, cells, rowTotals, colTotals, grandTotal };
}

/** «19 533,3» — пробелы между разрядами, запятая, до одного знака после неё. Пусто — прочерк. */
export function formatNum(value: number | null): string {
  if (value === null) return '—';
  const rounded = Math.round(value * 10) / 10;
  const isWhole = rounded % 1 === 0;
  const [intPart, fracPart] = Math.abs(rounded).toFixed(isWhole ? 0 : 1).split('.');
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${rounded < 0 ? '−' : ''}${grouped}${fracPart ? `,${fracPart}` : ''}`;
}

export interface PivotTask {
  id: string;
  question: string;
  expected: PivotSpec;
  /** Вывод из правильной таблицы — то, ради чего аналитик её строил. */
  insight: string;
}

export interface CheckResult {
  correct: boolean;
  reason: string;
}

export function describeDims(spec: PivotSpec): string {
  const s = normalizeSpec(spec);
  return s.cols
    ? `строки «${DIM_LABEL[s.rows]}» и столбцы «${DIM_LABEL[s.cols]}»`
    : `строки «${DIM_LABEL[s.rows]}» без столбцов`;
}

const AGG_HINT: Record<string, string> = {
  'sum-count':
    'Количество строк считает, сколько записей попало в группу, а вопрос про общий объём — нужна сумма.',
  'sum-avg':
    'Среднее показывает типичную строку, а вопрос про общий итог — нужна сумма.',
  'count-sum':
    'Вопрос «сколько записей» — это количество строк: он считает строки, а не складывает значения.',
  'count-avg':
    'Вопрос «сколько записей» — это количество строк, а не средняя величина.',
  'avg-sum':
    'Сумма растёт вместе с числом строк, поэтому сравнивать группы по ней нечестно — для «средней» нужно среднее.',
  'avg-count':
    'Количество строк даёт число записей, а нужна средняя величина — среднее.',
};

/**
 * Проверка настройки сводной под вопрос. Если в задаче есть и строки, и столбцы,
 * транспонированная таблица (строки и столбцы поменяны местами) тоже засчитывается.
 */
export function checkSpec(task: PivotTask, input: PivotSpec): CheckResult {
  const spec = normalizeSpec(input);
  const exp = task.expected;

  const sameDims = spec.rows === exp.rows && spec.cols === exp.cols;
  const transposed = exp.cols !== null && spec.rows === exp.cols && spec.cols === exp.rows;
  const dimsOk = sameDims || transposed;
  const aggOk = spec.agg === exp.agg;
  // Количество строк не зависит от поля в значениях — его там можно оставить любым.
  const valueOk = exp.agg === 'count' || spec.value === exp.value;

  if (dimsOk && aggOk && valueOk) {
    const note = transposed ? ' Строки и столбцы у вас поменяны местами — это та же сводная, просто повёрнутая.' : '';
    return { correct: true, reason: `Верно!${note} ${task.insight}` };
  }
  if (!valueOk) {
    return {
      correct: false,
      reason: `В значениях должно стоять поле «${MEASURE_LABEL[exp.value]}», а у вас «${MEASURE_LABEL[spec.value]}». Сначала решите, ЧТО считаем, потом — как группируем.`,
    };
  }
  if (!aggOk) {
    return { correct: false, reason: AGG_HINT[`${exp.agg}-${spec.agg}`] };
  }
  return {
    correct: false,
    reason: `Разрез не тот: нужны ${describeDims(exp)}, а у вас ${describeDims(spec)}. Ищите в вопросе слова «по …» и «в разрезе …» — это и есть строки и столбцы.`,
  };
}
