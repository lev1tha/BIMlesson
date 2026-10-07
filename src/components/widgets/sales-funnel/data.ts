import type { FunnelInput, FunnelTask } from './logic';

/** Студия мебели в Бишкеке из лекции «Воронка продаж и CRM»: 400 обращений, 9 оплат, 720 000 сом. */
export const DEFAULT_INPUT: FunnelInput = {
  leads: 400,
  avgCheck: 80000,
  stages: [
    { id: 'lead', name: 'Лид', conversionPct: 60 },
    { id: 'qualified', name: 'Квалифицированный лид', conversionPct: 50 },
    { id: 'measure', name: 'Замер', conversionPct: 40 },
    { id: 'offer', name: 'КП', conversionPct: 75 },
    { id: 'paid', name: 'Оплата', conversionPct: 25 },
  ],
};

export const DEFAULT_PLAN = 2400000;

/** Цифры в задачах сверены с расчётом в тестах. */
export const DEFAULT_TASKS: FunnelTask[] = [
  {
    kind: 'bottleneck',
    id: 'lunch-delivery',
    question:
      'Доставка обедов в Бишкеке: 1 200 обращений в месяц, чек абонемента 6 000 сом. Какой этап выгоднее всего поднять на 5 п. п.?',
    input: {
      leads: 1200,
      avgCheck: 6000,
      stages: [
        { id: 'replied', name: 'Ответили в чате', conversionPct: 80 },
        { id: 'trial', name: 'Пробный обед', conversionPct: 25 },
        { id: 'subscribed', name: 'Оплатили абонемент', conversionPct: 40 },
      ],
    },
  },
  {
    kind: 'plan',
    id: 'furniture-plan',
    question:
      'Студия мебели: воронка как в калькуляторе (сквозная конверсия 2,25%, чек 80 000 сом). План на месяц — 2 400 000 сом. Сколько обращений нужно?',
    input: DEFAULT_INPUT,
    planRevenue: DEFAULT_PLAN,
    options: [30, 667, 1334, 1600],
  },
  {
    kind: 'compare',
    id: 'ads-vs-sales',
    question: 'Та же студия мебели. Что принесёт больше прибыли за месяц с учётом затрат?',
    input: DEFAULT_INPUT,
    changes: [
      { id: 'ads', name: 'Реклама: +50% обращений за 150 000 сом', leadsFactor: 1.5, cost: 150000 },
      {
        id: 'training',
        name: 'Обучение менеджеров: «Оплата» +15 п. п. за 60 000 сом',
        stageId: 'paid',
        deltaPp: 15,
        cost: 60000,
      },
      {
        id: 'crm',
        name: 'CRM-напоминания: «КП» +10 п. п. за 25 000 сом',
        stageId: 'offer',
        deltaPp: 10,
        cost: 25000,
      },
    ],
  },
  {
    kind: 'bottleneck',
    id: 'b2b-software',
    question:
      'IT-компания продаёт учётную систему оптовикам Оша: 60 обращений в месяц, договор — 450 000 сом. Где узкое место?',
    input: {
      leads: 60,
      avgCheck: 450000,
      stages: [
        { id: 'meeting', name: 'Встреча', conversionPct: 50 },
        { id: 'pilot', name: 'Пилот', conversionPct: 20 },
        { id: 'contract', name: 'Договор', conversionPct: 60 },
      ],
    },
  },
];
