/**
 * Чистая логика калькулятора доступности (SLA) — без React и без DOM.
 * Перевод процентов доступности в реальное время простоя, расчёт
 * последовательных цепочек сервисов и резервирования. Покрыто тестами.
 */

export type PeriodId = 'day' | 'week' | 'month' | 'year';

export interface Period {
  id: PeriodId;
  label: string;
  seconds: number;
}

/** Месяц считаем как 30 суток, год — как 365: так делают в реальных SLA-договорах. */
export const PERIODS: Period[] = [
  { id: 'day', label: 'сутки', seconds: 24 * 60 * 60 },
  { id: 'week', label: 'неделя', seconds: 7 * 24 * 60 * 60 },
  { id: 'month', label: 'месяц (30 дней)', seconds: 30 * 24 * 60 * 60 },
  { id: 'year', label: 'год (365 дней)', seconds: 365 * 24 * 60 * 60 },
];

export const MONTH_SECONDS = 30 * 24 * 60 * 60;

/** Уровни доступности, которые реально встречаются в договорах провайдеров. */
export const SLA_LEVELS: number[] = [99, 99.5, 99.9, 99.95, 99.99, 99.999];

export function clampAvailability(availability: number): number {
  if (!Number.isFinite(availability)) return 0;
  if (availability < 0) return 0;
  if (availability > 100) return 100;
  return availability;
}

/** Сколько секунд сервис имеет право лежать за период при заданной доступности. */
export function downtimeSeconds(availability: number, periodSeconds: number): number {
  const ok = clampAvailability(availability);
  if (periodSeconds <= 0) return 0;
  return (periodSeconds * (100 - ok)) / 100;
}

/** Человеко-читаемая длительность: «43 мин 12 с», «3 ч 39 мин», «мгновение». */
export function formatDuration(seconds: number): string {
  const total = Math.max(0, Math.round(seconds));
  if (total === 0) return '0 с';
  if (total < 60) return `${total} с`;

  const days = Math.floor(total / 86400);
  const hours = Math.floor((total % 86400) / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;

  if (days > 0) return hours > 0 ? `${days} д ${hours} ч` : `${days} д`;
  if (hours > 0) return minutes > 0 ? `${hours} ч ${minutes} мин` : `${hours} ч`;
  return rest > 0 ? `${minutes} мин ${rest} с` : `${minutes} мин`;
}

/**
 * Последовательная цепочка: запрос проходит через ВСЕ звенья, поэтому
 * доступности перемножаются и итог всегда НИЖЕ самого слабого звена.
 */
export function serialAvailability(parts: number[]): number {
  if (parts.length === 0) return 100;
  const product = parts.reduce((acc, part) => acc * (clampAvailability(part) / 100), 1);
  return product * 100;
}

/**
 * Резервирование: n одинаковых копий работают параллельно, система жива,
 * пока жива хотя бы одна. Отказ всей группы = отказ всех копий сразу.
 */
export function parallelAvailability(availability: number, copies: number): number {
  const ok = clampAvailability(availability);
  const n = Math.max(1, Math.floor(copies));
  const failure = (100 - ok) / 100;
  return (1 - failure ** n) * 100;
}

export interface ChainPart {
  id: string;
  name: string;
  availability: number;
  hint: string;
}

export interface ChainItem {
  part: ChainPart;
  enabled: boolean;
  redundant: boolean;
}

export interface ChainResult {
  availability: number;
  downtimePerMonth: number;
  weakest: ChainPart | null;
  explanation: string;
}

/** Итог по собранной цепочке + объяснение, почему получилось именно столько. */
export function evaluateChain(items: ChainItem[]): ChainResult {
  const active = items.filter((item) => item.enabled);
  if (active.length === 0) {
    return {
      availability: 100,
      downtimePerMonth: 0,
      weakest: null,
      explanation: 'Пока в цепочке нет ни одного звена — включите хотя бы одно.',
    };
  }

  // Резерв ×2 считаем ДО перемножения: звено с дублем становится сильнее.
  const effective = active.map((item) => ({
    part: item.part,
    value: item.redundant ? parallelAvailability(item.part.availability, 2) : item.part.availability,
  }));
  const availability = serialAvailability(effective.map((e) => e.value));
  const weakestEntry = effective.reduce((min, entry) => (entry.value < min.value ? entry : min));
  const weakest = weakestEntry.part;

  const explanation =
    active.length === 1
      ? `Одно звено — итог равен его доступности: ${formatPercent(availability)}.`
      : `Доступности перемножаются: ${effective
          .map((entry) => formatPercent(entry.value))
          .join(' × ')} = ${formatPercent(availability)}. Итог всегда НИЖЕ самого слабого звена (${
          weakest.name
        }, ${formatPercent(weakestEntry.value)}).`;

  return {
    availability,
    downtimePerMonth: downtimeSeconds(availability, MONTH_SECONDS),
    weakest,
    explanation,
  };
}

/** Проценты доступности печатаем без «хвоста» из нулей: 99.7003 → 99.7, 100 → 100. */
export function formatPercent(value: number): string {
  return `${Number(value.toFixed(3))}%`;
}

export interface SlaTask {
  id: string;
  goal: string;
  /** Сколько минут простоя в месяц бизнес готов терпеть. */
  budgetMinutes: number;
  options: number[];
  /** Минимально достаточный уровень: дешевле нельзя, дороже — переплата. */
  correct: number;
  why: string;
}

export interface CheckResult {
  correct: boolean;
  reason: string;
}

export function checkSla(task: SlaTask, chosen: number): CheckResult {
  const downtime = downtimeSeconds(chosen, MONTH_SECONDS);
  const budget = task.budgetMinutes * 60;
  const human = formatDuration(downtime);

  if (chosen === task.correct) {
    return {
      correct: true,
      reason: `Верно: ${formatPercent(chosen)} — это ${human} простоя в месяц, а бюджет ${task.budgetMinutes} мин. ${task.why}`,
    };
  }
  if (downtime > budget) {
    return {
      correct: false,
      reason: `Мало: ${formatPercent(chosen)} разрешает ${human} простоя в месяц — больше бюджета в ${task.budgetMinutes} мин. Нужен уровень строже.`,
    };
  }
  return {
    correct: false,
    reason: `Избыточно: ${formatPercent(chosen)} (${human} в месяц) в бюджет укладывается, но каждая девятка стоит денег. Достаточно ${formatPercent(task.correct)}.`,
  };
}

/** Во сколько обходится простой при заданной цене часа downtime. */
export function downtimeCost(downtimeSecondsValue: number, costPerHour: number): number {
  if (costPerHour <= 0) return 0;
  return (Math.max(0, downtimeSecondsValue) / 3600) * costPerHour;
}
