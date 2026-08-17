import { describe, expect, it } from 'vitest';
import {
  checkTask,
  contributionPerPurchase,
  formatSom,
  ltv,
  monthlyContribution,
  paybackMonths,
  verdict,
  type UnitInput,
  type UnitTask,
} from './logic';
import { DEFAULT_INPUT, DEFAULT_TASKS } from './data';

const base: UnitInput = { cac: 1000, aov: 2000, marginPct: 30, purchasesPerMonth: 1, lifetimeMonths: 6 };

describe('contributionPerPurchase', () => {
  it('доля маржи от чека', () => {
    expect(contributionPerPurchase(2000, 30)).toBe(600);
    expect(contributionPerPurchase(500, 40)).toBe(200);
  });

  it('нулевые и отрицательные входы дают 0', () => {
    expect(contributionPerPurchase(0, 30)).toBe(0);
    expect(contributionPerPurchase(-100, 30)).toBe(0);
    expect(contributionPerPurchase(2000, 0)).toBe(0);
    expect(contributionPerPurchase(2000, -5)).toBe(0);
  });

  it('маржа выше 100% обрезается до 100%', () => {
    expect(contributionPerPurchase(1000, 150)).toBe(1000);
  });
});

describe('monthlyContribution / ltv', () => {
  it('месячная маржа и LTV перемножаются', () => {
    expect(monthlyContribution(base)).toBe(600);
    expect(ltv(base)).toBe(3600);
  });

  it('несколько покупок в месяц', () => {
    const freq = { ...base, purchasesPerMonth: 10, aov: 500, marginPct: 40, lifetimeMonths: 3 };
    expect(monthlyContribution(freq)).toBe(2000);
    expect(ltv(freq)).toBe(6000);
  });

  it('нулевая частота и нулевой срок жизни дают 0', () => {
    expect(monthlyContribution({ ...base, purchasesPerMonth: 0 })).toBe(0);
    expect(ltv({ ...base, lifetimeMonths: 0 })).toBe(0);
  });
});

describe('paybackMonths', () => {
  it('CAC / месячная маржа', () => {
    expect(paybackMonths({ ...base, cac: 1200 })).toBe(2);
    expect(paybackMonths({ ...base, cac: 9000, aov: 5000, marginPct: 30 })).toBe(6);
  });

  it('нет маржи — окупаемости нет (null)', () => {
    expect(paybackMonths({ ...base, marginPct: 0 })).toBeNull();
    expect(paybackMonths({ ...base, purchasesPerMonth: 0 })).toBeNull();
  });

  it('нулевой CAC окупается мгновенно', () => {
    expect(paybackMonths({ ...base, cac: 0 })).toBe(0);
  });
});

describe('verdict', () => {
  it('ratio < 1 — убыток', () => {
    const v = verdict({ ...base, cac: 5000 });
    expect(v.level).toBe('bad');
    expect(v.ratio).toBeCloseTo(0.72, 2);
    expect(v.text).toContain('ТЕРЯЕТ');
  });

  it('1 <= ratio < 3 — на грани', () => {
    const v = verdict({ ...base, cac: 2000 });
    expect(v.level).toBe('warning');
    expect(v.ratio).toBeCloseTo(1.8, 5);
    expect(v.text).toContain('запаса нет');
  });

  it('ratio >= 3 — здоровая экономика', () => {
    const v = verdict(base);
    expect(v.level).toBe('good');
    expect(v.ratio).toBeCloseTo(3.6, 5);
    expect(v.text).toContain('сходится');
  });

  it('CAC = 0 — особый случай без ratio', () => {
    const v = verdict({ ...base, cac: 0 });
    expect(v.ratio).toBeNull();
    expect(v.level).toBe('good');
    const dead = verdict({ ...base, cac: 0, marginPct: 0 });
    expect(dead.level).toBe('warning');
  });
});

describe('formatSom', () => {
  it('разряды разделяются пробелами', () => {
    expect(formatSom(12500)).toBe('12 500 сом');
    expect(formatSom(1234567)).toBe('1 234 567 сом');
    expect(formatSom(999)).toBe('999 сом');
    expect(formatSom(0)).toBe('0 сом');
  });

  it('округление и отрицательные значения', () => {
    expect(formatSom(1999.6)).toBe('2 000 сом');
    expect(formatSom(-1500)).toBe('−1 500 сом');
  });
});

describe('checkTask', () => {
  const task: UnitTask = { id: 't', goal: 'g', options: [1, 2], correct: 2, solution: 'Разбор.' };

  it('верный ответ хвалит и даёт разбор', () => {
    const r = checkTask(task, 2);
    expect(r.correct).toBe(true);
    expect(r.reason).toContain('Разбор');
  });

  it('неверный ответ тоже даёт разбор', () => {
    const r = checkTask(task, 1);
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('Разбор');
  });
});

describe('наборы данных', () => {
  it('дефолтный пример — здоровая экономика с payback 2 месяца', () => {
    expect(verdict(DEFAULT_INPUT).level).toBe('good');
    expect(paybackMonths(DEFAULT_INPUT)).toBe(2);
  });

  it('в задачах correct входит в options, а расчётные задачи сходятся с логикой', () => {
    for (const task of DEFAULT_TASKS) {
      expect(task.options).toContain(task.correct);
      expect(new Set(task.options).size).toBe(task.options.length);
      expect(checkTask(task, task.correct).correct).toBe(true);
    }
    // Первая задача — прямой расчёт LTV по формулам логики
    expect(ltv({ cac: 0, aov: 500, marginPct: 40, purchasesPerMonth: 10, lifetimeMonths: 3 })).toBe(6000);
    // Третья задача — прямой расчёт окупаемости
    expect(paybackMonths({ cac: 9000, aov: 5000, marginPct: 30, purchasesPerMonth: 1, lifetimeMonths: 12 })).toBe(6);
  });
});
