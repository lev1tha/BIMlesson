/**
 * Чистая логика тренажёра по Flexbox — без React и без DOM.
 * Наборы значений и проверка «совпало ли с образцом»; покрыто тестами.
 */

export const DIRECTION_OPTIONS = ['row', 'column'] as const;
export const JUSTIFY_OPTIONS = ['flex-start', 'center', 'flex-end', 'space-between', 'space-around'] as const;
export const ALIGN_OPTIONS = ['flex-start', 'center', 'flex-end', 'stretch'] as const;

export type Direction = (typeof DIRECTION_OPTIONS)[number];
export type Justify = (typeof JUSTIFY_OPTIONS)[number];
export type Align = (typeof ALIGN_OPTIONS)[number];

export interface FlexState {
  direction: Direction;
  justify: Justify;
  align: Align;
}

export interface FlexTask {
  id: string;
  title: string;
  target: FlexState;
}

export interface CheckResult {
  correct: boolean;
  reason: string;
}

/** Сверяет раскладку студента с образцом и называет, что именно не совпало. */
export function checkFlexAnswer(target: FlexState, chosen: FlexState): CheckResult {
  const diffs: string[] = [];
  if (chosen.direction !== target.direction) diffs.push('направление (flex-direction)');
  if (chosen.justify !== target.justify) diffs.push('главная ось (justify-content)');
  if (chosen.align !== target.align) diffs.push('поперечная ось (align-items)');

  if (diffs.length === 0) {
    return { correct: true, reason: 'Точь-в-точь как образец!' };
  }
  return {
    correct: false,
    reason: `Пока не совпадает: ${diffs.join(', ')}. Подстрой и сравни ещё раз.`,
  };
}

/** CSS-строка для показа студенту «как это пишется». */
export function toCss(state: FlexState): string {
  return [
    'display: flex;',
    `flex-direction: ${state.direction};`,
    `justify-content: ${state.justify};`,
    `align-items: ${state.align};`,
  ].join('\n');
}
