import type { PivotSpec, PivotTask, SaleRow } from './logic';

/**
 * Выгрузка продаж небольшой кофейной сети: одна строка — продажи одного товара
 * в одном городе за месяц. Данные «плоские», как и должны быть перед сводной.
 */
export const DEFAULT_SALES: SaleRow[] = [
  { month: 'Сентябрь', city: 'Бишкек', product: 'Кофе', revenue: 42000, qty: 240 },
  { month: 'Сентябрь', city: 'Бишкек', product: 'Десерт', revenue: 18000, qty: 90 },
  { month: 'Сентябрь', city: 'Ош', product: 'Кофе', revenue: 21000, qty: 130 },
  { month: 'Сентябрь', city: 'Ош', product: 'Чай', revenue: 9000, qty: 110 },
  { month: 'Сентябрь', city: 'Каракол', product: 'Чай', revenue: 6000, qty: 75 },
  { month: 'Октябрь', city: 'Бишкек', product: 'Кофе', revenue: 47000, qty: 265 },
  { month: 'Октябрь', city: 'Бишкек', product: 'Чай', revenue: 11000, qty: 140 },
  { month: 'Октябрь', city: 'Ош', product: 'Кофе', revenue: 24000, qty: 150 },
  { month: 'Октябрь', city: 'Ош', product: 'Десерт', revenue: 12000, qty: 60 },
  { month: 'Октябрь', city: 'Каракол', product: 'Кофе', revenue: 8000, qty: 45 },
];

export const DEFAULT_SPEC: PivotSpec = { rows: 'city', cols: null, value: 'revenue', agg: 'sum' };

export const DEFAULT_TASKS: PivotTask[] = [
  {
    id: 'city-revenue',
    question: 'Какая выручка у каждого города за два месяца?',
    expected: { rows: 'city', cols: null, value: 'revenue', agg: 'sum' },
    insight: 'Бишкек — 118 000 сом из 198 000, почти 60% всей выручки сети.',
  },
  {
    id: 'product-month-qty',
    question: 'Сколько штук каждого товара продано в каждом месяце?',
    expected: { rows: 'product', cols: 'month', value: 'qty', agg: 'sum' },
    insight: 'Кофе вырос с 370 до 460 штук, а десерт просел с 90 до 60 — повод разобраться с витриной.',
  },
  {
    id: 'city-count',
    question: 'Сколько строк-отчётов прислал каждый город?',
    expected: { rows: 'city', cols: null, value: 'revenue', agg: 'count' },
    insight: 'Каракол прислал 2 отчёта против 4 у Бишкека и Оша — сравнивать города «в лоб» по сумме без учёта этого нечестно.',
  },
  {
    id: 'month-avg',
    question: 'Какая средняя выручка одной строки в каждом месяце?',
    expected: { rows: 'month', cols: null, value: 'revenue', agg: 'avg' },
    insight: 'Сентябрь — 19 200 сом, октябрь — 20 400: средняя строка выросла примерно на 6%.',
  },
  {
    id: 'city-month-revenue',
    question: 'Выручка городов в разрезе месяцев: кто растёт, а кто проседает?',
    expected: { rows: 'city', cols: 'month', value: 'revenue', agg: 'sum' },
    insight: 'Бишкек: 60 000 → 58 000, Ош: 30 000 → 36 000, Каракол: 6 000 → 8 000 — регионы растут, столица слегка просела.',
  },
];
