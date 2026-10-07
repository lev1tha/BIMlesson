/**
 * Чистая логика кредитного калькулятора — без React и без DOM.
 * Аннуитетный платёж, график погашения, полная переплата с комиссиями
 * и сравнение предложений. Покрыто тестами.
 */

export interface LoanInput {
  /** Сумма кредита, сом. */
  amount: number;
  /** Ставка, % годовых. */
  annualRatePct: number;
  /** Срок, месяцев. */
  months: number;
  /** Разовая комиссия за оформление, сом. */
  upfrontFee: number;
  /** Ежемесячная комиссия за обслуживание, сом. */
  monthlyFee: number;
}

/**
 * Аннуитетный (одинаковый каждый месяц) платёж без комиссий.
 * При нулевой ставке — просто сумма, делённая на срок.
 */
export function monthlyPayment(amount: number, annualRatePct: number, months: number): number {
  if (amount <= 0 || months <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r <= 0) return amount / months;
  return (amount * r) / (1 - Math.pow(1 + r, -months));
}

export interface LoanSummary {
  payment: number;
  totalPaid: number;
  overpayment: number;
  /** Переплата в процентах от суммы кредита. */
  overpaymentPct: number;
}

/** Сколько всего отдадите банку вместе с комиссиями и сколько из этого — переплата. */
export function summarize(input: LoanInput): LoanSummary {
  if (input.amount <= 0 || input.months <= 0) {
    return { payment: 0, totalPaid: 0, overpayment: 0, overpaymentPct: 0 };
  }
  const payment = monthlyPayment(input.amount, input.annualRatePct, input.months);
  const fees = Math.max(0, input.upfrontFee) + Math.max(0, input.monthlyFee) * input.months;
  const totalPaid = payment * input.months + fees;
  const overpayment = totalPaid - input.amount;
  return { payment, totalPaid, overpayment, overpaymentPct: (overpayment / input.amount) * 100 };
}

export interface ScheduleRow {
  month: number;
  payment: number;
  interest: number;
  principal: number;
  balance: number;
}

/** График: сколько из каждого платежа уходит на проценты, а сколько гасит долг. */
export function schedule(amount: number, annualRatePct: number, months: number): ScheduleRow[] {
  const payment = monthlyPayment(amount, annualRatePct, months);
  if (payment === 0) return [];
  const r = Math.max(0, annualRatePct) / 100 / 12;
  const rows: ScheduleRow[] = [];
  let balance = amount;
  for (let month = 1; month <= months; month++) {
    const interest = balance * r;
    const principal = payment - interest;
    balance -= principal;
    // Накопленная погрешность плавающей точки не должна давать «−0,0001 сом» в конце.
    if (Math.abs(balance) < 0.01) balance = 0;
    rows.push({ month, payment, interest, principal, balance });
  }
  return rows;
}

/** «12 500 сом» — до целого сома, пробелы между разрядами. */
export function formatSom(value: number): string {
  const rounded = Math.round(value);
  const grouped = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${rounded < 0 ? '−' : ''}${grouped} сом`;
}

export interface LoanOffer {
  id: string;
  name: string;
  input: LoanInput;
}

export interface CompareTask {
  id: string;
  question: string;
  offers: LoanOffer[];
  insight: string;
}

/** Предложение с наименьшей полной переплатой (с учётом всех комиссий). */
export function cheapestOffer(offers: LoanOffer[]): LoanOffer {
  return offers.reduce((best, offer) =>
    summarize(offer.input).overpayment < summarize(best.input).overpayment ? offer : best,
  );
}

export interface CheckResult {
  correct: boolean;
  reason: string;
}

export function checkOffer(task: CompareTask, offerId: string): CheckResult {
  const chosen = task.offers.find((o) => o.id === offerId);
  if (!chosen) {
    return { correct: false, reason: 'Выберите одно из предложений.' };
  }
  const best = cheapestOffer(task.offers);
  if (chosen.id === best.id) {
    return { correct: true, reason: `Верно! ${task.insight}` };
  }
  const chosenOver = summarize(chosen.input).overpayment;
  const bestOver = summarize(best.input).overpayment;
  return {
    correct: false,
    reason: `«${chosen.name}» — переплата ${formatSom(chosenOver)}, а «${best.name}» — ${formatSom(bestOver)}, дешевле на ${formatSom(chosenOver - bestOver)}. Сравнивайте всё, что отдадите банку, а не одну ставку или размер платежа.`,
  };
}
