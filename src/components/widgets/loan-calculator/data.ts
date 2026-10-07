import type { CompareTask, LoanInput } from './logic';

export const DEFAULT_INPUT: LoanInput = {
  amount: 50000,
  annualRatePct: 22,
  months: 12,
  upfrontFee: 0,
  monthlyFee: 0,
};

/**
 * Три типовые ловушки сравнения: «рассрочка 0%» с комиссией, длинный срок
 * ради маленького платежа и низкая ставка с ежемесячной комиссией.
 * Цифры в выводах сверены с расчётом в тестах.
 */
export const DEFAULT_TASKS: CompareTask[] = [
  {
    id: 'installment-vs-credit',
    question: 'Телефон за 36 000 сом на 12 месяцев. Что обойдётся дешевле?',
    offers: [
      {
        id: 'installment',
        name: 'Рассрочка 0% с комиссией за оформление 3 000 сом',
        input: { amount: 36000, annualRatePct: 0, months: 12, upfrontFee: 3000, monthlyFee: 0 },
      },
      {
        id: 'credit',
        name: 'Кредит 24% годовых без комиссий',
        input: { amount: 36000, annualRatePct: 24, months: 12, upfrontFee: 0, monthlyFee: 0 },
      },
    ],
    insight:
      'Рассрочка с комиссией дешевле кредита примерно на 1 850 сом. Но будь комиссия 5 000 сом — выиграл бы кредит: «0%» не значит «бесплатно», считайте итог.',
  },
  {
    id: 'long-vs-short',
    question: 'Ноутбук за 60 000 сом. Какой кредит выйдет дешевле в итоге?',
    offers: [
      {
        id: 'long',
        name: '18% годовых на 24 месяца',
        input: { amount: 60000, annualRatePct: 18, months: 24, upfrontFee: 0, monthlyFee: 0 },
      },
      {
        id: 'short',
        name: '30% годовых на 12 месяцев',
        input: { amount: 60000, annualRatePct: 30, months: 12, upfrontFee: 0, monthlyFee: 0 },
      },
    ],
    insight:
      'Ставка выше, но срок вдвое короче — переплата меньше примерно на 1 700 сом. Зато платёж почти вдвое больше: около 5 850 сом против 3 000. Проверьте, потянете ли его.',
  },
  {
    id: 'hidden-fee',
    question: 'Кредит 100 000 сом на 12 месяцев. Где реальная цена ниже?',
    offers: [
      {
        id: 'plain',
        name: '20% годовых без комиссий',
        input: { amount: 100000, annualRatePct: 20, months: 12, upfrontFee: 0, monthlyFee: 0 },
      },
      {
        id: 'fee',
        name: '16% годовых + обслуживание 500 сом в месяц',
        input: { amount: 100000, annualRatePct: 16, months: 12, upfrontFee: 0, monthlyFee: 500 },
      },
    ],
    insight:
      'Низкая ставка проиграла: 500 сом в месяц — это 6 000 сом за год, и итоговая переплата выше примерно на 3 700 сом. Сравнивайте всё, что отдадите, а не ставку из рекламы.',
  },
];
