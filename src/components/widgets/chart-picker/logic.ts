/**
 * Чистая логика тренажёра «выбери правильный график» — без React и без DOM.
 * Проверяет, подходит ли тип диаграммы под задачу. Покрыто тестами.
 */

export type ChartType = 'bar' | 'line' | 'pie' | 'scatter';

export const CHART_LABEL: Record<ChartType, string> = {
  bar: 'Столбчатая',
  line: 'Линейная',
  pie: 'Круговая',
  scatter: 'Точечная',
};

export interface ChartScenario {
  id: string;
  goal: string;
  correct: ChartType;
  why: string;
}

export interface CheckResult {
  correct: boolean;
  reason: string;
}

export function checkChart(scenario: ChartScenario, chosen: ChartType): CheckResult {
  if (chosen === scenario.correct) {
    return { correct: true, reason: `Верно! ${scenario.why}` };
  }
  return {
    correct: false,
    reason: `Лучше подойдёт «${CHART_LABEL[scenario.correct]}»: ${scenario.why}`,
  };
}
