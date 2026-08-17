import type { FormulaTask, Grid } from './logic';

export interface SpreadsheetData {
  columns: string[];
  /** Строки для отображения (строка 1 — заголовки). */
  display: (string | number)[][];
  /** Числовые ячейки для вычислений. */
  grid: Grid;
  tasks: FormulaTask[];
}

export const DEFAULT_SPREADSHEET: SpreadsheetData = {
  columns: ['A', 'B', 'C'],
  display: [
    ['Товар', 'Кол-во', 'Цена'],
    ['Кофе', 3, 250],
    ['Чай', 5, 120],
    ['Сок', 2, 180],
    ['Вода', 8, 40],
  ],
  grid: { B2: 3, B3: 5, B4: 2, B5: 8, C2: 250, C3: 120, C4: 180, C5: 40 },
  tasks: [
    { id: 'sum', prompt: 'Сумма количества всех товаров (столбец B)', expected: 18, hint: '=SUM(B2:B5)' },
    { id: 'avg', prompt: 'Средняя цена (столбец C)', expected: 147.5, hint: '=AVERAGE(C2:C5)' },
    { id: 'max', prompt: 'Самая высокая цена', expected: 250, hint: '=MAX(C2:C5)' },
    { id: 'min', prompt: 'Самая низкая цена', expected: 40, hint: '=MIN(C2:C5)' },
  ],
};
