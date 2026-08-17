/**
 * Чистая логика калькулятора юнит-экономики — без React и без DOM.
 * LTV, CAC, маржинальная прибыль, окупаемость и вердикт «сходится ли бизнес».
 * Покрыто тестами.
 */

export interface UnitInput {
  /** Стоимость привлечения одного клиента, сом. */
  cac: number;
  /** Средний чек одной покупки, сом. */
  aov: number;
  /** Маржинальность, % от чека (что остаётся после прямых затрат). */
  marginPct: number;
  /** Покупок в месяц у одного клиента. */
  purchasesPerMonth: number;
  /** Сколько месяцев клиент остаётся с компанией. */
  lifetimeMonths: number;
}

/** Маржинальная прибыль с одной покупки, сом. */
export function contributionPerPurchase(aov: number, marginPct: number): number {
  if (aov <= 0 || marginPct <= 0) return 0;
  return (aov * Math.min(100, marginPct)) / 100;
}

/** Маржинальная прибыль с клиента в месяц, сом. */
export function monthlyContribution(input: UnitInput): number {
  if (input.purchasesPerMonth <= 0) return 0;
  return contributionPerPurchase(input.aov, input.marginPct) * input.purchasesPerMonth;
}

/** LTV — маржинальная прибыль с клиента за всю его жизнь, сом. */
export function ltv(input: UnitInput): number {
  if (input.lifetimeMonths <= 0) return 0;
  return monthlyContribution(input) * input.lifetimeMonths;
}

/** За сколько месяцев вернётся CAC. null — не вернётся никогда (нет прибыли). */
export function paybackMonths(input: UnitInput): number | null {
  const monthly = monthlyContribution(input);
  if (monthly <= 0) return null;
  if (input.cac <= 0) return 0;
  return input.cac / monthly;
}

export type HealthLevel = 'bad' | 'warning' | 'good';

export interface Verdict {
  ratio: number | null;
  level: HealthLevel;
  text: string;
}

/**
 * Вердикт по отношению LTV/CAC. Отраслевой ориентир:
 * меньше 1 — убыток на каждом клиенте, 1–3 — на грани, от 3 — здоровая экономика.
 */
export function verdict(input: UnitInput): Verdict {
  const value = ltv(input);
  if (input.cac <= 0) {
    return {
      ratio: null,
      level: value > 0 ? 'good' : 'warning',
      text: 'Бесплатное привлечение — редкая роскошь: любой положительный LTV делает клиента прибыльным.',
    };
  }
  const ratio = value / input.cac;
  if (ratio < 1) {
    return {
      ratio,
      level: 'bad',
      text: `LTV/CAC = ${ratio.toFixed(1)}: на каждом привлечённом клиенте бизнес ТЕРЯЕТ деньги. Масштабировать рекламу нельзя — убыток вырастет вместе с ней.`,
    };
  }
  if (ratio < 3) {
    return {
      ratio,
      level: 'warning',
      text: `LTV/CAC = ${ratio.toFixed(1)}: клиент окупается, но запаса нет — экономика не выдержит роста цены рекламы или оттока. Ориентир здоровья — от 3.`,
    };
  }
  return {
    ratio,
    level: 'good',
    text: `LTV/CAC = ${ratio.toFixed(1)}: на каждый сом привлечения бизнес возвращает ${ratio.toFixed(1)} сома маржи — экономика сходится, канал можно масштабировать.`,
  };
}

/** «12 500 сом» — округление до целого сома, пробелы между разрядами. */
export function formatSom(value: number): string {
  const rounded = Math.round(value);
  const sign = rounded < 0 ? '−' : '';
  const digits = String(Math.abs(rounded));
  let out = '';
  for (let i = 0; i < digits.length; i++) {
    const fromEnd = digits.length - i;
    out += digits[i];
    if (fromEnd > 1 && (fromEnd - 1) % 3 === 0) out += ' ';
  }
  return `${sign}${out} сом`;
}

export interface UnitTask {
  id: string;
  goal: string;
  options: number[];
  correct: number;
  /** Разбор решения — показывается после ответа. */
  solution: string;
}

export interface CheckResult {
  correct: boolean;
  reason: string;
}

export function checkTask(task: UnitTask, chosen: number): CheckResult {
  if (chosen === task.correct) {
    return { correct: true, reason: `Верно! ${task.solution}` };
  }
  return { correct: false, reason: `Нет. ${task.solution}` };
}
