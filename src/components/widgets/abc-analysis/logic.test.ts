import { describe, expect, it } from 'vitest';
import {
  abcClass,
  analyze,
  checkTask,
  coefficientOfVariation,
  correctAnswer,
  CELLS,
  DEFAULT_THRESHOLDS,
  formatPct,
  formatSom,
  matrix,
  policyFor,
  POLICY_TEXT,
  total,
  xyzClass,
  type AbcTask,
} from './logic';
import { DEFAULT_PRODUCTS, DEFAULT_TASKS } from './data';

const rows = analyze(DEFAULT_PRODUCTS);
const task = (id: string) => DEFAULT_TASKS.find((t) => t.id === id) as AbcTask;
const round2 = (v: number | null) => (v === null ? null : Math.round(v * 100) / 100);

describe('total и коэффициент вариации', () => {
  it('total игнорирует отрицательные и мусорные значения', () => {
    expect(total([100, -50, Number.NaN, 200])).toBe(300);
    expect(total([])).toBe(0);
  });

  it('CV по генеральной совокупности (делим на n)', () => {
    expect(round2(coefficientOfVariation([182000, 176000, 190000, 185000, 179000, 188000]))).toBe(2.67);
    expect(round2(coefficientOfVariation([10, 10, 10]))).toBe(0);
    expect(coefficientOfVariation([2, 4])).toBeCloseTo(33.333, 2);
  });

  it('граничные случаи: пусто и нулевое среднее → null', () => {
    expect(coefficientOfVariation([])).toBeNull();
    expect(coefficientOfVariation([0, 0, 0])).toBeNull();
  });
});

describe('классы', () => {
  it('ABC по накопленной доле ДО товара: ровно на пороге — уже следующий класс', () => {
    expect(abcClass(0)).toBe('A');
    expect(abcClass(79.99)).toBe('A');
    expect(abcClass(80)).toBe('B');
    expect(abcClass(94.99)).toBe('B');
    expect(abcClass(95)).toBe('C');
  });

  it('XYZ: порог включительно, null → Z', () => {
    expect(xyzClass(10)).toBe('X');
    expect(xyzClass(10.01)).toBe('Y');
    expect(xyzClass(25)).toBe('Y');
    expect(xyzClass(25.01)).toBe('Z');
    expect(xyzClass(null)).toBe('Z');
  });

  it('свои пороги', () => {
    const t = { aMax: 70, bMax: 90, xMax: 5, yMax: 20 };
    expect(abcClass(74, t)).toBe('B');
    expect(xyzClass(8, t)).toBe('Y');
  });
});

describe('analyze на данных магазина — те же цифры, что в лекции', () => {
  it('итог 2 682 300 сом и порядок по выручке', () => {
    expect(rows.reduce((s, r) => s + r.total, 0)).toBe(2682300);
    expect(rows.map((r) => r.id)).toEqual([
      'cement', 'paint', 'screws', 'wallpaper', 'putty', 'laminate', 'gloves', 'roller', 'glue', 'garland',
    ]);
  });

  it('доли, накопленные доли, CV и клетки', () => {
    const table = rows.map((r) => [r.id, round2(r.sharePct), round2(r.cumPct), round2(r.cv), r.cell]);
    expect(table).toEqual([
      ['cement', 41.01, 41.01, 2.67, 'AX'],
      ['paint', 23.67, 64.68, 31.86, 'AZ'],
      ['screws', 9.36, 74.04, 3.21, 'AX'],
      ['wallpaper', 8.2, 82.24, 15.08, 'AY'],
      ['putty', 6.71, 88.95, 4.3, 'BX'],
      ['laminate', 5.03, 93.99, 100.82, 'BZ'],
      ['gloves', 2.05, 96.04, 2.57, 'BX'],
      ['roller', 1.49, 97.53, 22.36, 'CY'],
      ['glue', 1.35, 98.88, 1.58, 'CX'],
      ['garland', 1.12, 100, 223.61, 'CZ'],
    ]);
  });

  it('при равной выручке сортировка по названию; пустой ассортимент и нулевые продажи не ломают расчёт', () => {
    const same = analyze([
      { id: 'b', name: 'Б', monthly: [10] },
      { id: 'a', name: 'А', monthly: [10] },
    ]);
    expect(same.map((r) => r.id)).toEqual(['a', 'b']);
    expect(analyze([])).toEqual([]);
    const zero = analyze([{ id: 'z', name: 'Ноль', monthly: [0, 0] }]);
    expect(zero[0]).toMatchObject({ sharePct: 0, abc: 'A', cv: null, xyz: 'Z', cell: 'AZ' });
  });

  it('пороги меняют классы: при A до 70% обои уходят в B', () => {
    const r = analyze(DEFAULT_PRODUCTS, { ...DEFAULT_THRESHOLDS, aMax: 70 });
    expect(r.find((x) => x.id === 'wallpaper')?.abc).toBe('B');
  });
});

