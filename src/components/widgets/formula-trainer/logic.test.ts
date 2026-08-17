import { describe, expect, it } from 'vitest';
import { checkFormula, colToIndex, evalFormula, expandRange, indexToCol, type Grid } from './logic';
import { DEFAULT_SPREADSHEET } from './data';

const grid: Grid = DEFAULT_SPREADSHEET.grid;

describe('колонки', () => {
  it('colToIndex', () => {
    expect(colToIndex('A')).toBe(0);
    expect(colToIndex('C')).toBe(2);
    expect(colToIndex('AA')).toBe(26);
  });
  it('indexToCol', () => {
    expect(indexToCol(0)).toBe('A');
    expect(indexToCol(2)).toBe('C');
    expect(indexToCol(26)).toBe('AA');
  });
});

describe('expandRange', () => {
  it('вертикальный диапазон', () => {
    expect(expandRange('B2:B5')).toEqual(['B2', 'B3', 'B4', 'B5']);
  });
  it('прямоугольник', () => {
    expect(expandRange('A1:B2')).toEqual(['A1', 'B1', 'A2', 'B2']);
  });
  it('обратный порядок нормализуется', () => {
    expect(expandRange('B5:B2')).toEqual(['B2', 'B3', 'B4', 'B5']);
  });
  it('некорректный диапазон → []', () => {
    expect(expandRange('foo')).toEqual([]);
    expect(expandRange('A1:zz')).toEqual([]);
  });
});

describe('evalFormula', () => {
  it('SUM диапазона', () => expect(evalFormula('=SUM(B2:B5)', grid)).toEqual({ value: 18 }));
  it('AVERAGE и AVG', () => {
    expect(evalFormula('=AVERAGE(C2:C5)', grid)).toEqual({ value: 147.5 });
    expect(evalFormula('=AVG(C2:C5)', grid)).toEqual({ value: 147.5 });
  });
  it('MAX и MIN', () => {
    expect(evalFormula('=MAX(C2:C5)', grid)).toEqual({ value: 250 });
    expect(evalFormula('=MIN(C2:C5)', grid)).toEqual({ value: 40 });
  });
  it('COUNT', () => expect(evalFormula('=COUNT(B2:B5)', grid)).toEqual({ value: 4 }));
  it('список ячеек через запятую', () => expect(evalFormula('=SUM(B2, B3)', grid)).toEqual({ value: 8 }));
  it('пустая ячейка считается нулём', () => expect(evalFormula('=SUM(Z9)', grid)).toEqual({ value: 0 }));
  it('арифметика ячеек', () => expect(evalFormula('=B2+C2', grid)).toEqual({ value: 253 }));
  it('арифметика с числом', () => expect(evalFormula('=B2+5', grid)).toEqual({ value: 8 }));
  it('без = — ошибка', () => expect(evalFormula('SUM(B2:B5)', grid).error).toBeTruthy());
  it('пустая формула — ошибка', () => expect(evalFormula('=', grid).error).toBeTruthy());
  it('неизвестная функция — ошибка', () => expect(evalFormula('=FOO(B2:B5)', grid).error).toBeTruthy());
  it('битый диапазон в функции — ошибка', () => expect(evalFormula('=SUM(x:y)', grid).error).toBeTruthy());
  it('битая ячейка в списке — ошибка', () => expect(evalFormula('=SUM(B2, @)', grid).error).toBeTruthy());
  it('битый терм в арифметике — ошибка', () => expect(evalFormula('=B2+@', grid).error).toBeTruthy());
});

describe('checkFormula', () => {
  const task = { id: 't', prompt: '', expected: 18 };
  it('пустой ввод — не верно, без текста', () => {
    expect(checkFormula(task, '  ', grid)).toEqual({ correct: false, reason: '' });
  });
  it('верная формула', () => {
    expect(checkFormula(task, '=SUM(B2:B5)', grid).correct).toBe(true);
  });
  it('неверный результат объясняется', () => {
    const r = checkFormula(task, '=SUM(B2:B4)', grid);
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('18');
  });
  it('ошибка формулы прокидывается', () => {
    expect(checkFormula(task, 'SUM', grid).correct).toBe(false);
  });
});
