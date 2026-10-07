import { describe, expect, it } from 'vitest';
import {
  checkOffer,
  cheapestOffer,
  formatSom,
  monthlyPayment,
  schedule,
  summarize,
  type CompareTask,
  type LoanInput,
} from './logic';
import { DEFAULT_INPUT, DEFAULT_TASKS } from './data';

const base: LoanInput = { amount: 36000, annualRatePct: 24, months: 12, upfrontFee: 0, monthlyFee: 0 };

describe('monthlyPayment', () => {
  it('аннуитет: 36 000 сом под 24% на год — около 3 404 сом', () => {
    expect(monthlyPayment(36000, 24, 12)).toBeCloseTo(3404.15, 2);
  });

  it('нулевая ставка — сумма делится на срок', () => {
    expect(monthlyPayment(36000, 0, 12)).toBe(3000);
  });

  it('пустая сумма или срок — платежа нет', () => {
    expect(monthlyPayment(0, 24, 12)).toBe(0);
    expect(monthlyPayment(36000, 24, 0)).toBe(0);
    expect(monthlyPayment(-1000, 24, 12)).toBe(0);
  });
});

describe('summarize', () => {
  it('переплата без комиссий', () => {
    const s = summarize(base);
    expect(s.totalPaid).toBeCloseTo(40849.75, 2);
    expect(s.overpayment).toBeCloseTo(4849.75, 2);
    expect(s.overpaymentPct).toBeCloseTo(13.47, 2);
  });

  it('разовая и ежемесячная комиссии входят в переплату', () => {
    const s = summarize({ amount: 100000, annualRatePct: 16, months: 12, upfrontFee: 1000, monthlyFee: 500 });
    expect(s.overpayment).toBeCloseTo(15877.03, 2);
  });

  it('отрицательные комиссии не уменьшают переплату', () => {
    expect(summarize({ ...base, upfrontFee: -500, monthlyFee: -10 }).overpayment).toBeCloseTo(4849.75, 2);
  });

  it('пустой кредит — нули', () => {
    expect(summarize({ ...base, amount: 0 })).toEqual({ payment: 0, totalPaid: 0, overpayment: 0, overpaymentPct: 0 });
    expect(summarize({ ...base, months: 0 }).totalPaid).toBe(0);
  });
});

describe('schedule', () => {
  it('в начале больше процентов, к концу — больше долга, остаток обнуляется', () => {
    const rows = schedule(36000, 24, 12);
    expect(rows).toHaveLength(12);
    expect(rows[0].interest).toBeCloseTo(720, 2);
    expect(rows[0].interest).toBeGreaterThan(rows[11].interest);
    expect(rows[11].principal).toBeGreaterThan(rows[0].principal);
    expect(rows[11].balance).toBe(0);
    const principalSum = rows.reduce((acc, r) => acc + r.principal, 0);
    expect(principalSum).toBeCloseTo(36000, 4);
  });

  it('без процентов весь платёж гасит долг', () => {
    const rows = schedule(1200, 0, 12);
    expect(rows[0].interest).toBe(0);
    expect(rows[0].principal).toBe(100);
    expect(rows[11].balance).toBe(0);
  });

  it('пустой кредит — пустой график', () => {
    expect(schedule(0, 20, 12)).toEqual([]);
  });
});

describe('formatSom', () => {
  it('разряды, округление и минус', () => {
    expect(formatSom(40849.75)).toBe('40 850 сом');
    expect(formatSom(999)).toBe('999 сом');
    expect(formatSom(-1500)).toBe('−1 500 сом');
  });
});

describe('cheapestOffer / checkOffer', () => {
  const task: CompareTask = DEFAULT_TASKS[0];

  it('дешевле то, где меньше полная переплата', () => {
    expect(cheapestOffer(task.offers).id).toBe('installment');
  });

  it('верный выбор — с выводом', () => {
    const r = checkOffer(task, 'installment');
    expect(r.correct).toBe(true);
    expect(r.reason).toContain('1 850');
  });

  it('неверный выбор объясняется цифрами', () => {
    const r = checkOffer(task, 'credit');
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('4 850 сом');
    expect(r.reason).toContain('3 000 сом');
    expect(r.reason).toContain('1 850 сом');
  });

  it('несуществующее предложение', () => {
    expect(checkOffer(task, 'nope').correct).toBe(false);
  });
});

describe('наборы данных', () => {
  it('ответы задач совпадают с расчётом, а выводы — с цифрами', () => {
    const [t1, t2, t3] = DEFAULT_TASKS;
    expect(cheapestOffer(t1.offers).id).toBe('installment');
    expect(cheapestOffer(t2.offers).id).toBe('short');
    expect(cheapestOffer(t3.offers).id).toBe('plain');

    const over = (task: CompareTask, id: string) =>
      summarize(task.offers.find((o) => o.id === id)!.input).overpayment;
    expect(over(t1, 'credit') - over(t1, 'installment')).toBeCloseTo(1850, -2);
    expect(over(t2, 'long') - over(t2, 'short')).toBeCloseTo(1700, -2);
    expect(over(t3, 'fee') - over(t3, 'plain')).toBeCloseTo(3700, -2);
    // В выводе первой задачи: при комиссии 5 000 сом выигрывает кредит.
    expect(summarize({ ...t1.offers[0].input, upfrontFee: 5000 }).overpayment).toBeGreaterThan(over(t1, 'credit'));
  });

  it('дефолтный ввод осмысленный', () => {
    expect(summarize(DEFAULT_INPUT).payment).toBeGreaterThan(0);
  });
});
