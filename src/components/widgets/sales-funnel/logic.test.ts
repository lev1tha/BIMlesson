import { describe, expect, it } from 'vitest';
import {
  applyChange,
  boostStage,
  bottleneck,
  changeProfit,
  checkTask,
  clampPct,
  correctAnswer,
  formatPct,
  formatSom,
  plural,
  overallRate,
  planLeads,
  stageGains,
  summarize,
  type FunnelInput,
  type FunnelTask,
} from './logic';
import { DEFAULT_INPUT, DEFAULT_PLAN, DEFAULT_TASKS } from './data';

const task = (id: string) => DEFAULT_TASKS.find((t) => t.id === id) as FunnelTask;

describe('clampPct', () => {
  it('держит процент в 0–100, мусор → 0', () => {
    expect(clampPct(45)).toBe(45);
    expect(clampPct(-5)).toBe(0);
    expect(clampPct(140)).toBe(100);
    expect(clampPct(Number.NaN)).toBe(0);
    expect(clampPct(Infinity)).toBe(0);
  });
});

describe('summarize', () => {
  it('студия мебели: 400 → 240 → 120 → 48 → 36 → 9 оплат, 720 000 сом, 2,25%', () => {
    const s = summarize(DEFAULT_INPUT);
    expect(s.counts.map((c) => Math.round(c * 1e6) / 1e6)).toEqual([400, 240, 120, 48, 36, 9]);
    expect(s.deals).toBeCloseTo(9);
    expect(Math.round(s.revenue)).toBe(720000);
    expect(s.overallPct).toBeCloseTo(2.25);
  });

  it('без этапов все обращения — сделки', () => {
    const s = summarize({ leads: 10, avgCheck: 100, stages: [] });
    expect(s.deals).toBe(10);
    expect(s.overallPct).toBe(100);
    expect(overallRate([])).toBe(1);
  });

  it('граничные случаи: отрицательные и NaN обращения/чек → 0, конверсия больше 100 обрезается', () => {
    expect(summarize({ leads: -5, avgCheck: 100, stages: [] }).revenue).toBe(0);
    expect(summarize({ leads: Number.NaN, avgCheck: 100, stages: [] }).deals).toBe(0);
    expect(summarize({ leads: 10, avgCheck: -1, stages: [] }).revenue).toBe(0);
    const over = summarize({ leads: 10, avgCheck: 1, stages: [{ id: 'a', name: 'A', conversionPct: 150 }] });
    expect(over.deals).toBe(10);
  });
});

describe('planLeads', () => {
  it('план 2 400 000: 30 сделок и 1 334 обращения, как в лекции', () => {
    expect(planLeads(DEFAULT_PLAN, DEFAULT_INPUT.avgCheck, DEFAULT_INPUT.stages)).toEqual({
      dealsNeeded: 30,
      leadsNeeded: 1334,
    });
  });

  it('ровное деление не добавляет лишнего обращения (20 / 0,1 даёт 200,00000000000003)', () => {
    expect(planLeads(1000, 100, [{ id: 'a', name: 'A', conversionPct: 50 }])).toEqual({ dealsNeeded: 10, leadsNeeded: 20 });
    expect(planLeads(2000, 100, [{ id: 'a', name: 'A', conversionPct: 10 }])).toEqual({ dealsNeeded: 20, leadsNeeded: 200 });
  });

  it('нулевой план → ноль; нулевой чек или конверсия 0% → недостижимо', () => {
    expect(planLeads(0, 100, [])).toEqual({ dealsNeeded: 0, leadsNeeded: 0 });
    expect(planLeads(1000, 0, [])).toBeNull();
    expect(planLeads(1000, 100, [{ id: 'a', name: 'A', conversionPct: 0 }])).toBeNull();
  });
});

describe('boostStage и узкое место', () => {
  it('поднимает только нужный этап и не выше 100%', () => {
    const boosted = boostStage(DEFAULT_INPUT, 'offer', 40);
    expect(boosted.stages.find((s) => s.id === 'offer')?.conversionPct).toBe(100);
    expect(boosted.stages.find((s) => s.id === 'paid')?.conversionPct).toBe(25);
    expect(DEFAULT_INPUT.stages.find((s) => s.id === 'offer')?.conversionPct).toBe(75);
  });

  it('+5 п. п. дают те же суммы, что таблица в лекции: 60 / 72 / 90 / 48 / 144 тыс. сом', () => {
    const gains = Object.fromEntries(stageGains(DEFAULT_INPUT).map((g) => [g.stageId, Math.round(g.gain)]));
    expect(gains).toEqual({ lead: 60000, qualified: 72000, measure: 90000, offer: 48000, paid: 144000 });
    expect(bottleneck(DEFAULT_INPUT)?.stageId).toBe('paid');
  });

  it('при равенстве выбирается более ранний этап; без этапов — null', () => {
    const even: FunnelInput = {
      leads: 100,
      avgCheck: 10,
      stages: [
        { id: 'a', name: 'A', conversionPct: 50 },
        { id: 'b', name: 'B', conversionPct: 50 },
      ],
    };
    expect(bottleneck(even)?.stageId).toBe('a');
    expect(bottleneck({ leads: 1, avgCheck: 1, stages: [] })).toBeNull();
  });
});