describe('матрица и политики', () => {
  it('раскладывает товары по 9 клеткам', () => {
    const m = matrix(rows);
    expect(Object.keys(m)).toEqual(CELLS);
    expect(m.AX).toEqual(['Цемент М400, мешок', 'Саморезы, коробка']);
    expect(m.BX).toEqual(['Шпаклёвка 25 кг', 'Перчатки рабочие']);
    expect(m.BY).toEqual([]);
  });

  it('у каждой клетки есть политика с текстом', () => {
    for (const c of CELLS) expect(POLICY_TEXT[policyFor(c)]).toBeTruthy();
    expect(policyFor('AX')).toBe('never-out');
    expect(policyFor('AZ')).toBe('to-order');
    expect(policyFor('BY')).toBe('regular');
    expect(policyFor('CX')).toBe('periodic');
    expect(policyFor('CZ')).toBe('cut');
  });
});

describe('форматирование', () => {
  it('проценты с запятой, сомы с разрядами', () => {
    expect(formatPct(41.0129)).toBe('41,01%');
    expect(formatSom(2682300)).toBe('2 682 300 сом');
  });
});

describe('задачи', () => {
  it('правильные ответы', () => {
    expect(correctAnswer(task('wallpaper'), rows)).toBe('AY');
    expect(correctAnswer(task('laminate'), rows)).toBe('BZ');
    expect(correctAnswer(task('gloves'), rows)).toBe('BX');
    expect(correctAnswer(task('policy-az'), rows)).toBe('to-order');
    expect(correctAnswer(task('policy-cz'), rows)).toBe('cut');
    expect(correctAnswer({ kind: 'cell', id: 'x', question: '?', productId: 'нет' }, rows)).toBe('');
  });

  it('варианты задач на политику содержат правильный', () => {
    for (const t of DEFAULT_TASKS) if (t.kind === 'policy') expect(t.options).toContain(policyFor(t.cell));
  });

  it('клетка: объяснение «перешагнувшего» порог и разбор ошибок', () => {
    const ok = checkTask(task('wallpaper'), 'AY', rows);
    expect(ok.correct).toBe(true);
    expect(ok.reason).toContain('74,04%');
    expect(ok.reason).toContain('15,08%');
    expect(checkTask(task('wallpaper'), 'BY', rows).reason).toMatch(/^Буква ABC мимо/);
    expect(checkTask(task('wallpaper'), 'AX', rows).reason).toMatch(/^Буква XYZ мимо/);
    expect(checkTask(task('wallpaper'), 'CZ', rows).reason).toMatch(/^Обе буквы мимо/);
  });

  it('объяснения для B, C, X, Z и товара без продаж', () => {
    expect(checkTask(task('gloves'), 'BX', rows).reason).toContain('значит B');
    expect(checkTask(task('gloves'), 'BX', rows).reason).toContain('ровный, X');
    expect(checkTask(task('laminate'), 'BZ', rows).reason).toContain('скачет, Z');
    const garland: AbcTask = { kind: 'cell', id: 'g', question: '?', productId: 'garland' };
    expect(checkTask(garland, 'CZ', rows).reason).toContain('значит C');
    const zeroRows = analyze([{ id: 'z', name: 'Ноль', monthly: [0] }]);
    expect(checkTask({ kind: 'cell', id: 'z', question: '?', productId: 'z' }, 'AZ', zeroRows).reason).toContain(
      'продаж не было',
    );
  });

  it('клетка: мусорный ответ и несуществующий товар', () => {
    expect(checkTask(task('gloves'), 'QQ', rows).reason).toContain('Выберите клетку');
    expect(checkTask({ kind: 'cell', id: 'x', question: '?', productId: 'нет' }, 'AX', rows).reason).toContain(
      'нет в таблице',
    );
  });

  it('политика: верно, неверно, чужой вариант', () => {
    expect(checkTask(task('policy-az'), 'to-order', rows).correct).toBe(true);
    const wrong = checkTask(task('policy-az'), 'never-out', rows);
    expect(wrong.correct).toBe(false);
    expect(wrong.reason).toContain('предсказуемость');
    expect(checkTask(task('policy-az'), 'buffer', rows).reason).toContain('Выберите');
  });
});
