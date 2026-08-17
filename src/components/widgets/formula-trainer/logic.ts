/**
 * Чистая логика мини-симулятора формул (Excel/Sheets) — без React и без DOM.
 * Разбор диапазонов и вычисление базовых формул; покрыто тестами.
 */

export type Grid = Record<string, number>;

export function colToIndex(col: string): number {
  let n = 0;
  for (const ch of col.toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
}

export function indexToCol(i: number): string {
  let s = '';
  let n = i + 1;
  while (n > 0) {
    const r = (n - 1) % 26;
    s = String.fromCharCode(65 + r) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

function parseCell(ref: string): { col: number; row: number } | null {
  const m = /^([A-Za-z]+)(\d+)$/.exec(ref.trim());
  if (!m) return null;
  return { col: colToIndex(m[1]), row: parseInt(m[2], 10) };
}

function cellName(col: number, row: number): string {
  return indexToCol(col) + row;
}

/** Раскрывает диапазон 'A1:B3' в список ячеек. Некорректный диапазон → []. */
export function expandRange(range: string): string[] {
  const parts = range.split(':');
  const a = parseCell(parts[0] ?? '');
  const b = parseCell(parts[1] ?? '');
  if (!a || !b) return [];
  const cells: string[] = [];
  const c1 = Math.min(a.col, b.col);
  const c2 = Math.max(a.col, b.col);
  const r1 = Math.min(a.row, b.row);
  const r2 = Math.max(a.row, b.row);
  for (let r = r1; r <= r2; r++) {
    for (let c = c1; c <= c2; c++) cells.push(cellName(c, r));
  }
  return cells;
}

function resolveOne(ref: string, grid: Grid): number | null {
  const t = ref.trim();
  if (/^-?\d+(\.\d+)?$/.test(t)) return parseFloat(t);
  const cell = parseCell(t);
  if (!cell) return null;
  return grid[cellName(cell.col, cell.row)] ?? 0;
}

export interface FormulaResult {
  value?: number;
  error?: string;
}

/** Вычисляет формулу над сеткой. Поддержка: =SUM/AVERAGE/MAX/MIN/COUNT(диапазон|список), =A1+B1. */
export function evalFormula(formula: string, grid: Grid): FormulaResult {
  const f = formula.trim();
  if (!f.startsWith('=')) return { error: 'Формула должна начинаться с «=».' };
  const body = f.slice(1).trim();
  if (body === '') return { error: 'Пустая формула.' };

  const fn = /^([A-Za-z]+)\s*\((.+)\)$/.exec(body);
  if (fn) {
    const name = fn[1].toUpperCase();
    const inner = fn[2].trim();
    const refs = inner.includes(':') ? expandRange(inner) : inner.split(',').map((s) => s.trim());
    if (refs.length === 0) return { error: 'Не удалось разобрать диапазон.' };

    const nums: number[] = [];
    for (const r of refs) {
      const v = resolveOne(r, grid);
      if (v === null) return { error: `Не удалось разобрать «${r}».` };
      nums.push(v);
    }

    switch (name) {
      case 'SUM':
        return { value: nums.reduce((a, b) => a + b, 0) };
      case 'AVERAGE':
      case 'AVG':
        return { value: nums.reduce((a, b) => a + b, 0) / nums.length };
      case 'MAX':
        return { value: Math.max(...nums) };
      case 'MIN':
        return { value: Math.min(...nums) };
      case 'COUNT':
        return { value: nums.length };
      default:
        return { error: `Неизвестная функция ${name}.` };
    }
  }

  const nums: number[] = [];
  for (const term of body.split('+')) {
    const v = resolveOne(term, grid);
    if (v === null) return { error: 'Не удалось разобрать выражение.' };
    nums.push(v);
  }
  return { value: nums.reduce((a, b) => a + b, 0) };
}

export interface FormulaTask {
  id: string;
  prompt: string;
  expected: number;
  hint?: string;
}

export interface CheckResult {
  correct: boolean;
  reason: string;
}

export function checkFormula(task: FormulaTask, formula: string, grid: Grid): CheckResult {
  if (formula.trim() === '') return { correct: false, reason: '' };
  const res = evalFormula(formula, grid);
  if (res.error) return { correct: false, reason: res.error };
  const value = res.value ?? 0;
  if (Math.abs(value - task.expected) < 1e-9) {
    return { correct: true, reason: `Верно, получается ${value}.` };
  }
  return { correct: false, reason: `Формула считает ${value}, а нужно ${task.expected}.` };
}
