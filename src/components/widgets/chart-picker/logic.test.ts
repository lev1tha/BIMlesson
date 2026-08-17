import { describe, expect, it } from 'vitest';
import { CHART_LABEL, checkChart } from './logic';
import { DEFAULT_SCENARIOS } from './data';

const trend = DEFAULT_SCENARIOS[0]; // line

describe('CHART_LABEL', () => {
  it('содержит все типы', () => {
    expect(CHART_LABEL.bar).toBe('Столбчатая');
    expect(CHART_LABEL.line).toBe('Линейная');
    expect(CHART_LABEL.pie).toBe('Круговая');
    expect(CHART_LABEL.scatter).toBe('Точечная');
  });
});

describe('checkChart', () => {
  it('правильный выбор', () => {
    const r = checkChart(trend, 'line');
    expect(r.correct).toBe(true);
    expect(r.reason).toContain('Верно');
  });
  it('неправильный выбор подсказывает верный тип', () => {
    const r = checkChart(trend, 'pie');
    expect(r.correct).toBe(false);
    expect(r.reason).toContain('Линейная');
  });
  it('все дефолтные сценарии согласованы (свой correct проходит)', () => {
    for (const s of DEFAULT_SCENARIOS) {
      expect(checkChart(s, s.correct).correct).toBe(true);
    }
  });
});
