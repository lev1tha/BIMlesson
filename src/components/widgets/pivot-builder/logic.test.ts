import { describe, expect, it } from 'vitest';
import {
  AGG_FORMULA,
  AGG_LABEL,
  aggregate,
  buildPivot,
  checkSpec,
  describeDims,
  DIM_LABEL,
  formatNum,
  MEASURE_LABEL,
  normalizeSpec,
  type PivotTask,
} from './logic';
import { DEFAULT_SALES, DEFAULT_SPEC, DEFAULT_TASKS } from './data';

describe('aggregate', () => {
  it('сумма, количество и среднее', () => {
    expect(aggregate([10, 20, 30], 'sum')).toBe(60);
    expect(aggregate([10, 20, 30], 'count')).toBe(3);
    expect(aggregate([10, 20, 30], 'avg')).toBe(20);
  });

  it('пустая группа — пустая ячейка', () => {
    expect(aggregate([], 'sum')).toBeNull();
    expect(aggregate([], 'count')).toBeNull();
  });
});

describe('normalizeSpec', () => {
  it('одинаковое поле в строках и столбцах — столбцы убираются', () => {
    expect(normalizeSpec({ rows: 'city', cols: 'city', value: 'qty', agg: 'sum' }).cols).toBeNull();
  });

  it('разные поля не трогаются', () => {
    const spec = { rows: 'city', cols: 'month', value: 'qty', agg: 'sum' } as const;
    expect(normalizeSpec(spec)).toBe(spec);
  });
});

describe('buildPivot', () => {
  it('выручка по городам без столбцов', () => {
    const t = buildPivot(DEFAULT_SALES, { rows: 'city', cols: null, value: 'revenue', agg: 'sum' });
    expect(t.rowKeys).toEqual(['Бишкек', 'Ош', 'Каракол']);
    expect(t.rowTotals).toEqual([118000, 66000, 14000]);
    expect(t.colKeys).toEqual([]);
    expect(t.cells).toEqual([[], [], []]);
    expect(t.colTotals).toEqual([]);
    expect(t.grandTotal).toBe(198000);
  });

  it('товары по месяцам в штуках, с итогами по строкам и столбцам', () => {
    const t = buildPivot(DEFAULT_SALES, { rows: 'product', cols: 'month', value: 'qty', agg: 'sum' });
    expect(t.rowKeys).toEqual(['Кофе', 'Десерт', 'Чай']);
    expect(t.colKeys).toEqual(['Сентябрь', 'Октябрь']);
    expect(t.cells).toEqual([
      [370, 460],
      [90, 60],
      [185, 140],
    ]);
    expect(t.rowTotals).toEqual([830, 150, 325]);
    expect(t.colTotals).toEqual([645, 660]);
    expect(t.grandTotal).toBe(1305);
  });

  it('пустое пересечение — пустая ячейка', () => {
    const t = buildPivot(DEFAULT_SALES, { rows: 'city', cols: 'product', value: 'revenue', agg: 'sum' });
    const karakol = t.rowKeys.indexOf('Каракол');
    const dessert = t.colKeys.indexOf('Десерт');
    expect(t.cells[karakol][dessert]).toBeNull();
  });

  it('итоговое среднее считается по строкам, а не как среднее средних', () => {
    const t = buildPivot(DEFAULT_SALES, { rows: 'month', cols: null, value: 'revenue', agg: 'avg' });
    expect(t.rowTotals).toEqual([19200, 20400]);
    expect(t.grandTotal).toBe(19800);
  });

  it('количество строк по городам', () => {
    const t = buildPivot(DEFAULT_SALES, { rows: 'city', cols: null, value: 'qty', agg: 'count' });
    expect(t.rowTotals).toEqual([4, 4, 2]);
    expect(t.grandTotal).toBe(10);
  });

  it('города по месяцам — числа из вывода задачи', () => {
    const t = buildPivot(DEFAULT_SALES, { rows: 'city', cols: 'month', value: 'revenue', agg: 'sum' });
    expect(t.cells).toEqual([
      [60000, 58000],
      [30000, 36000],
      [6000, 8000],
    ]);
  });

  it('пустые данные и одинаковое поле дважды не ломают таблицу', () => {
    const empty = buildPivot([], DEFAULT_SPEC);
    expect(empty.rowKeys).toEqual([]);
    expect(empty.grandTotal).toBeNull();
    const same = buildPivot(DEFAULT_SALES, { rows: 'city', cols: 'city', value: 'revenue', agg: 'sum' });
    expect(same.colKeys).toEqual([]);
  });
});