describe('форматирование', () => {
  it('formatSom: разряды, округление, минус', () => {
    expect(formatSom(1440000)).toBe('1 440 000 сом');
    expect(formatSom(99.6)).toBe('100 сом');
    expect(formatSom(-2500)).toBe('−2 500 сом');
  });

  it('formatPct: запятая и без лишнего нуля', () => {
    expect(formatPct(4.5)).toBe('4,5%');
    expect(formatPct(2.25)).toBe('2,25%');
    expect(formatPct(100)).toBe('100%');
    expect(formatPct(2.004)).toBe('2%');
  });
});

describe('plural', () => {
  const f: [string, string, string] = ['обращение', 'обращения', 'обращений'];
  it('1, 21 — одно; 2–4, 1334 — два; 5, 11–14, 0 — много', () => {
    expect(plural(1, f)).toBe('обращение');
    expect(plural(21, f)).toBe('обращение');
    expect(plural(3, f)).toBe('обращения');
    expect(plural(1334, f)).toBe('обращения');
    expect(plural(11, f)).toBe('обращений');
    expect(plural(12, f)).toBe('обращений');
    expect(plural(114, f)).toBe('обращений');
    expect(plural(0, f)).toBe('обращений');
    expect(plural(-2, f)).toBe('обращения');
  });
});

describe('изменения воронки', () => {
  const compare = task('ads-vs-sales');
  if (compare.kind !== 'compare') throw new Error('ожидалась задача compare');
  const [ads, training, crm] = compare.changes;

  it('прибыль: реклама 210 000, обучение 372 000, CRM 71 000', () => {
    expect(Math.round(changeProfit(DEFAULT_INPUT, ads))).toBe(210000);
    expect(Math.round(changeProfit(DEFAULT_INPUT, training))).toBe(372000);
    expect(Math.round(changeProfit(DEFAULT_INPUT, crm))).toBe(71000);
  });

  it('applyChange без множителя и этапа ничего не меняет', () => {
    expect(Math.round(summarize(applyChange(DEFAULT_INPUT, { id: 'x', name: 'x', cost: 0 })).revenue)).toBe(720000);
  });
});

describe('задачи по умолчанию', () => {
  it('правильные ответы', () => {
    expect(correctAnswer(task('lunch-delivery'))).toBe('trial');
    expect(correctAnswer(task('furniture-plan'))).toBe('1334');
    expect(correctAnswer(task('ads-vs-sales'))).toBe('training');
    expect(correctAnswer(task('b2b-software'))).toBe('pilot');
  });

  it('варианты задачи на план содержат правильный ответ', () => {
    const t = task('furniture-plan');
    expect(t.kind === 'plan' && t.options.includes(1334)).toBe(true);
  });

  it('узкое место: верный ответ и объяснение с суммами при ошибке', () => {
    expect(checkTask(task('lunch-delivery'), 'trial').correct).toBe(true);
    const wrong = checkTask(task('lunch-delivery'), 'replied');
    expect(wrong.correct).toBe(false);
    expect(wrong.reason).toContain('«Ответили в чате»');
    expect(wrong.reason).toContain('«Пробный обед»');
    expect(checkTask(task('lunch-delivery'), 'нет-такого').reason).toContain('Выберите');
  });

  it('план: перепутать сделки с обращениями — отдельная подсказка', () => {
    expect(checkTask(task('furniture-plan'), '1334').reason).toContain('30 сделок');
    expect(checkTask(task('furniture-plan'), '30').reason).toContain('число сделок, а не обращений');
    expect(checkTask(task('furniture-plan'), '667').reason).toContain('Не сходится');
  });

  it('план недостижим — честное объяснение', () => {
    const impossible: FunnelTask = {
      kind: 'plan',
      id: 'x',
      question: '?',
      input: { leads: 10, avgCheck: 0, stages: [] },
      planRevenue: 1000,
      options: [1],
    };
    expect(correctAnswer(impossible)).toBe('');
    expect(checkTask(impossible, '1').reason).toContain('недостижим');
  });

  it('сравнение: прибыль всех вариантов в объяснении', () => {
    expect(checkTask(task('ads-vs-sales'), 'training').correct).toBe(true);
    const wrong = checkTask(task('ads-vs-sales'), 'ads');
    expect(wrong.correct).toBe(false);
    expect(wrong.reason).toContain('372 000 сом');
    expect(checkTask(task('ads-vs-sales'), '?').reason).toContain('Выберите');
  });

  it('узкое место без этапов — ответа нет', () => {
    const empty: FunnelTask = { kind: 'bottleneck', id: 'e', question: '?', input: { leads: 1, avgCheck: 1, stages: [] } };
    expect(correctAnswer(empty)).toBe('');
  });
});
