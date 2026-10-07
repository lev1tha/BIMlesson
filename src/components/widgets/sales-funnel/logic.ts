/**
 * Чистая логика тренажёра «Воронка продаж» — без React и без DOM.
 * Счёт по этапам, сквозная конверсия, обратный расчёт под план,
 * поиск узкого места и проверка задач. Покрыто тестами.
 */

export interface FunnelStage {
  id: string;
  name: string;
  /** Конверсия из предыдущего этапа в этот, %. */
  conversionPct: number;
}

export interface FunnelInput {
  /** Обращений на входе (первый этап воронки). */
  leads: number;
  /** Этапы после обращений, по порядку. Последний — оплата. */
  stages: FunnelStage[];
  /** Средний чек одной сделки, сом. */
  avgCheck: number;
}

/** Процент в пределах 0–100; мусор (NaN, бесконечность) считаем нулём. */
export function clampPct(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, value));
}

/** Неотрицательное конечное число; всё остальное — 0. */
function nonNegative(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/** Сквозная конверсия (доля 0–1): произведение конверсий этапов. Нет этапов — все обращения уже сделки. */
export function overallRate(stages: FunnelStage[]): number {
  return stages.reduce((rate, s) => rate * (clampPct(s.conversionPct) / 100), 1);
}

export interface FunnelSummary {
  /** Сколько дошло до каждого этапа: [обращения, этап 1, этап 2, …]. Дробные — это среднее ожидание. */
  counts: number[];
  deals: number;
  revenue: number;
  /** Сквозная конверсия, %. */
  overallPct: number;
}

export function summarize(input: FunnelInput): FunnelSummary {
  const leads = nonNegative(input.leads);
  const counts = [leads];
  for (const stage of input.stages) {
    counts.push(counts[counts.length - 1] * (clampPct(stage.conversionPct) / 100));
  }
  const deals = counts[counts.length - 1];
  return {
    counts,
    deals,
    revenue: deals * nonNegative(input.avgCheck),
    overallPct: overallRate(input.stages) * 100,
  };
}

export interface PlanResult {
  /** Сколько сделок нужно (округление вверх: полсделки не бывает). */
  dealsNeeded: number;
  /** Сколько обращений нужно на входе (тоже вверх). */
  leadsNeeded: number;
}

/**
 * Обратный расчёт от плана выручки. `null`, если план недостижим при любом
 * числе обращений: нулевой чек или какой-то этап с конверсией 0%.
 */
export function planLeads(planRevenue: number, avgCheck: number, stages: FunnelStage[]): PlanResult | null {
  const plan = nonNegative(planRevenue);
  const check = nonNegative(avgCheck);
  const rate = overallRate(stages);
  if (plan === 0) return { dealsNeeded: 0, leadsNeeded: 0 };
  if (check === 0 || rate === 0) return null;
  const dealsNeeded = Math.ceil(plan / check);
  // Погрешность плавающей точки (20 / 0.1 = 200.00000000000003) не должна добавлять лишнее обращение.
  const leadsNeeded = Math.ceil(dealsNeeded / rate - 1e-9);
  return { dealsNeeded, leadsNeeded };
}

/** Копия воронки, где конверсия одного этапа выросла на `deltaPp` процентных пунктов (не выше 100%). */
export function boostStage(input: FunnelInput, stageId: string, deltaPp: number): FunnelInput {
  return {
    ...input,
    stages: input.stages.map((s) =>
      s.id === stageId ? { ...s, conversionPct: clampPct(clampPct(s.conversionPct) + deltaPp) } : s,
    ),
  };
}

export interface StageGain {
  stageId: string;
  /** На сколько сом вырастет выручка, если поднять этап на deltaPp п. п. */
  gain: number;
}

/** Прирост выручки от улучшения каждого этапа на deltaPp п. п. */
export function stageGains(input: FunnelInput, deltaPp = 5): StageGain[] {
  const base = summarize(input).revenue;
  return input.stages.map((s) => ({
    stageId: s.id,
    gain: summarize(boostStage(input, s.id, deltaPp)).revenue - base,
  }));
}

/**
 * Узкое место — этап, улучшение которого на deltaPp п. п. даёт наибольший прирост
 * выручки. При равенстве — более ранний этап. Нет этапов — `null`.
 */
export function bottleneck(input: FunnelInput, deltaPp = 5): StageGain | null {
  const gains = stageGains(input, deltaPp);
  if (gains.length === 0) return null;
  return gains.reduce((best, g) => (g.gain > best.gain + 1e-9 ? g : best));
}

/** «12 500 сом» — до целого сома, пробелы между разрядами. */
export function formatSom(value: number): string {
  const rounded = Math.round(value);
  const grouped = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${rounded < 0 ? '−' : ''}${grouped} сом`;
}

/** Склонение по числу: plural(3, ['сделка', 'сделки', 'сделок']) → «сделки». */
export function plural(n: number, forms: [string, string, string]): string {
  const abs = Math.abs(Math.trunc(n));
  const mod10 = abs % 10;
  const mod100 = abs % 100;
  if (mod10 === 1 && mod100 !== 11) return forms[0];
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return forms[1];
  return forms[2];
}

/** «2,25%» — до двух знаков после запятой, лишние нули убираем. */
export function formatPct(value: number): string {
  const fixed = (Math.round(value * 100) / 100).toFixed(2).replace(/\.?0+$/, '');
  return `${fixed.replace('.', ',')}%`;
}

// ── Задачи ────────────────────────────────────────────────────────────────

/** Изменение воронки в задаче «что выгоднее». */
export interface FunnelChange {
  id: string;
  name: string;
  /** Во сколько раз меняется число обращений (1.5 = +50%). */
  leadsFactor?: number;
  /** Какой этап поднять и на сколько п. п. */
  stageId?: string;
  deltaPp?: number;
  /** Сколько стоит изменение, сом. */
  cost: number;
}

export type FunnelTask =
  | { kind: 'bottleneck'; id: string; question: string; input: FunnelInput }
  | { kind: 'plan'; id: string; question: string; input: FunnelInput; planRevenue: number; options: number[] }
  | { kind: 'compare'; id: string; question: string; input: FunnelInput; changes: FunnelChange[] };

export interface CheckResult {
  correct: boolean;
  reason: string;
}

/** Воронка после изменения. */
export function applyChange(input: FunnelInput, change: FunnelChange): FunnelInput {
  const withLeads = { ...input, leads: nonNegative(input.leads) * nonNegative(change.leadsFactor ?? 1) };
  return change.stageId ? boostStage(withLeads, change.stageId, change.deltaPp ?? 0) : withLeads;
}

/** Прибыль от изменения: прирост выручки минус его стоимость. */
export function changeProfit(input: FunnelInput, change: FunnelChange): number {
  return summarize(applyChange(input, change)).revenue - summarize(input).revenue - nonNegative(change.cost);
}

function stageName(input: FunnelInput, id: string): string {
  return input.stages.find((s) => s.id === id)?.name ?? id;
}

/** Правильный ответ задачи: id этапа, число обращений или id изменения. */
export function correctAnswer(task: FunnelTask): string {
  switch (task.kind) {
    case 'bottleneck':
      return bottleneck(task.input)?.stageId ?? '';
    case 'plan':
      return String(planLeads(task.planRevenue, task.input.avgCheck, task.input.stages)?.leadsNeeded ?? '');
    case 'compare':
      return task.changes.reduce((best, c) =>
        changeProfit(task.input, c) > changeProfit(task.input, best) ? c : best,
      ).id;
  }
}

export function checkTask(task: FunnelTask, answer: string): CheckResult {
  const correct = answer === correctAnswer(task);

  if (task.kind === 'bottleneck') {
    const gains = stageGains(task.input);
    const chosen = gains.find((g) => g.stageId === answer);
    if (!chosen) return { correct: false, reason: 'Выберите один из этапов воронки.' };
    const best = bottleneck(task.input) as StageGain;
    if (correct) {
      return {
        correct,
        reason: `Верно! +5 п. п. на этапе «${stageName(task.input, best.stageId)}» дают +${formatSom(best.gain)} выручки в месяц — больше, чем любой другой этап.`,
      };
    }
    return {
      correct,
      reason: `+5 п. п. на этапе «${stageName(task.input, chosen.stageId)}» дают только +${formatSom(chosen.gain)}, а на этапе «${stageName(task.input, best.stageId)}» — +${formatSom(best.gain)}. Те же 5 пунктов весят больше там, где конверсия ниже: они составляют большую долю от неё.`,
    };
  }

  if (task.kind === 'plan') {
    const plan = planLeads(task.planRevenue, task.input.avgCheck, task.input.stages);
    if (!plan) return { correct: false, reason: 'При такой воронке план недостижим: где-то конверсия 0% или чек 0 сом.' };
    const pct = formatPct(overallRate(task.input.stages) * 100);
    const deals = `${plan.dealsNeeded} ${plural(plan.dealsNeeded, ['сделка', 'сделки', 'сделок'])}`;
    const leads = `${plan.leadsNeeded} ${plural(plan.leadsNeeded, ['обращение', 'обращения', 'обращений'])}`;
    const path = `План ${formatSom(task.planRevenue)} / чек ${formatSom(task.input.avgCheck)} = ${deals}; сквозная конверсия ${pct}, значит ${plan.dealsNeeded} / ${pct} ≈ ${leads}.`;
    if (correct) return { correct, reason: `Верно! ${path}` };
    if (answer === String(plan.dealsNeeded)) {
      return { correct, reason: `Это число сделок, а не обращений: до оплаты доходит лишь ${pct} обратившихся. ${path}` };
    }
    return { correct, reason: `Не сходится. ${path}` };
  }

  const chosen = task.changes.find((c) => c.id === answer);
  if (!chosen) return { correct: false, reason: 'Выберите один из вариантов.' };
  const profits = task.changes.map((c) => `${c.name} → ${formatSom(changeProfit(task.input, c))}`).join('; ');
  return {
    correct,
    reason: correct
      ? `Верно! Прибыль за месяц с учётом затрат — ${profits}.`
      : `Считайте прирост выручки минус затраты: ${profits}. Больше обращений в дырявую воронку — дорогой способ расти.`,
  };
}