describe('formatNum', () => {
  it('разряды, дроби и пустые ячейки', () => {
    expect(formatNum(198000)).toBe('198 000');
    expect(formatNum(19533.333)).toBe('19 533,3');
    expect(formatNum(5)).toBe('5');
    expect(formatNum(null)).toBe('—');
    expect(formatNum(-1500)).toBe('−1 500');
  });
});

describe('describeDims', () => {
  it('со столбцами и без', () => {
    expect(describeDims({ rows: 'city', cols: 'month', value: 'qty', agg: 'sum' })).toContain('столбцы «Месяц»');
    expect(describeDims({ rows: 'city', cols: null, value: 'qty', agg: 'sum' })).toContain('без столбцов');
  });
});

describe('checkSpec', () => {
  const twoDims: PivotTask = {
    id: 't',
    question: 'q',
    expected: { rows: 'city', cols: 'month', value: 'revenue', agg: 'sum' },
    insight: 'Вывод.',
  };
  const oneDim: PivotTask = {
    id: 'o',
    question: 'q',
    expected: { rows: 'city', cols: null, value: 'revenue', agg: 'sum' },
    insight: 'Вывод.',
  };

  it('верная настройка засчитывается с выводом', () => {
    const r = checkSpec(twoDims, { rows: 'city', cols: 'month', value: 'revenue', agg: 'sum' });
    expect(r.correct).toBe(true);
    expect(r.reason).toContain('Вывод');
    expect(r.reason).not.toContain('повёрнутая');
  });

  it('транспонированная таблица тоже верна — с пояснением', () => {
    const r = checkSpec(twoDims, { rows: 'month', cols: 'city', value: 'revenue', agg: 'sum' });
    expect(r.correct).toBe(true);
    expect(r.reason).toContain('повёрнутая');
  });

  it('без столбцов транспонировать нечего — другой разрез неверен', () => {
    const r = checkSpec(oneDim, { rows: 'month', cols: null, value: 'revenue', agg: 'sum' });
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('Разрез не тот');
  });

  it('не то поле в значениях', () => {
    const r = checkSpec(oneDim, { rows: 'city', cols: null, value: 'qty', agg: 'sum' });
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('Выручка, сом');
  });

  it('для количества строк поле в значениях не важно', () => {
    const task: PivotTask = { ...oneDim, expected: { ...oneDim.expected, agg: 'count' } };
    expect(checkSpec(task, { rows: 'city', cols: null, value: 'qty', agg: 'count' }).correct).toBe(true);
  });

  it('каждая неверная агрегация объясняется по-своему', () => {
    const pairs = [
      ['sum', 'count'],
      ['sum', 'avg'],
      ['count', 'sum'],
      ['count', 'avg'],
      ['avg', 'sum'],
      ['avg', 'count'],
    ] as const;
    const reasons = new Set<string>();
    for (const [expected, chosen] of pairs) {
      const task: PivotTask = { ...oneDim, expected: { ...oneDim.expected, agg: expected } };
      const r = checkSpec(task, { rows: 'city', cols: null, value: 'revenue', agg: chosen });
      expect(r.correct).toBe(false);
      expect(r.reason.length).toBeGreaterThan(20);
      reasons.add(r.reason);
    }
    expect(reasons.size).toBe(pairs.length);
  });
});

describe('наборы данных', () => {
  it('каждая задача решается своей эталонной настройкой', () => {
    for (const task of DEFAULT_TASKS) {
      expect(checkSpec(task, task.expected).correct).toBe(true);
    }
  });

  it('у всех полей и агрегатов есть подписи', () => {
    expect(Object.keys(DIM_LABEL)).toHaveLength(3);
    expect(Object.keys(MEASURE_LABEL)).toHaveLength(2);
    expect(Object.keys(AGG_LABEL)).toHaveLength(3);
    expect(AGG_FORMULA.sum).toContain('СУММ');
  });
});
